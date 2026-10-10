import { useMemo, useState } from 'react'
import { orderBy, where, Timestamp } from '../../../lib/pgstore'
import { useAuth } from '../../../hooks/useAuth'
import { useMembers } from '../../../hooks/useMembers'
import { useFirestore } from '../../../hooks/useFirestore'
import { todayIST } from '../../../lib/dates'
import { computeStats } from '../lib/reportStats'

export const useReportStats = () => {
  const { user: me } = useAuth()
  const isAdmin = me?.role === 'admin'
  const { members, staff, loading } = useMembers()
  const [period, setPeriod] = useState('30')
  const today = todayIST()
  const since = useMemo(() => new Date(Date.now() - Number(period) * 86400000), [period])

  const attQ = useMemo(() => [where('createdAt', '>=', Timestamp.fromDate(since)), orderBy('createdAt', 'desc')], [since])
  const { data: attendance } = useFirestore('attendance', attQ)
  const fuQ = useMemo(() => [where('createdAt', '>=', Timestamp.fromDate(since))], [since])
  const { data: followups } = useFirestore('followups', fuQ)

  // A guide sees their own members; an admin sees everyone.
  const scope = useMemo(() => (isAdmin ? members : members.filter((m) => m.guideId === me?.uid)), [members, isAdmin, me?.uid])
  const people = useMemo(() => scope.filter((m) => !m.isStaff), [scope])

  const stats = useMemo(
    () => computeStats({ people, scope, members, staff, attendance, followups, since, today, isAdmin }),
    [people, scope, members, staff, attendance, followups, since, today, isAdmin],
  )

  return { me, isAdmin, members, loading, period, setPeriod, today, people, stats }
}
