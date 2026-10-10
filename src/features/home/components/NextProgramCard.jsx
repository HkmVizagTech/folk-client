import React from 'react'
import { CalendarDays, CheckCircle2, MapPin } from 'lucide-react'
import { Button, Skeleton } from '../../../components/ui'
import { EmptyState } from '../../../components/common'
import { formatDay, formatTime } from '../../../lib/dates'
import { dayOf, monthOf } from '../lib/format'
import Panel from './Panel'

const NextProgramCard = ({ event, going, loading, onAll, onRsvp }) => (
  <Panel title="Next program" action="All events" onAction={onAll} className="lg:col-span-2">
    {loading ? (
      <div className="flex gap-4"><Skeleton className="h-20 w-[68px]" /><div className="flex-1 space-y-2"><Skeleton className="h-6 w-2/3" /><Skeleton className="h-4 w-1/2" /></div></div>
    ) : event ? (
      <div className="flex gap-4 sm:gap-5">
        <div className="w-[68px] shrink-0 self-start rounded-2xl border border-line bg-paper py-3 text-center">
          <div className="font-display text-[30px] font-bold leading-none text-navy">{dayOf(event._d)}</div>
          <div className="mt-1 text-[11px] font-bold uppercase tracking-label text-saffron-dark">{monthOf(event._d)}</div>
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="user-text font-display text-[20px] font-semibold leading-snug">{event.title}</h3>
          <p className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[15px] text-ink-muted">
            <span className="inline-flex items-center gap-1.5"><CalendarDays size={15} aria-hidden="true" /> {formatDay(event._d)}, {formatTime(event._d)}</span>
            {event.location && <span className="user-text inline-flex items-center gap-1.5"><MapPin size={15} aria-hidden="true" /> {event.location}</span>}
          </p>
          {going
            ? <p className="mt-4 inline-flex items-center gap-2 font-semibold text-emerald-700"><CheckCircle2 size={18} aria-hidden="true" /> You&apos;re going</p>
            : <Button variant="dark" onClick={onRsvp} className="mt-4">RSVP</Button>}
        </div>
      </div>
    ) : (
      <EmptyState icon={CalendarDays} title="No programs yet" description="We'll notify you when the next one is announced." className="border-0 bg-transparent py-6" />
    )}
  </Panel>
)

export default NextProgramCard
