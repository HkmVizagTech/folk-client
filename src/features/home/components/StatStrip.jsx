import React from 'react'
import { Compass, Flame, Footprints, Target } from 'lucide-react'
import { StatCard } from '../../../components/common'

const StatStrip = ({ streak, longest, rounds, target, yatras, stageStep, stageTotal }) => (
  <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
    <StatCard label="Day streak" value={streak} sub={longest ? `Best: ${longest} days` : 'Start today'} icon={Flame} tone="saffron" />
    <StatCard label="Rounds today" value={rounds} sub={`Target ${target}`} icon={Target} tone="maroon" />
    <StatCard label="Journey" value={`${stageStep} of ${stageTotal}`} sub="Stage reached" icon={Footprints} tone="gold" />
    <StatCard label="My yatras" value={yatras} sub={yatras ? 'Active bookings' : 'None booked'} icon={Compass} tone="green" />
  </div>
)

export default StatStrip
