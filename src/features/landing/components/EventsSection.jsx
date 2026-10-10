import { ArrowRight, Bell, Calendar, MapPin } from 'lucide-react';
import { Badge, Button, Card, Skeleton } from '../../../components/ui';
import { EmptyState } from '../../../components/common';
import LandingSection from './LandingSection';
import SectionHeading from './SectionHeading';

const TONES = ['from-saffron to-navy-700', 'from-navy-600 to-navy-900', 'from-marigold-dark to-navy-700'];

const EventCard = ({ event, index, onAction }) => (
  <Card data-reveal hover padded={false} className="group flex flex-col overflow-hidden rounded-3xl">
    <div className={`relative h-48 overflow-hidden bg-gradient-to-br ${TONES[index % TONES.length]}`}>
      {event.img
        ? <img src={event.img} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
        : <Calendar size={44} strokeWidth={1.4} className="absolute inset-0 m-auto text-white/35" aria-hidden="true" />}
      <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" aria-hidden="true" />
      <Badge tone="saffron" className="absolute left-4 top-4 bg-white/95 uppercase tracking-label shadow-soft">{event.category || 'Event'}</Badge>
      <p className="absolute bottom-4 left-4 right-4 flex items-center gap-2 text-[13px] font-semibold text-white">
        <Calendar size={15} className="shrink-0 text-marigold-light" aria-hidden="true" />
        <span className="truncate">{event.date}{event.time ? ` · ${event.time}` : ''}</span>
      </p>
    </div>

    <div className="flex flex-1 flex-col p-6 sm:p-7">
      <Card.Title className="user-text text-[20px] transition-colors group-hover:text-saffron-dark">{event.title}</Card.Title>
      {event.location && (
        <p className="user-text mt-2.5 flex items-center gap-1.5 text-[14px] font-semibold text-ink-muted">
          <MapPin size={15} className="shrink-0 text-saffron" aria-hidden="true" /> {event.location}
        </p>
      )}
      {event.description && <p className="user-text mt-3 line-clamp-4 text-[15px] leading-[1.7] text-ink-muted">{event.description}</p>}
      <Button
        variant="dark"
        onClick={onAction}
        aria-label={`View details for ${event.title || 'this event'}`}
        className="mt-6 w-full sm:mt-auto"
      >
        View details <ArrowRight size={15} aria-hidden="true" />
      </Button>
    </div>
  </Card>
);

const EventsSkeleton = () => (
  <div className="grid gap-5 sm:gap-6 md:grid-cols-3" aria-busy="true">
    {[0, 1, 2].map((i) => <Skeleton key={i} className="h-[420px] rounded-3xl" />)}
  </div>
);

const EventsSection = ({ events, loading, onLoginClick }) => (
  <LandingSection id="events">
    <SectionHeading
      eyebrow="Events"
      title="What is coming up"
      accent="next."
      body="Kirtan nights, festivals, workshops and yatras. Members book straight from the app, and most of them fill well before the day."
    />
    <div className="mt-12">
      {loading && !events.length ? (
        <EventsSkeleton />
      ) : events.length > 0 ? (
        <div className="grid gap-5 sm:gap-6 md:grid-cols-3">
          {events.slice(0, 3).map((event, i) => <EventCard key={event.id} event={event} index={i} onAction={onLoginClick} />)}
        </div>
      ) : (
        <div data-reveal>
          <EmptyState
            icon={Calendar}
            title="Nothing on the calendar right now."
            description="New sessions, kirtans and yatras are added regularly. Sign in to be notified the moment the next one opens for booking."
            className="bg-white py-16 shadow-card"
            action={<Button size="lg" onClick={onLoginClick}>Notify me <Bell size={16} aria-hidden="true" /></Button>}
          />
        </div>
      )}
    </div>
  </LandingSection>
);

export default EventsSection;
