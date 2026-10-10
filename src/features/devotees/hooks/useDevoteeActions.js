import { useState } from 'react'
import { db } from '../../../lib/firebase'
// Postgres-backed shim, NOT the real Firebase SDK (see useFirestore).
import { setDoc, updateDoc, deleteDoc, doc, serverTimestamp } from '../../../lib/pgstore'
import { errorText } from '../lib/errors'

const rand = (n = 6) => Math.random().toString(36).slice(2, 2 + n).toUpperCase()

/**
 * Writes for the devotee list. Only an admin may set/change `role`
 * (firestore.rules enforce it too); a folks_head's payload never carries it.
 */
export const useDevoteeActions = ({ isAdmin }) => {
  const [pageError, setPageError] = useState('')

  const guarded = async (action, fallback) => {
    setPageError('')
    try {
      return await action()
    } catch (error) {
      console.error(fallback, error)
      setPageError(errorText(error, fallback))
      return undefined
    }
  }

  const save = async (form, editing) => {
    const { role, ...rest } = form
    const payload = isAdmin ? form : rest
    if (editing) {
      await updateDoc(doc(db, 'users', editing.id), { ...payload, updatedAt: serverTimestamp() })
      return
    }
    // A staff-entered record for someone who has not signed in yet. The id is
    // self-assigned and stored as `uid` too so doc.id === doc.uid like every
    // signed-up profile; the `manual_` prefix keeps it from colliding with a
    // real auth uid, so nobody can sign in as this row.
    const uid = `manual_${globalThis.crypto?.randomUUID?.() || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`}`
    await setDoc(doc(db, 'users', uid), {
      ...payload,
      uid,
      role: isAdmin ? role : 'devotee',
      qrToken: `FOLK-${Date.now().toString(36)}-${rand()}`,
      createdAt: serverTimestamp(),
      photo: `https://api.dicebear.com/7.x/avataaars/svg?seed=${form.name}`,
    })
  }

  const remove = (id) => guarded(() => deleteDoc(doc(db, 'users', id)), 'Could not delete this devotee. Please try again.')

  const generateQrToken = (devotee) => guarded(async () => {
    const qrToken = `FOLK-${devotee.id || 'D'}-${rand()}`
    await updateDoc(doc(db, 'users', devotee.id), { qrToken })
    return qrToken
  }, 'Could not generate a QR token. Please try again.')

  return { save, remove, generateQrToken, pageError, clearError: () => setPageError('') }
}
