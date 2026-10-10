import React from 'react'
import { CalendarDays, MapPin, Pencil, Plus, Users } from 'lucide-react'
import { Button, Card, Skeleton } from '../../../components/ui'
import { EmptyState } from '../../../components/common'
import { formatTime } from '../../../lib/dates'
import { canManageEvent } from '../../../content/audiences'
import AudienceChip from './AudienceChip'

const DayEvent = ({ event: e, user, onEdit }) => (
  <li className="rounded-xl border border-line border-l-4 border-l-marigold bg-white p-4">
    <div className="flex items-start justify-between gap-2">
      <p className="user-text font-display text-[17px] font-semibold leading-snug">{e.title}</p>
      {canManageEvent(user, e) && (
        <Button variant="ghost" size="icon" onClick={() => onEdit(e)} aria-label={`Edit ${e.title}`} className="-mr-2 -mt-2 h-10 w-10 shrink-0"><Pencil size={15} /></Button>
      )}
    </div>
    <p className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[14px] text-ink-muted">
      <span className="inline-flex items-center gap-1"><CalendarDays size={14} aria-hidden="true" /> {formatTime(e._d)}</span>
      {e.location && <span className="user-text inline-flex items-center gap-1"><MapPin size={14} aria-hidden="true" /> {e.location}</span>}
      {(e.attendingCount || 0) > 0 && <span className="inline-flex items-center gap-1"><Users size={14} aria-hidden="true" /> {e.attendingCount} going</span>}
    </p>
    <p className="mt-2.5 flex flex-wrap items-center gap-2">
      <AudienceChip event={e} />
      {e.ownerName && e.audience && e.audience !== 'all' && <span className="user-text text-[12px] text-ink-muted">by {e.ownerId === user?.uid ? 'you' : e.ownerName}</span>}
    </p>
  </li>
)

const DayPanel = ({ label, events, loading, user, isStaff, onEdit, onAdd }) => (
  <Card data-reveal className="flex flex-col">
    <h2 className="text-[12px] font-bold uppercase tracking-label text-ink-muted">{label}</h2>
    <div className="mt-4 flex-1">
      {loading ? (
        <div className="space-y-3"><Skeleton className="h-20" /><Skeleton className="h-20" /></div>
      ) : events.length ? (
        <ul className="space-y-3">{events.map((e) => <DayEvent key={e.id} event={e} user={user} onEdit={onEdit} />)}</ul>
      ) : (
        <EmptyState icon={CalendarDays} title="Nothing scheduled" description="Pick another day to see what is on." className="border-0 bg-paper py-8" />
      )}
    </div>
    {isStaff && <Button variant="secondary" onClick={onAdd} className="mt-5 w-full border-dashed"><Plus size={16} aria-hidden="true" /> Add a program on this day</Button>}
  </Card>
)

export default DayPanel
