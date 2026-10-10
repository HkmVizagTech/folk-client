import { useCallback, useEffect, useState } from 'react'
import {
  uploadImage, deleteUploadedImage, getUploadConfig, isUploadedUrl,
} from '../../../lib/uploads'

/**
 * Per-slot upload state. Every slot that can hold an image has a key
 * ('cover', 'gallery' or `loc:<row id>`); both maps are keyed by it so two
 * slots can upload at once without their progress or errors bleeding together.
 */
export const useImageUploads = ({ uid, trips, editingId }) => {
  const [uploads, setUploads] = useState({})
  const [uploadErrors, setUploadErrors] = useState({})
  const [galleryQueue, setGalleryQueue] = useState(null)
  const [uploadConfig, setUploadConfig] = useState(null)

  // Re-asked when the signed-in user changes so a check that ran before the
  // session was restored does not leave a permanent "not configured" banner.
  useEffect(() => {
    let alive = true
    if (!uid) return () => { alive = false }
    getUploadConfig()
      .then((cfg) => { if (alive) setUploadConfig(cfg || { configured: false, reachable: false }) })
      .catch(() => { if (alive) setUploadConfig({ configured: false, reachable: false }) })
    return () => { alive = false }
  }, [uid])

  // Only a definite `false` disables the pickers.
  const uploadsConfigured = uploadConfig ? uploadConfig.configured !== false : true
  // The gallery queue keeps "busy" honest across the gap between files.
  const uploadsBusy = Object.keys(uploads).length > 0 || !!galleryQueue
  const galleryBusy = !!uploads.gallery || !!galleryQueue

  const setUploadPhase = useCallback((key, phase) => {
    setUploads((prev) => {
      if (!phase) {
        if (!(key in prev)) return prev
        const next = { ...prev }
        delete next[key]
        return next
      }
      return { ...prev, [key]: phase }
    })
  }, [])

  const setError = useCallback((key, message) => {
    setUploadErrors((prev) => ({ ...prev, [key]: message }))
  }, [])

  const clearError = useCallback((key) => {
    setUploadErrors((prev) => {
      const next = { ...prev }
      delete next[key]
      return next
    })
  }, [])

  const reset = useCallback(() => {
    setUploadErrors({})
    setGalleryQueue(null)
  }, [])

  // Compress, presign, PUT. Resolves with the stored URL, or null once the
  // failure has been recorded against this slot.
  const runUpload = useCallback(async (key, file, opts) => {
    setError(key, '')
    try {
      return await uploadImage(file, {
        ...opts,
        onProgress: (phase) => setUploadPhase(key, phase === 'done' ? null : phase),
      })
    } catch (err) {
      console.error('Image upload failed:', err)
      setError(key, err?.message || 'That image could not be uploaded')
      return null
    } finally {
      setUploadPhase(key, null)
    }
  }, [setError, setUploadPhase])

  /* Best-effort bucket cleanup. A legacy `data:` URI has no bucket object, and
   * a duplicated trip shares its image URLs with the original, so an image
   * still used by another trip is left alone. */
  const discardImage = useCallback((value) => {
    if (!value || !isUploadedUrl(value)) return
    const usedElsewhere = (trips || []).some((t) => {
      if (t.id === editingId) return false
      if (t.coverImage === value) return true
      if (Array.isArray(t.gallery) && t.gallery.includes(value)) return true
      return Array.isArray(t.locations) && t.locations.some((l) => l?.image === value)
    })
    if (!usedElsewhere) deleteUploadedImage(value)
  }, [trips, editingId])

  return {
    uploads, uploadErrors, galleryQueue, setGalleryQueue, uploadConfig,
    uploadsConfigured, uploadsBusy, galleryBusy,
    runUpload, discardImage, setError, clearError, reset,
  }
}
