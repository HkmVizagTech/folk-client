import React from 'react'
import { AlertTriangle, Cake, Flame, UserCheck, Users } from 'lucide-react'
import { StatCard } from '../../../components/common'

const MemberStats = ({ rows, attention, birthdays, programCount }) => {
  const attendedTotal = rows.reduce((n, r) => n + r.attended, 0)
  const rate = programCount && rows.length ? `${Math.round((attendedTotal / (rows.length * programCount)) * 100)}%` : '—'

  return (
    <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
      <StatCard label="Members" value={rows.length} icon={Users} tone="maroon" className="col-span-2 lg:col-span-1" />
      <StatCard label="Chanting lately" value={rows.filter((r) => r.chantGap !== null && r.chantGap <= 1).length} sub="today / yesterday" icon={Flame} tone="saffron" />
      <StatCard label="Attendance" value={rate} sub={programCount ? `last ${programCount} programs` : 'no programs yet'} icon={UserCheck} tone="green" />
      <StatCard label="Need attention" value={attention.length} icon={AlertTriangle} tone="saffron" />
      <StatCard label="Birthdays" value={birthdays.length} sub="this week" icon={Cake} tone="gold" />
    </div>
  )
}

export default MemberStats
