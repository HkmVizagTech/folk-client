import React from 'react'
import {
  AlertTriangle, Banknote, Bus, Calendar, Copy, CreditCard, Edit3, ExternalLink, IndianRupee, MapPin, Trash2, Users,
} from 'lucide-react'
import Card from '../../../../components/ui/Card'
import Button from '../../../../components/ui/Button'
import Badge from '../../../../components/ui/Badge'
import Switch from '../../../../components/ui/Switch'
import { Select } from '../../../../components/ui/Field'
import { TRIP_STATUSES } from '../../lib/constants'
import { capitalize, formatDate, formatINR } from '../../lib/format'
import { RegistrationsOpenBadge, TripStatusBadge } from '../StatusBadges'

const Meta = ({ icon: Icon, className, children }) => (
  <span className="inline-flex min-w-0 items-center gap-1.5">
    <Icon size={14} className={className} aria-hidden="true" />
    <span className="user-text">{children}</span>
  </span>
)

const PaymentRails = ({ trip }) => (
  <>
    {trip.onlinePaymentEnabled !== false && <Badge size="sm" tone="success"><CreditCard size={12} /> Online</Badge>}
    {trip.cashPaymentEnabled === true && <Badge size="sm" className="bg-teal-50 text-teal-700"><Banknote size={12} /> Cash</Badge>}
    {trip.onlinePaymentEnabled === false && trip.cashPaymentEnabled !== true && (
      <Badge size="sm" tone="warning"><AlertTriangle size={12} /> No payment</Badge>
    )}
  </>
)

const TripCard = ({ trip, stats, busy, isAdmin, onEdit, onDuplicate, onView, onDelete, onStatus, onToggleRegistration, onSeeRegistrations }) => {
  const placeCount = Array.isArray(trip.locations) ? trip.locations.length : 0
  const label = trip.title || 'trip'

  return (
    <Card hover padded={false} className="overflow-hidden">
      {/* Side by side only from xl: inside the app shell a card is ~704px at 1024px, too tight for thumb + controls. */}
      <div className="flex flex-col gap-4 p-4 sm:p-5 xl:flex-row xl:items-center">
        <div className="flex h-40 w-full shrink-0 items-center justify-center overflow-hidden rounded-xl bg-saffron-50 xl:h-24 xl:w-36">
          {trip.coverImage
            ? <img src={trip.coverImage} alt={trip.title} className="h-full w-full object-cover" />
            : <Bus size={28} className="text-marigold" aria-hidden="true" />}
        </div>

        <div className="min-w-0 flex-1 user-text-box">
          <h3 className="font-display text-[18px] font-semibold leading-snug text-ink user-text">{trip.title || 'Untitled trip'}</h3>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <TripStatusBadge status={trip.status} />
            <RegistrationsOpenBadge open={!!trip.registrationOpen} />
            <PaymentRails trip={trip} />
          </div>
          <p className="mt-2 font-mono text-[13px] text-ink-muted user-text">/trip/{trip.slug || '—'}</p>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[14px] text-ink-muted">
            <Meta icon={Calendar} className="shrink-0 text-marigold-dark">{formatDate(trip.startDate)} → {formatDate(trip.endDate)}</Meta>
            {trip.location && <Meta icon={MapPin} className="shrink-0 text-saffron">{trip.location}</Meta>}
            <Meta icon={IndianRupee} className="shrink-0 text-emerald-600">{formatINR(trip.price)}</Meta>
            <Meta icon={Users} className="shrink-0 text-navy">
              {stats.count} registration{stats.count === 1 ? '' : 's'}{trip.capacity ? ` · ${stats.seats}/${trip.capacity} seats` : ''}
            </Meta>
            {placeCount > 0 && <Meta icon={MapPin} className="shrink-0 text-marigold-dark">{placeCount} place{placeCount === 1 ? '' : 's'}</Meta>}
          </div>
        </div>

        <div className="flex w-full shrink-0 flex-col gap-3 xl:w-[300px]">
          <div className="flex items-center gap-3">
            <Select
              value={TRIP_STATUSES.includes(trip.status) ? trip.status : 'draft'}
              disabled={busy}
              aria-label={`Status for ${label}`}
              onChange={(e) => onStatus(trip, e.target.value)}
              className="min-w-0 flex-1"
            >
              {TRIP_STATUSES.map((s) => <option key={s} value={s}>{capitalize(s)}</option>)}
            </Select>
            <label className="flex min-h-[44px] shrink-0 cursor-pointer items-center gap-2 text-[14px] font-semibold text-ink-soft">
              <Switch
                checked={!!trip.registrationOpen}
                disabled={busy}
                onCheckedChange={() => onToggleRegistration(trip)}
                aria-label={trip.registrationOpen ? `Close registrations for ${label}` : `Open registrations for ${label}`}
              />
              <span className="hidden sm:inline">{trip.registrationOpen ? 'Open' : 'Closed'}</span>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-2">
            <Button variant="soft" size="sm" className="min-h-[44px] rounded-xl" onClick={() => onEdit(trip)} aria-label={`Edit ${label}`}><Edit3 size={14} /> Edit</Button>
            <Button variant="secondary" size="sm" className="min-h-[44px] rounded-xl" onClick={() => onDuplicate(trip)} aria-label={`Duplicate ${label}`}><Copy size={14} /> Copy</Button>
            <Button variant="secondary" size="sm" className="min-h-[44px] rounded-xl" disabled={!trip.slug} onClick={() => onView(trip)} aria-label={`View public page for ${label}`}><ExternalLink size={14} /> View</Button>
            {isAdmin ? (
              <Button variant="secondary" size="sm" className="min-h-[44px] rounded-xl border-red-200 text-red-600 hover:border-red-300 hover:bg-red-50" onClick={() => onDelete(trip)} aria-label={`Delete ${label}`}><Trash2 size={14} /> Delete</Button>
            ) : (
              <Button variant="secondary" size="sm" className="min-h-[44px] rounded-xl" onClick={() => onSeeRegistrations(trip)} aria-label={`See registrations for ${label}`}><Users size={14} /> Regs</Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}

export default TripCard
