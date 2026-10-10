import { useState } from 'react'
import { doc, deleteDoc } from '../../../lib/pgstore'
import { db } from '../../../lib/firebase'

/** Admin-only delete behind a typed slug confirmation. Irreversible, so never optimistic. */
export const useDeleteTrip = () => {
  const [target, setTarget] = useState(null)
  const [text, setText] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  const ask = (trip) => {
    setTarget(trip)
    setText('')
    setError('')
  }

  const cancel = () => { if (!deleting) setTarget(null) }

  const confirm = async () => {
    if (!target) return
    if (text.trim() !== (target.slug || '')) return
    setDeleting(true)
    setError('')
    try {
      await deleteDoc(doc(db, 'trips', target.id))
      setTarget(null)
      setText('')
    } catch (err) {
      console.error('Error deleting trip:', err)
      setError(err?.message || 'Failed to delete this trip')
    } finally {
      setDeleting(false)
    }
  }

  return { target, text, setText, deleting, error, ask, cancel, confirm }
}
