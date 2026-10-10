import React from 'react'
import { Mail, Phone } from 'lucide-react'
import Card from '../../../../components/ui/Card'
import { cn } from '../../../../lib/utils'
import { formatINR, formatStamp, toInt } from '../../lib/format'
import { payMeta } from '../../lib/payments'
import { regStatusOf } from '../../lib/registrations'
import { PayChip, RegStatusBadge } from '../StatusBadges'
import RegistrationActions from './RegistrationActions'
import RegistrationDetails from './RegistrationDetails'

const COLUMNS = ['Devotee', 'Trip', 'Seats', 'Amount', 'Payment', 'Status', 'Registered', 'Actions']

const PaymentNote = ({ pay }) => {
  if (pay.state === 'cash_collected') return <p className="mt-1 text-[13px] font-semibold text-teal-700 user-text">{formatINR(pay.cashAmount)} · {formatStamp(pay.cashAt)}</p>
  if (pay.state === 'online_paid' && pay.onlineAmount > 0) return <p className="mt-1 text-[13px] font-semibold text-emerald-700 user-text">{formatINR(pay.onlineAmount)} verified</p>
  if (pay.state === 'cash_pending') return <p className="mt-1 text-[13px] font-semibold text-orange-600 user-text">to collect at office</p>
  if (pay.state === 'online_pending' && pay.orderId) return <p className="mt-1 font-mono text-[12px] text-ink-muted user-text" title={pay.orderId}>{pay.orderId}</p>
  return null
}

/** The reconciliation table, from xl up. */
const RegistrationsTable = ({ registrations, resolve, busyId, noteOpen, actions, cash }) => (
  <Card padded={false} className="hidden overflow-hidden xl:block">
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px]">
        <thead>
          <tr className="border-b border-line bg-paper text-left text-[12px] font-semibold uppercase tracking-label text-ink-muted">
            {COLUMNS.map((c, i) => (
              <th key={c} scope="col" className={cn('px-3 py-3.5', i === 0 && 'pl-5', i === COLUMNS.length - 1 && 'pr-5 text-right')}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line/70">
          {registrations.map((reg) => {
            const pay = resolve(reg)
            const busy = busyId === reg.id
            const status = regStatusOf(reg)
            const expanded = noteOpen === reg.id
            const hasDetail = expanded || reg.travellerNotes || reg.emergencyContact || reg.staffNotes || pay.cashDone || pay.orderId
            return (
              <React.Fragment key={reg.id}>
                <tr className="align-top transition-colors hover:bg-paper/70">
                  <td className="py-4 pl-5 pr-3">
                    <div className="flex min-w-[150px] max-w-[260px] items-start gap-2.5 user-text-box">
                      <span className={cn('mt-0.5 w-1 self-stretch shrink-0 rounded-full', payMeta(pay.state).dot)} aria-hidden="true" />
                      <div className="min-w-0 space-y-0.5">
                        <p className="text-[15px] font-semibold text-ink user-text">{reg.userName || 'Devotee'}</p>
                        {reg.userPhone && <p className="flex items-center gap-1.5 text-[13px] text-ink-muted"><Phone size={12} className="shrink-0" /> <span className="user-text">{reg.userPhone}</span></p>}
                        {reg.userEmail && <p className="flex items-center gap-1.5 text-[13px] text-ink-muted"><Mail size={12} className="shrink-0" /> <span className="user-text">{reg.userEmail}</span></p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-4">
                    <div className="min-w-[120px] max-w-[210px] user-text-box">
                      <p className="text-[14px] font-semibold text-ink-soft user-text">{reg.tripTitle || '—'}</p>
                      <p className="font-mono text-[12px] text-ink-muted user-text">{reg.tripSlug || ''}</p>
                    </div>
                  </td>
                  <td className="px-3 py-4 text-[15px] font-semibold text-ink-soft">{toInt(reg.seats) || 1}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-[15px] font-semibold text-ink-soft">{formatINR(reg.amountDue)}</td>
                  <td className="px-3 py-4">
                    <div className="min-w-[130px] max-w-[200px] user-text-box">
                      <PayChip pay={pay} />
                      <PaymentNote pay={pay} />
                    </div>
                  </td>
                  <td className="px-3 py-4"><RegStatusBadge status={status} /></td>
                  <td className="whitespace-nowrap px-3 py-4 text-[14px] text-ink-muted">{formatStamp(reg.createdAt)}</td>
                  <td className="py-4 pl-3 pr-5">
                    <div className="flex flex-wrap items-center justify-end gap-1.5">
                      <RegistrationActions reg={reg} pay={pay} status={status} expanded={expanded} busy={busy} actions={actions} cash={cash} />
                    </div>
                  </td>
                </tr>
                {hasDetail && (
                  <tr className="bg-paper/60">
                    <td colSpan={COLUMNS.length} className="px-5 pb-4">
                      <RegistrationDetails reg={reg} pay={pay} expanded={expanded} busy={busy} actions={actions} />
                    </td>
                  </tr>
                )}
              </React.Fragment>
            )
          })}
        </tbody>
      </table>
    </div>
  </Card>
)

export default RegistrationsTable
