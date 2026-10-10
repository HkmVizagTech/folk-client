import React from 'react'
import { Clock, MapPin, Users } from 'lucide-react'
import { Badge, Card } from '../../../components/ui'
import { audienceOf } from '../../../content/audiences'
import { ATTENDING, dateParts } from '../lib/events'
import DateBadge from './DateBadge'
import RsvpControl from './RsvpControl'
import TicketChip from './TicketChip'

/** Grid card: banner with date tile, details, then the RSVP footer. */
const EventCard = ({ event, registration, attendingCount, busy, onRsvp }) => {
  const parts = dateParts(event)
  const audience = audienceOf(event)
  return (
    <Card data-card interactive padded={false} className="group flex h-full flex-col overflow-hidden">
      <div className="relative aspect-[16/9] overflow-hidden bg-gradient-to-br from-saffron-50 to-marigold-light/40">
        {event.img && (
          <img src={event.img} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
        )}
        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
          <DateBadge parts={parts} />
          <div className="flex flex-wrap justify-end gap-1.5">
            <Badge tone="neutral" className="bg-white/90 backdrop-blur">{event.category}</Badge>
            {audience.id !== 'all' && <Badge tone="maroon" className="bg-navy text-white">{audience.short}</Badge>}
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <h3 className="font-display text-[19px] font-semibold leading-snug text-ink transition-colors group-hover:text-saffron-dark">{event.title}</h3>
        <ul className="grid gap-1.5 text-[14px] text-ink-muted">
          <li className="flex items-center gap-2"><Clock size={15} className="shrink-0 text-saffron" aria-hidden="true" />{parts ? `${parts.weekday}, ${parts.time}` : event.date}</li>
          {event.location && <li className="flex items-center gap-2"><MapPin size={15} className="shrink-0 text-saffron" aria-hidden="true" /><span className="truncate">{event.location}</span></li>}
          <li className="flex items-center gap-2"><Users size={15} className="shrink-0 text-saffron" aria-hidden="true" />{attendingCount} expected</li>
        </ul>
        {event.description && <p className="line-clamp-3 text-[14px] leading-relaxed text-ink-soft">{event.description}</p>}

        <div className="mt-auto flex flex-col gap-4 border-t border-line/80 pt-4">
          {registration?.status === ATTENDING && registration.token && <TicketChip token={registration.token} />}
          <RsvpControl status={registration?.status} busy={busy} onChoose={onRsvp} />
        </div>
      </div>
    </Card>
  )
}

export default EventCard
