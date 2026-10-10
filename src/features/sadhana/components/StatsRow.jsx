import React from 'react'
import { Flame, Star, Trophy } from 'lucide-react'
import { StatCard } from '../../../components/common'

const StatsRow = ({ streak = 0, longest = 0, score = 0 }) => (
  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
    <StatCard label="Current streak" value={streak} sub="Days in a row" icon={Flame} tone="saffron" />
    <StatCard label="Longest record" value={longest} sub="Days" icon={Trophy} tone="gold" />
    <StatCard label="Divine score" value={Math.max(0, score)} sub="Points earned" icon={Star} tone="maroon" className="col-span-2 sm:col-span-1" />
  </div>
)

export default StatsRow
