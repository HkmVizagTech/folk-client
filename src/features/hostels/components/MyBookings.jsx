import React from 'react'
import { CalendarCheck } from 'lucide-react'
import { EmptyState } from '../../../components/common'
import { Button, Card } from '../../../components/ui'
import { useReveal } from '../../../hooks/useReveal'
import { guestLabel, normalize } from '../lib/hostels'
import StatusBadge from './StatusBadge'

const MyBookings = ({ bookings, onCancel }) => {
  const ref = useReveal({ selector: '[data-card]', y: 12, deps: [bookings.length] })
  if (bookings.length === 0) {
    return <EmptyState icon={CalendarCheck} title="No stays requested yet" description="Pick a room above and send your first request." className="py-10" />
  }
  return (
    <div ref={ref} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {bookings.map((b) => (
        <Card key={b.id} data-card padded={false} className="flex flex-col p-5">
          <div className="flex items-start justify-between gap-3">
            <h4 className="min-w-0 font-display text-[16px] font-semibold text-ink">{b.listingName}</h4>
            <StatusBadge status={b.status} />
          </div>
          <p className="mt-2 text-[14px] text-ink-muted">{b.checkIn} &rarr; {b.checkOut}</p>
          <p className="text-[13px] text-ink-muted">{guestLabel(b.guestCount)}</p>
          {b.staffNotes && <p className="mt-3 rounded-xl bg-paper p-3 text-[13px] italic text-ink-soft">&quot;{b.staffNotes}&quot;</p>}
          {normalize(b.status) === 'pending' && (
            <Button variant="secondary" size="sm" className="mt-4 w-full text-red-700 hover:border-red-200 hover:bg-red-50" onClick={() => onCancel(b)}>
              Cancel request
            </Button>
          )}
        </Card>
      ))}
    </div>
  )
}

export default MyBookings
