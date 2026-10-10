import React from 'react'
import { CalendarDays } from 'lucide-react'
import { Badge, Button, Card } from '../../../components/ui'
import { STATUS_TONE, actionsFor, normalize } from '../lib/accommodation'

const RequestCard = ({ request, role, acting, onAction }) => {
  const actions = actionsFor(role, request.status)
  return (
    <Card data-card padded={false} className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold text-ink">{request.userName || 'Devotee'}</p>
          <p className="font-mono text-[11px] uppercase tracking-wide text-ink-muted">REQ_{request.id.slice(0, 6).toUpperCase()}</p>
        </div>
        <Badge size="sm" tone={STATUS_TONE[normalize(request.status)] || 'saffron'} dot className="capitalize">{request.status}</Badge>
      </div>
      <h4 className="mt-3 font-display text-[16px] font-semibold text-ink">{request.type}</h4>
      <p className="mt-1.5 flex items-center gap-2 text-[13px] text-ink-muted">
        <CalendarDays size={14} className="shrink-0 text-marigold-dark" aria-hidden="true" />
        {request.arrivalDate} to {request.departureDate}
      </p>
      {actions.length > 0 && (
        <div className="mt-4 flex gap-2 border-t border-line/80 pt-4">
          {actions.map((a) => (
            <Button key={a.status} size="sm" variant={a.variant} loading={acting} onClick={() => onAction(request, a.status)} className="flex-1">
              {a.label}
            </Button>
          ))}
        </div>
      )}
    </Card>
  )
}

export default RequestCard
