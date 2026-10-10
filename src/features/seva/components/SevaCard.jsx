import React from 'react'
import { CalendarDays, Clock, Heart, MapPin, UserCheck, Users, X } from 'lucide-react'
import { Badge, Button, Card, ProgressBar } from '../../../components/ui'
import { formatSevaDate } from '../lib/seva'

const Meta = ({ icon: Icon, children }) => (
  <span className="flex min-w-0 items-center gap-2 text-[14px] font-medium text-ink-soft">
    <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-saffron-50 text-saffron-dark"><Icon size={16} aria-hidden="true" /></span>
    <span className="user-text min-w-0 truncate">{children}</span>
  </span>
)

const Action = ({ status, full, loading, onJoin, onLeave }) => {
  if (status === 'registered') return <Button variant="secondary" className="w-full text-red-700 hover:border-red-200 hover:bg-red-50" onClick={onLeave} loading={loading}><X size={16} aria-hidden="true" /> Leave seva</Button>
  if (status === 'completed') return <Badge tone="success" size="md" className="h-11 w-full justify-center"><UserCheck size={16} aria-hidden="true" /> Blessed service</Badge>
  return <Button className="w-full" onClick={onJoin} disabled={full} loading={loading}><Heart size={16} fill={full ? 'none' : 'currentColor'} aria-hidden="true" /> {full ? 'Limit reached' : 'Opt to serve'}</Button>
}

const SevaCard = ({ seva, status, count, isStaff, loading, onJoin, onLeave, onVolunteers }) => {
  const full = count >= seva.maxVolunteers
  return (
    <Card data-reveal hover padded={false} className="flex flex-col">
      <Card.Header>
        <Badge tone="saffron" className="capitalize">{seva.sevaType}</Badge>
        {status === 'registered' && <Badge tone="success" dot>You&apos;re serving</Badge>}
      </Card.Header>
      <Card.Body className="flex flex-1 flex-col">
        <h2 className="user-text font-display text-[20px] font-semibold leading-snug text-ink">{seva.title}</h2>
        {seva.description && <p className="user-text mt-2 line-clamp-3 text-[15px] leading-relaxed text-ink-muted">{seva.description}</p>}
        <div className="mt-4 grid gap-2.5">
          <Meta icon={CalendarDays}>{formatSevaDate(seva.date)}</Meta>
          {seva.time && <Meta icon={Clock}>{seva.time}</Meta>}
          {seva.location && <Meta icon={MapPin}>{seva.location}</Meta>}
        </div>
        <div className="mt-5">
          <div className="mb-1.5 flex items-center justify-between text-[13px] text-ink-muted">
            <span className="inline-flex items-center gap-1.5"><Users size={14} aria-hidden="true" /> Volunteers</span>
            <span className="font-semibold text-ink">{count} / {seva.maxVolunteers}</span>
          </div>
          <ProgressBar value={count} max={seva.maxVolunteers} />
        </div>
      </Card.Body>
      <Card.Footer className="flex-col items-stretch sm:flex-row">
        {isStaff && <Button variant="secondary" className="sm:flex-1" onClick={onVolunteers}><Users size={16} aria-hidden="true" /> Volunteers</Button>}
        <div className="sm:flex-1"><Action status={status} full={full} loading={loading} onJoin={onJoin} onLeave={onLeave} /></div>
      </Card.Footer>
    </Card>
  )
}

export default SevaCard
