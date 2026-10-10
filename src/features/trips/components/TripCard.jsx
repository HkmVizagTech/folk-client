import { useMemo } from 'react'
import { ArrowRight, Calendar, Clock, Compass, MapPin, Users } from 'lucide-react'
import { Badge } from '../../../components/ui'
import Photo from './Photo'
import StatusPill from './StatusPill'
import LocationStrip from './LocationStrip'
import SeatsBadge from './SeatsBadge'
import { formatDateRange, inr } from '../lib/format'
import { normaliseLocations, surfaceFor } from '../lib/locations'

const Chip = ({ icon: Icon, tone = 'neutral', children }) => (
  <Badge tone={tone} size="sm" className="max-w-full min-w-0 font-medium">
    <Icon size={12} className="shrink-0" />
    <span className="user-text min-w-0 truncate">{children}</span>
  </Badge>
)

const Price = ({ trip }) => {
  if (!(Number(trip.price) > 0)) return <p className="text-[15px] font-semibold text-emerald-700">Free / by seva</p>
  const hasOffer = Number(trip.originalPrice) > Number(trip.price)
  return (
    <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5">
      <p className="user-text font-display text-[24px] font-semibold leading-none text-ink">{inr(trip.price)}</p>
      {hasOffer && <p className="text-[13px] text-ink-muted line-through">{inr(trip.originalPrice)}</p>}
      <p className="text-[12px] text-ink-muted">per person</p>
    </div>
  )
}

const TripCard = ({ trip, seatsLeft, onOpen }) => {
  const status = (trip.status || 'upcoming').toLowerCase()
  const locations = useMemo(() => normaliseLocations(trip.locations), [trip.locations])
  const href = trip.slug ? `/trip/${encodeURIComponent(trip.slug)}` : undefined
  const registrationClosed = trip.registrationOpen === false && status !== 'completed' && status !== 'cancelled'

  // A real <a href> keeps the card copyable and crawlable; only a plain left-click is SPA-handled.
  const handleLinkClick = (e) => {
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return
    e.preventDefault()
    onOpen(trip.slug)
  }

  return (
    <article className="group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-line/80 bg-white shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-marigold/50 hover:shadow-premium-xl focus-within:ring-2 focus-within:ring-saffron focus-within:ring-offset-2">
      <Photo
        src={trip.coverImage}
        alt={trip.title ? `${trip.title} cover` : 'Trip cover'}
        tone={surfaceFor(trip.slug || trip.id)}
        icon={<Compass size={42} strokeWidth={1.5} />}
        className="aspect-[16/10] w-full"
        imgClassName="group-hover:scale-[1.05]"
      >
        <div className="absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/10 to-transparent" aria-hidden="true" />
        <div className="absolute inset-x-4 top-4 flex flex-wrap gap-2">
          <StatusPill status={status} />
          {registrationClosed && (
            <span className="inline-flex h-7 items-center rounded-full bg-white px-3 text-[12px] font-semibold text-ink shadow-sm">Registration closed</span>
          )}
        </div>
        <p className="user-text-box absolute inset-x-4 bottom-4 flex items-center gap-1.5 text-[13px] font-semibold text-white">
          <Calendar size={14} className="shrink-0 text-marigold-light" />
          <span className="min-w-0 truncate">{formatDateRange(trip.startDate, trip.endDate)}</span>
        </p>
      </Photo>

      <div className="user-text-box flex flex-1 flex-col gap-4 p-5">
        <div className="min-w-0">
          <h3 className="user-text font-display text-[19px] font-semibold leading-snug text-ink transition-colors line-clamp-2 group-hover:text-navy">
            <a href={href} onClick={handleLinkClick} className="outline-none after:absolute after:inset-0 after:rounded-2xl after:content-['']">
              {trip.title || 'Untitled trip'}
            </a>
          </h3>
          {trip.subtitle && <p className="user-text mt-1.5 text-[14px] leading-relaxed text-ink-muted line-clamp-2">{trip.subtitle}</p>}
        </div>

        <LocationStrip locations={locations} />

        {(trip.location || trip.durationLabel || trip.eligibility) && (
          <div className="flex flex-wrap gap-2">
            {trip.location && <Chip icon={MapPin} tone="saffron">{trip.location}</Chip>}
            {trip.durationLabel && <Chip icon={Clock}>{trip.durationLabel}</Chip>}
            {trip.eligibility && <Chip icon={Users} tone="maroon">{trip.eligibility}</Chip>}
          </div>
        )}

        <div className="mt-auto flex items-end justify-between gap-3 border-t border-line/80 pt-4">
          <div className="min-w-0 space-y-2">
            <Price trip={trip} />
            <SeatsBadge seatsLeft={seatsLeft} />
          </div>
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-navy text-white transition-all duration-300 group-hover:translate-x-0.5 group-hover:bg-saffron">
            <ArrowRight size={18} />
          </span>
        </div>
      </div>
    </article>
  )
}

export default TripCard
