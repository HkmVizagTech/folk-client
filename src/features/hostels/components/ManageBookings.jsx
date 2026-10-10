import React from 'react'
import { Inbox } from 'lucide-react'
import { EmptyState } from '../../../components/common'
import { Button, Card, Skeleton } from '../../../components/ui'
import { useReveal } from '../../../hooks/useReveal'
import { guestLabel, normalize } from '../lib/hostels'
import StatusBadge from './StatusBadge'

const ManageBookings = ({ bookings, loading, onStatus }) => {
  const ref = useReveal({ selector: '[data-card]', y: 12, stagger: 0.04, deps: [loading, bookings.length] })
  if (loading) return <div className="grid gap-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>
  if (bookings.length === 0) return <EmptyState icon={Inbox} title="No bookings yet" className="py-10" />
  return (
    <div ref={ref} className="grid gap-3">
      {bookings.map((b) => (
        <Card key={b.id} data-card padded={false} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-5">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="font-display text-[16px] font-semibold text-ink">{b.listingName}</h4>
              <StatusBadge status={b.status} />
            </div>
            <p className="mt-1 text-[13px] text-ink-muted">
              {b.userName || 'Devotee'} &middot; {b.checkIn} &rarr; {b.checkOut} &middot; {guestLabel(b.guestCount)}
            </p>
            {b.notes && <p className="mt-1 text-[13px] italic text-ink-soft">&quot;{b.notes}&quot;</p>}
          </div>
          {normalize(b.status) === 'pending' && (
            <div className="grid grid-cols-2 gap-2 sm:flex sm:shrink-0">
              <Button size="sm" onClick={() => onStatus(b, 'approved')}>Approve</Button>
              <Button size="sm" variant="secondary" onClick={() => onStatus(b, 'rejected')}>Reject</Button>
            </div>
          )}
        </Card>
      ))}
    </div>
  )
}

export default ManageBookings
