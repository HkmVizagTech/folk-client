import React from 'react'
import { Calendar, MapPin, Users } from 'lucide-react'
import { Badge, Card } from '../../../components/ui'
import { ATTENDING, dateParts } from '../lib/events'
import RsvpControl from './RsvpControl'
import TicketChip from './TicketChip'

const Fact = ({ icon: Icon, label, children }) => (
  <div className="flex items-center gap-3">
    <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-marigold-light">
      <Icon size={20} aria-hidden="true" />
    </span>
    <div className="min-w-0">
      <p className="text-[12px] font-semibold uppercase tracking-label text-white/70">{label}</p>
      <p className="truncate text-[15px] font-semibold text-white sm:text-[16px]">{children}</p>
    </div>
  </div>
)

/** Hero banner for the next event on the calendar. */
const FeaturedEvent = ({ event, registration, attendingCount, busy, onRsvp }) => {
  const parts = dateParts(event)
  return (
    <Card data-card padded={false} className="group relative isolate flex min-h-[420px] flex-col justify-end overflow-hidden border-0 bg-gradient-to-br from-navy to-navy-800 shadow-premium-xl sm:min-h-[460px]">
      {event.img && (
        <img src={event.img} alt="" className="absolute inset-0 -z-20 h-full w-full object-cover transition-transform duration-1000 group-hover:scale-105" />
      )}
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink/95 via-ink/55 to-ink/10" aria-hidden="true" />

      <div className="flex flex-col gap-5 p-5 sm:gap-6 sm:p-8 lg:p-10">
        <div className="flex flex-wrap gap-2">
          <Badge tone="saffron" className="bg-saffron text-white">Next up</Badge>
          <Badge className="border border-white/25 bg-white/10 text-white backdrop-blur">{event.category}</Badge>
        </div>
        <h2 className="max-w-3xl font-display text-[28px] font-semibold leading-tight text-white sm:text-[40px]">{event.title}</h2>
        <div className="flex flex-wrap gap-x-8 gap-y-4">
          <Fact icon={Calendar} label="Date & time">{parts ? `${parts.weekday}, ${parts.day} ${parts.month} · ${parts.time}` : event.date}</Fact>
          {event.location && <Fact icon={MapPin} label="Venue">{event.location}</Fact>}
          <Fact icon={Users} label="Expected">{attendingCount} devotees</Fact>
        </div>
        <div className="flex flex-col gap-4 border-t border-white/15 pt-5 sm:flex-row sm:items-end sm:justify-between">
          <RsvpControl inverse status={registration?.status} busy={busy} onChoose={onRsvp} />
          {registration?.status === ATTENDING && registration.token && <TicketChip inverse token={registration.token} />}
        </div>
      </div>
    </Card>
  )
}

export default FeaturedEvent
