import React from 'react'
import { Mail, Phone } from 'lucide-react'
import Card from '../../../../components/ui/Card'
import { cn } from '../../../../lib/utils'
import { formatINR, formatStamp, toInt } from '../../lib/format'
import { payMeta } from '../../lib/payments'
import { detailsComplete, regStatusOf } from '../../lib/registrations'
import { PayChip, RegStatusBadge } from '../StatusBadges'
import RegistrationActions from './RegistrationActions'
import RegistrationDetails from './RegistrationDetails'

const TravelDetails = ({ reg }) => {
  if (!detailsComplete(reg)) {
    return <p className="rounded-xl border border-line bg-paper px-3 py-2 text-[13px] font-semibold text-ink-muted">No travel details given</p>
  }
  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5">
      <p className="mb-1 text-[12px] font-semibold uppercase tracking-label text-emerald-700">Travellers</p>
      {(reg.travellers || []).map((t, i) => (
        <p key={i} className="text-[14px] text-ink user-text">
          {t.name}{t.age ? `, ${t.age}` : ''}{t.gender ? `, ${t.gender}` : ''}
          {t.idNumber ? ` · ${t.idType || 'ID'} ${t.idNumber}` : ''}
          {t.college && <span className="block text-ink-muted">{[t.college, t.course, t.year].filter(Boolean).join(' · ')}</span>}
        </p>
      ))}
      {reg.pickup && <p className="mt-1 text-[13px] text-ink-muted user-text">Boarding: {reg.pickup}</p>}
    </div>
  )
}

/** Below xl a 900px table is unusable, so each registration is a stacked card. */
const RegistrationCard = ({ reg, pay, busy, expanded, actions, cash }) => {
  const status = regStatusOf(reg)
  const seats = toInt(reg.seats) || 1
  const hasDetail = expanded || reg.travellerNotes || reg.emergencyContact || reg.staffNotes || pay.cashDone

  return (
    <Card padded={false} className="overflow-hidden p-4 user-text-box">
      <div className="flex items-start gap-3">
        <span className={cn('w-1.5 self-stretch shrink-0 rounded-full', payMeta(pay.state).dot)} aria-hidden="true" />
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <p className="font-display text-[17px] font-semibold text-ink user-text">{reg.userName || 'Devotee'}</p>
            <p className="text-[14px] text-ink-muted user-text">{reg.tripTitle || '—'}</p>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <PayChip pay={pay} />
            <RegStatusBadge status={status} />
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[14px] text-ink-muted">
            <span>{seats} seat{seats === 1 ? '' : 's'}</span>
            <span className="text-right font-semibold text-ink-soft">{formatINR(reg.amountDue)} due</span>
            {reg.userPhone && (
              <a href={`tel:${reg.userPhone}`} className="col-span-2 -my-1 flex min-h-[44px] items-center gap-1.5 hover:text-saffron-dark">
                <Phone size={13} className="shrink-0" /> <span className="user-text">{reg.userPhone}</span>
              </a>
            )}
            {reg.userEmail && (
              <span className="col-span-2 flex items-center gap-1.5 user-text-box"><Mail size={13} className="shrink-0" /> <span className="user-text">{reg.userEmail}</span></span>
            )}
            <span className="col-span-2 text-[13px] text-ink-muted/70">Registered {formatStamp(reg.createdAt)}</span>
          </div>
          <TravelDetails reg={reg} />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 border-t border-line/70 pt-4">
        <RegistrationActions reg={reg} pay={pay} status={status} expanded={expanded} busy={busy} actions={actions} cash={cash} />
      </div>

      {hasDetail && (
        <div className="mt-4 border-t border-line/70 pt-4">
          <RegistrationDetails reg={reg} pay={pay} expanded={expanded} busy={busy} actions={actions} />
        </div>
      )}
    </Card>
  )
}

export default RegistrationCard
