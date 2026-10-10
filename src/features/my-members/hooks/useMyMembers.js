import { useEffect, useMemo, useState } from 'react'
import { orderBy, limit } from '../../../lib/pgstore'
import { useAuth } from '../../../hooks/useAuth'
import { useMembers } from '../../../hooks/useMembers'
import { useFirestore } from '../../../hooks/useFirestore'
import { todayIST } from '../../../lib/dates'
import { attendedMap, buildRow, lastSeenMap, recentProgramsOf } from '../lib/memberMetrics'

/** Everything the page shows: the selected guide's members with their derived care signals. */
export const useMyMembers = (pendingEdits) => {
  const { user: me } = useAuth()
  const { members, staff, loading } = useMembers()

  // Firebase restores the session asynchronously, so `me` is null on first render.
  // Adopt the uid as soon as auth settles without clobbering an admin's own pick.
  const [guideId, setGuideId] = useState(me?.uid || '')
  useEffect(() => {
    if (me?.uid) setGuideId((current) => current || me.uid)
  }, [me?.uid])

  // Recent check-ins: when each member was last seen at a program.
  const attQ = useMemo(() => [orderBy('createdAt', 'desc'), limit(1500)], [])
  const { data: attendance } = useFirestore('attendance', attQ)
  const { data: events } = useFirestore('events')

  const lastSeen = useMemo(() => lastSeenMap(attendance), [attendance])
  const programs = useMemo(() => recentProgramsOf(events), [events])
  const attendedBy = useMemo(() => attendedMap(attendance, programs), [attendance, programs])

  const today = todayIST()
  const rows = useMemo(
    () => members
      .filter((m) => m.guideId === guideId && m.id !== guideId)
      .map((m) => buildRow(pendingEdits[m.id] ? { ...m, ...pendingEdits[m.id] } : m, { today, lastSeen, attendedBy, programCount: programs.length })),
    [members, guideId, pendingEdits, today, lastSeen, attendedBy, programs.length],
  )

  const attention = useMemo(() => rows.filter((r) => r.score >= 2).sort((a, b) => b.score - a.score), [rows])
  const birthdays = useMemo(() => rows.filter((r) => r.bday !== null && r.bday <= 7).sort((a, b) => a.bday - b.bday), [rows])

  return {
    me, isAdmin: me?.role === 'admin', staff, loading, today,
    guideId, setGuideId, guideName: staff.find((s) => s.id === guideId)?.displayName,
    rows, attention, birthdays, programCount: programs.length,
    members,
  }
}
