import React from 'react'
import { useReveal } from '../../../hooks/useReveal'
import EventCard from './EventCard'
import FeaturedEvent from './FeaturedEvent'

/** Featured hero (All tab only) plus the grid; owns the staggered entrance. */
const EventShowcase = ({ events, featured, rsvp, resetKey }) => {
  const ref = useReveal({ selector: '[data-card]', stagger: 0.07, deps: [resetKey, events.length] })
  const [hero, ...rest] = featured ? events : [null, ...events]

  const props = (event) => ({
    event,
    registration: rsvp.registrationFor(event.id),
    attendingCount: rsvp.attendingFor(event),
    busy: !!rsvp.busy[event.id],
    onRsvp: (next) => rsvp.respond(event, next),
  })

  return (
    <div ref={ref} className="grid gap-6 lg:gap-8">
      {hero && <FeaturedEvent {...props(hero)} />}
      {rest.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {rest.map((event) => <EventCard key={event.id} {...props(event)} />)}
        </div>
      )}
    </div>
  )
}

export default EventShowcase
