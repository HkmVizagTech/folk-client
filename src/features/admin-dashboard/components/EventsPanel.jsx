import React from 'react'
import { Calendar, ChevronRight, MapPin, Plus } from 'lucide-react'
import { Badge, Button } from '../../../components/ui'
import { EmptyState } from '../../../components/common'
import { PanelCard } from '../../staff-common/components'

const EventRow = ({ event, onOpen }) => (
  <li>
    <button type="button" onClick={onOpen} className="group flex w-full flex-col gap-4 rounded-2xl border border-line/70 bg-paper/50 p-3 text-left transition-all hover:border-marigold/50 hover:bg-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron sm:flex-row sm:items-center">
      <div className="h-32 w-full shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-navy-700 to-navy-900 sm:h-20 sm:w-32">
        {event.img && <img src={event.img} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          {event.category && <Badge tone="saffron" size="sm">{event.category}</Badge>}
          <span className="text-[12px] font-semibold text-emerald-700">{event.attendingCount || 0} attending</span>
          <span className="text-[12px] font-semibold text-ink-muted">{event.declinedCount || 0} declined</span>
        </div>
        <h3 className="mt-1.5 truncate font-display text-[17px] font-semibold text-ink group-hover:text-navy">{event.title}</h3>
        <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-ink-muted">
          <span className="inline-flex items-center gap-1.5"><Calendar size={14} className="text-marigold-dark" aria-hidden="true" />{event.date}</span>
          {event.location && <span className="inline-flex min-w-0 items-center gap-1.5"><MapPin size={14} className="shrink-0 text-marigold-dark" aria-hidden="true" /><span className="truncate">{event.location}</span></span>}
        </p>
      </div>
      <ChevronRight size={20} className="hidden shrink-0 text-ink-muted transition-transform group-hover:translate-x-1 group-hover:text-saffron sm:block" aria-hidden="true" />
    </button>
  </li>
)

const EventsPanel = ({ events, onNavigate, onCreate }) => (
  <PanelCard
    icon={Calendar}
    tone="gold"
    title="Upcoming gatherings"
    actions={<Button variant="ghost" size="sm" onClick={() => onNavigate('events')}>View all</Button>}
  >
    {events.length > 0 ? (
      <ul className="space-y-3">{events.slice(0, 3).map((e) => <EventRow key={e.id} event={e} onOpen={() => onNavigate('events')} />)}</ul>
    ) : (
      <EmptyState icon={Calendar} title="No upcoming events" description="Schedule a gathering to see it here." />
    )}
    <div className="mt-5 flex justify-center border-t border-line/70 pt-5">
      <Button variant="soft" onClick={onCreate}><Plus size={18} aria-hidden="true" /> Create new event</Button>
    </div>
  </PanelCard>
)

export default EventsPanel
