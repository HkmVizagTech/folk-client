import { useCallback, useEffect, useMemo, useState } from 'react'
import { doc, runTransaction, where, serverTimestamp, increment } from '../../../lib/pgstore'
import { db } from '../../../lib/firebase'
import { useFirestore } from '../../../hooks/useFirestore'
import { useOptimisticMutation } from '../../../hooks/useOptimistic'

/**
 * Sevas, the member's registrations, and optimistic join / leave.
 * `overlay` holds the expected {status, count} for a seva until the server data catches up.
 */
export const useSevas = (user) => {
  const myQ = useMemo(() => [where('userId', '==', user?.uid || '')], [user?.uid])
  const { data: sevas, loading: sevasLoading } = useFirestore('sevas')
  const { data: myRegs, loading: regsLoading } = useFirestore('seva_registrations', myQ)
  const [overlay, setOverlay] = useState({})
  const [busy, setBusy] = useState(null)
  const [error, setError] = useState('')
  const { run } = useOptimisticMutation()

  const serverStatus = useCallback((id) => myRegs.find((r) => r.sevaId === id)?.status || null, [myRegs])

  useEffect(() => {
    setOverlay((o) => {
      const stale = Object.keys(o).filter((id) => serverStatus(id) === o[id].status)
      if (!stale.length) return o
      const next = { ...o }
      stale.forEach((id) => delete next[id])
      return next
    })
  }, [serverStatus])

  const statusOf = (id) => overlay[id]?.status ?? serverStatus(id)
  const countOf = (seva) => overlay[seva.id]?.count ?? seva.countRegistered ?? 0

  const change = async (seva, status, delta, tx) => {
    setBusy(seva.id)
    setError('')
    const before = overlay[seva.id]
    await run({
      optimistic: () => setOverlay((o) => ({ ...o, [seva.id]: { status, count: Math.max(0, countOf(seva) + delta) } })),
      commit: tx,
      rollback: () => setOverlay((o) => { const n = { ...o }; if (before) n[seva.id] = before; else delete n[seva.id]; return n }),
      onError: (e) => { console.error('Seva update error:', e); setError(e.message) },
    })
    setBusy(null)
  }

  const join = (seva) => change(seva, 'registered', 1, () => {
    const sevaRef = doc(db, 'sevas', seva.id)
    const regRef = doc(db, 'seva_registrations', `${user.uid}_${seva.id}`)
    return runTransaction(db, async (tx) => {
      const sevaDoc = await tx.get(sevaRef)
      const regDoc = await tx.get(regRef)
      if (!sevaDoc.exists()) throw new Error('Seva not found')
      if (regDoc.exists() && regDoc.data().status === 'registered') throw new Error('Already registered')
      const s = sevaDoc.data()
      if (s.countRegistered >= s.maxVolunteers) throw new Error('Seva is full')
      tx.update(sevaRef, { countRegistered: increment(1) })
      tx.set(regRef, {
        userId: user.uid, sevaId: seva.id, sevaTitle: s.title || '',
        // The roster reads userName; without it every volunteer showed as "Devotee <uid prefix>".
        userName: user.name || user.displayName || 'Devotee', userPhone: user.phone || '',
        status: 'registered', createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
      })
    })
  })

  const leave = (seva) => {
    if (!confirm('Are you sure you want to leave this Seva?')) return undefined
    return change(seva, 'cancelled', -1, () => {
      const sevaRef = doc(db, 'sevas', seva.id)
      const regRef = doc(db, 'seva_registrations', `${user.uid}_${seva.id}`)
      return runTransaction(db, async (tx) => {
        const regDoc = await tx.get(regRef)
        if (!regDoc.exists() || regDoc.data().status !== 'registered') throw new Error('No active registration found')
        tx.update(sevaRef, { countRegistered: increment(-1) })
        tx.update(regRef, { status: 'cancelled', updatedAt: serverTimestamp() })
      })
    })
  }

  const mine = myRegs.filter((r) => r.status === 'registered').length
  const completed = myRegs.filter((r) => r.status === 'completed').length

  return { sevas, loading: sevasLoading || regsLoading, statusOf, countOf, join, leave, busy, error, clearError: () => setError(''), mine, completed }
}
