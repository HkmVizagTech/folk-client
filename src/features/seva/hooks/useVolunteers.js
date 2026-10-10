import { useState } from 'react'
import { collection, doc, getDocs, query, runTransaction, updateDoc, where, serverTimestamp, increment } from '../../../lib/pgstore'
import { db } from '../../../lib/firebase'
import { useOptimisticMutation } from '../../../hooks/useOptimistic'

/** Staff roster for one seva: load volunteers and mark them completed / cancelled. */
export const useVolunteers = () => {
  const [seva, setSeva] = useState(null)
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { run } = useOptimisticMutation()

  const load = async (target) => {
    setSeva(target)
    // Drop the previous seva's roster first so a failed read can't show it under the new title.
    setRows([])
    setError('')
    setLoading(true)
    try {
      const snap = await getDocs(query(collection(db, 'seva_registrations'), where('sevaId', '==', target.id)))
      setRows(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    } catch (e) {
      console.error('View participants error:', e)
      setError(e.message || 'Could not load the volunteer roster.')
    } finally {
      setLoading(false)
    }
  }

  const mark = async (reg, status) => {
    const setStatus = (s) => setRows((prev) => prev.map((p) => (p.id === reg.id ? { ...p, status: s } : p)))
    const regRef = doc(db, 'seva_registrations', reg.id)
    await run({
      optimistic: () => setStatus(status),
      commit: async () => {
        // Cancelling from the roster must give the slot back, or the seva stays "full" with nobody serving.
        if (status === 'cancelled' && reg.status === 'registered' && reg.sevaId) {
          const sevaRef = doc(db, 'sevas', reg.sevaId)
          await runTransaction(db, async (tx) => {
            const regDoc = await tx.get(regRef)
            if (!regDoc.exists() || regDoc.data().status !== 'registered') throw new Error('No active registration found')
            tx.update(sevaRef, { countRegistered: increment(-1) })
            tx.update(regRef, { status, updatedAt: serverTimestamp() })
          })
        } else {
          await updateDoc(regRef, { status, updatedAt: serverTimestamp() })
        }
      },
      rollback: () => setStatus(reg.status),
      onError: (e) => { console.error('Mark attendance error:', e); setError(e.message) },
    })
  }

  return { seva, rows, loading, error, load, mark, close: () => setSeva(null) }
}
