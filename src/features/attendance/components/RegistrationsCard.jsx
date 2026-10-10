import React from 'react'
import { QrCode, Ticket } from 'lucide-react'
import { Card } from '../../../components/ui'
import { EmptyState } from '../../../components/common'

const RegistrationsCard = ({ registrations }) => (
  <Card data-reveal padded={false} className="overflow-hidden">
    <div className="hero-devotional px-5 py-6 text-white sm:px-6">
      <h2 className="flex items-center gap-2 font-display text-[20px] font-semibold"><Ticket size={22} aria-hidden="true" /> My registrations</h2>
      <p className="mt-1 text-[14px] text-white/80">Your unique tokens for upcoming events</p>
    </div>
    <div className="space-y-3 p-5 sm:p-6">
      {registrations.length > 0 ? registrations.map((reg) => (
        <div key={reg.id} className="rounded-xl border border-line bg-paper/60 p-4">
          <p className="text-[12px] font-semibold uppercase tracking-label text-ink-muted">{reg.eventTitle}</p>
          <div className="mt-1 flex items-center justify-between gap-3">
            <span className="truncate font-mono text-[20px] font-semibold tracking-wide text-ink">{reg.token}</span>
            <QrCode size={20} className="shrink-0 text-marigold-dark" aria-hidden="true" />
          </div>
        </div>
      )) : <EmptyState icon={Ticket} title="No active registrations" className="py-8" />}
    </div>
  </Card>
)

export default RegistrationsCard
