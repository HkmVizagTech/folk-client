import { useState } from 'react'
import { doc, updateDoc, serverTimestamp } from '../../../lib/pgstore'
import { auth, db } from '../../../lib/firebase'
import { toNumber } from '../lib/format'

/*
 * Cash collection is a staff attestation of money in hand, so it is never
 * optimistic. firestore.rules allow a staff update to touch ONLY status,
 * staffNotes, updatedAt, cashCollected, cashAmount, cashCollectedAt and
 * cashCollectedBy; both writes below stay inside that list.
 */
export const useCashRecording = (user) => {
  const [recordTarget, setRecordTarget] = useState(null)
  const [undoTarget, setUndoTarget] = useState(null)
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const askRecord = (reg) => {
    setRecordTarget(reg)
    setDraft(String(toNumber(reg.amountDue) || ''))
    setError('')
  }

  const askUndo = (reg) => {
    setUndoTarget(reg)
    setError('')
  }

  const confirmRecord = async () => {
    if (!recordTarget) return
    const amount = toNumber(draft)
    if (!(amount > 0)) {
      setError('Enter the amount actually received')
      return
    }
    setSaving(true)
    setError('')
    try {
      await updateDoc(doc(db, 'trip_registrations', recordTarget.id), {
        cashCollected: true,
        cashAmount: amount,
        cashCollectedAt: serverTimestamp(),
        cashCollectedBy: user?.uid || user?.name || auth.currentUser?.uid || 'staff',
        updatedAt: serverTimestamp(),
      })
      setRecordTarget(null)
      setDraft('')
    } catch (err) {
      console.error('Error recording cash:', err)
      setError(err?.message || 'Failed to record this cash payment')
    } finally {
      setSaving(false)
    }
  }

  const confirmUndo = async () => {
    if (!undoTarget) return
    setSaving(true)
    setError('')
    try {
      await updateDoc(doc(db, 'trip_registrations', undoTarget.id), {
        cashCollected: false,
        updatedAt: serverTimestamp(),
      })
      setUndoTarget(null)
    } catch (err) {
      console.error('Error undoing cash record:', err)
      setError(err?.message || 'Failed to undo this cash record')
    } finally {
      setSaving(false)
    }
  }

  return {
    recordTarget, undoTarget, draft, setDraft, saving, error,
    askRecord, askUndo, confirmRecord, confirmUndo,
    cancelRecord: () => { if (!saving) setRecordTarget(null) },
    cancelUndo: () => { if (!saving) setUndoTarget(null) },
  }
}
