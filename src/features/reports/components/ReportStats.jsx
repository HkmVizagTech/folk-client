import React from 'react'
import { CalendarCheck, Flame, UserPlus, UserX, Users } from 'lucide-react'
import { StatCard } from '../../../components/common'

const ReportStats = ({ people, stats }) => (
  <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
    <StatCard label="Members" value={people.length} icon={Users} tone="maroon" className="col-span-2 lg:col-span-1" />
    <StatCard label="New in period" value={stats.newcomers.length} icon={UserPlus} tone="green" />
    <StatCard label="Chanted this week" value={stats.chanting.length} icon={Flame} tone="saffron" />
    <StatCard label="Check-ins" value={stats.checkins.length} sub="program attendance" icon={CalendarCheck} tone="gold" />
    <StatCard label="Without a guide" value={stats.noGuide.length} icon={UserX} tone="saffron" className="col-span-2 lg:col-span-1" />
  </div>
)

export default ReportStats
