import React from 'react'
import { Ban, CheckCircle2, Clock, Hourglass } from 'lucide-react'
import Badge from '../../../components/ui/Badge'
import { cn } from '../../../lib/utils'
import { payMeta } from '../lib/payments'

const TRIP_TONE = { upcoming: 'saffron', ongoing: 'success', completed: 'maroon', cancelled: 'danger' }
const REG_TONE = { confirmed: 'success', waitlisted: 'warning', cancelled: 'neutral' }
const REG_ICON = { confirmed: CheckCircle2, waitlisted: Hourglass, cancelled: Ban }
const PAY_TONE = { success: 'success', warning: 'warning', danger: 'danger', neutral: 'neutral' }
const PAY_CLASS = { cash: 'bg-teal-50 text-teal-700', orange: 'bg-orange-50 text-orange-700' }

export const TripStatusBadge = ({ status }) => (
  <Badge size="sm" tone={TRIP_TONE[(status || '').toLowerCase()] || 'neutral'} className="capitalize">
    {status || 'draft'}
  </Badge>
)

export const RegistrationsOpenBadge = ({ open }) => (
  <Badge size="sm" tone={open ? 'success' : 'neutral'} dot>
    {open ? 'Registrations open' : 'Registrations closed'}
  </Badge>
)

export const RegStatusBadge = ({ status }) => {
  const Icon = REG_ICON[status] || Clock
  return (
    <Badge size="sm" tone={REG_TONE[status] || 'saffron'} className="capitalize">
      <Icon size={12} aria-hidden="true" /> {status}
    </Badge>
  )
}

/** A resolved payment state, identical in the table and the mobile card list. */
export const PayChip = ({ pay }) => {
  const meta = payMeta(pay.state)
  const Icon = meta.icon
  return (
    <Badge size="sm" tone={PAY_TONE[meta.tone] || 'neutral'} className={cn(PAY_CLASS[meta.tone])}>
      <Icon size={12} aria-hidden="true" className={pay.state === 'checking' ? 'animate-spin' : undefined} />
      {meta.label}
    </Badge>
  )
}
