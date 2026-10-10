import React from 'react'
import { Users, ShieldCheck, QrCode, UserPlus } from 'lucide-react'
import { StatCard } from '../../../components/common'

const DevoteeStats = ({ summary }) => (
  <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
    <StatCard label="Devotees" value={summary.total} icon={Users} tone="maroon" />
    <StatCard label="Staff" value={summary.staff} icon={ShieldCheck} tone="gold" />
    <StatCard label="QR passes" value={summary.withQr} icon={QrCode} tone="saffron" />
    <StatCard label="New this week" value={summary.recent} icon={UserPlus} tone="green" />
  </div>
)

export default DevoteeStats
