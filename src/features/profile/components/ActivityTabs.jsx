import React from 'react'
import { Calendar, CreditCard } from 'lucide-react'
import { Badge } from '../../../components/ui'
import { formatDate, paymentTone } from '../lib/profileFields'
import ActivityList from './ActivityList'

export const AttendancePanel = ({ items, loading }) => (
  <ActivityList
    loading={loading}
    items={items}
    icon={Calendar}
    emptyTitle="No attendance yet"
    emptyText="Programs you check in to will appear here."
    renderRow={(a) => (
      <>
        <div className="min-w-0">
          <p className="truncate font-semibold text-ink">{a.session || a.eventTitle || 'Temple visit'}</p>
          <p className="mt-0.5 text-[13px] text-ink-muted">{formatDate(a.createdAt)}</p>
        </div>
        <Badge tone="success" className="shrink-0">Verified</Badge>
      </>
    )}
  />
)

export const PaymentsPanel = ({ items, loading }) => (
  <ActivityList
    loading={loading}
    items={items}
    icon={CreditCard}
    emptyTitle="No payments yet"
    emptyText="Donations and event contributions will appear here."
    renderRow={(p) => (
      <>
        <div className="min-w-0">
          <p className="truncate font-semibold text-ink">{p.sevaType || (p.eventId ? 'Event contribution' : 'Donation')}</p>
          <p className="mt-0.5 text-[13px] text-ink-muted">{formatDate(p.createdAt)}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-display text-[17px] font-semibold text-saffron-dark">₹{Number(p.amount || 0).toLocaleString('en-IN')}</p>
          <Badge tone={paymentTone(p.status)} size="sm" className="mt-1 capitalize">{String(p.status || 'pending').toLowerCase()}</Badge>
        </div>
      </>
    )}
  />
)
