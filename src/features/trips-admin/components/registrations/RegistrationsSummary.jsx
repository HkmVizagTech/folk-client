import React from 'react'
import { Bus, CheckCircle2, Hourglass, Users, Wallet } from 'lucide-react'
import StatCard from '../../../../components/common/StatCard'
import { formatINR } from '../../lib/format'

/* Five across only from xl: at 1024px the content box is ~704px and a lakh-scale
 * "Collected" figure would break mid-number inside a narrower tile. */
const RegistrationsSummary = ({ summary }) => (
  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-5">
    <StatCard label="Registrations" value={summary.total} icon={Users} />
    <StatCard label="Confirmed" value={summary.confirmed} icon={CheckCircle2} tone="green" />
    <StatCard label="Seats booked" value={summary.seats} sub="confirmed only" icon={Bus} tone="maroon" />
    <StatCard
      label="Collected" tone="green" icon={Wallet}
      value={formatINR(summary.collected)}
      sub={`${formatINR(summary.online)} online · ${formatINR(summary.cash)} cash`}
    />
    <StatCard
      label="Pending" tone="gold" icon={Hourglass}
      value={formatINR(summary.pending)}
      sub={summary.cashToCollect > 0 ? `${summary.cashToCollect} awaiting cash` : 'not yet paid'}
    />
  </div>
)

export default RegistrationsSummary
