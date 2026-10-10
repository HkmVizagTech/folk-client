import { useEffect, useMemo, useRef, useState } from 'react'
import { setDoc, deleteDoc, doc, where, serverTimestamp } from '../../../lib/pgstore'
import { db } from '../../../lib/firebase'
import { useAuth } from '../../../hooks/useAuth'
import { useMembers } from '../../../hooks/useMembers'
import { useFirestore } from '../../../hooks/useFirestore'
import { useOptimisticMutation } from '../../../hooks/useOptimistic'

/**
 * Roll call for one program.
 *
 * Presence is simply whether an `attendance` record exists, with the same
 * deterministic id the QR scanner uses (`<eventId>_<uid>`), so a devotee who
 * scanned in already shows as present and un-ticking removes the record rather
 * than storing an "absent" one.
 *
 * Ticks are optimistic: the row flips instantly, and flips back with an error
 * if the write is refused. `overrides` holds those unconfirmed states until the
 * live data agrees with them.
 */
export const useRollCall = ({ eventId, eventTitle }) => {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const { members, staff, loading: membersLoading } = useMembers()

  const attQ = useMemo(() => [where('eventId', '==', eventId)], [eventId])
  const { data: attendance, loading: attLoading } = useFirestore('attendance', attQ)

  const [guideId, setGuideId] = useState(user?.uid || '')
  const [scope, setScope] = useState('mine') // 'mine' | 'all'
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const [overrides, setOverrides] = useState({})
  const [busyIds, setBusyIds] = useState({})
  const inflight = useRef(new Set())
  const { run } = useOptimisticMutation()

  const presentIds = useMemo(() => new Set(attendance.map((a) => a.userId || a.uid).filter(Boolean)), [attendance])

  useEffect(() => {
    setOverrides((current) => {
      const settled = Object.keys(current).filter((id) => presentIds.has(id) === current[id])
      if (!settled.length) return current
      const next = { ...current }
      settled.forEach((id) => delete next[id])
      return next
    })
  }, [presentIds])

  const roll = useMemo(() => {
    const term = search.trim().toLowerCase()
    return members
      .filter((m) => !m.isStaff)
      .filter((m) => (scope === 'all' ? true : m.guideId === guideId))
      .filter((m) => !term || m.displayName.toLowerCase().includes(term) || String(m.phone || '').includes(term))
      .map((m) => ({ ...m, present: overrides[m.id] ?? presentIds.has(m.id) }))
  }, [members, scope, guideId, search, presentIds, overrides])

  const toggle = async (member) => {
    if (inflight.current.has(member.id)) return
    inflight.current.add(member.id)
    setBusyIds((b) => ({ ...b, [member.id]: true }))
    setError('')
    const next = !member.present
    const ref = doc(db, 'attendance', `${eventId}_${member.id}`)
    await run({
      optimistic: () => setOverrides((o) => ({ ...o, [member.id]: next })),
      commit: () => (next
        ? setDoc(ref, {
          userId: member.id,
          name: member.displayName,
          eventId,
          session: eventTitle || 'Program',
          status: 'On-time',
          method: 'roll-call',
          markedBy: user?.uid || null,
          markedByName: user?.name || user?.displayName || 'Team',
          time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' }),
          createdAt: serverTimestamp(),
        })
        : deleteDoc(ref)),
      rollback: () => setOverrides((o) => { const rest = { ...o }; delete rest[member.id]; return rest }),
      onError: (err) => {
        console.error('Roll call failed:', err)
        setError(err.code === 'permission-denied' ? 'Only the FOLK team can mark attendance.' : 'Could not save that. Check your connection and try again.')
      },
    })
    inflight.current.delete(member.id)
    setBusyIds((b) => { const rest = { ...b }; delete rest[member.id]; return rest })
  }

  return {
    isAdmin, user, staff, roll, loading: membersLoading || attLoading,
    presentCount: roll.filter((r) => r.present).length,
    guideId, setGuideId, scope, setScope, search, setSearch,
    error, dismissError: () => setError(''), busyIds, toggle,
  }
}
