import { useCallback, useEffect, useRef, useState } from 'react'
import { db } from '../../../lib/firebase'
// Postgres-backed shim, NOT the real Firebase SDK.
import { doc, setDoc, serverTimestamp } from '../../../lib/pgstore'
import { uploadImage, deleteUploadedImage, isUploadedUrl } from '../../../lib/uploads'
import { useOptimisticMutation } from '../../../hooks/useOptimistic'
import { STAFF_MANAGED_FIELDS, formFromUser } from '../lib/profileFields'
import { useToast } from './useToast'

const MAX_IMAGE_BYTES = 2 * 1024 * 1024

/** Edit-form state for the member's own profile: edit/cancel, avatar upload and an optimistic save. */
export const useProfileForm = (user, isStaff) => {
  const [form, setForm] = useState(() => formFromUser(user))
  const [isEditing, setIsEditing] = useState(false)
  const [uploading, setUploading] = useState(false)
  const { toast, show } = useToast()
  const { run, pending: saving } = useOptimisticMutation()

  // Follow the stored profile, but only when its values really changed and
  // never while the member is typing: `user` gets a new identity on every
  // background refresh, and resetting the form each time made the page blink
  // and could wipe an edit in progress.
  const stored = useRef(JSON.stringify(formFromUser(user)))
  useEffect(() => {
    if (!user) return
    const next = JSON.stringify(formFromUser(user))
    if (next === stored.current) return
    stored.current = next
    if (!isEditing) setForm(JSON.parse(next))
  }, [user, isEditing])

  const change = useCallback((name, value) => setForm((f) => ({ ...f, [name]: value })), [])

  // The form is the only copy of these values: cancelling must reset it, or a
  // cancelled edit would be quietly written by the next save.
  const cancel = useCallback(() => { setForm(formFromUser(user)); setIsEditing(false) }, [user])

  const uploadAvatar = async (file) => {
    if (!file) return
    if (file.size > MAX_IMAGE_BYTES) { show('Image size must be less than 2MB', 'error'); return }
    const previous = form.profileImage
    try {
      setUploading(true)
      // The server stores it in R2 under avatars/<uid>/; 512px is plenty for a picture never shown larger than 160px.
      const url = await uploadImage(file, { folder: 'avatar', maxWidth: 512, quality: 0.8 })
      change('profileImage', url)
      // Each upload gets its own key, so the old object is released only once its replacement is stored.
      if (previous && previous !== url && isUploadedUrl(previous)) deleteUploadedImage(previous)
      show('Image uploaded successfully!')
    } catch (e) {
      console.error('Upload error:', e)
      show(e?.message || 'That photo could not be uploaded', 'error')
    } finally {
      setUploading(false)
    }
  }

  const save = async () => {
    if (!form.name || !form.phone) { show('Name and Phone are required', 'error'); return }
    // One staff-managed key in the payload, even unchanged, costs the entire save.
    const payload = { ...form }
    if (!isStaff) STAFF_MANAGED_FIELDS.forEach((f) => delete payload[f])
    delete payload.role
    await run({
      optimistic: () => setIsEditing(false),
      commit: async () => {
        await setDoc(doc(db, 'users', user.uid), { ...payload, photo: payload.profileImage, updatedAt: serverTimestamp() }, { merge: true })
        show('Profile updated successfully!')
      },
      rollback: () => setIsEditing(true),
      onError: (e) => { console.error('Update error:', e); show(`Failed to update profile: ${e.message || 'Unknown error'}`, 'error') },
    })
  }

  return { form, change, isEditing, startEdit: () => setIsEditing(true), cancel, save, saving, uploading, uploadAvatar, toast }
}
