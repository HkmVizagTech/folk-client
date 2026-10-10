import { ArrowLeft, Calendar, Map as MapIcon, MapPin, Ticket } from 'lucide-react'
import Photo from '../../trips/components/Photo'
import StatusPill from '../../trips/components/StatusPill'
import { useHeroIntro } from '../../trips/hooks/useHeroIntro'
import { formatDateRange, inr, plural } from '../../trips/lib/format'
import { surfaceFor } from '../../trips/lib/locations'

const Fact = ({ icon: Icon, label, children }) => (
  <div className="user-text-box flex min-w-0 items-center gap-3 rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur-md">
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 text-marigold-light"><Icon size={18} /></span>
    <div className="min-w-0">
      <p className="text-[12px] font-semibold uppercase tracking-label text-white/60">{label}</p>
      <p className="user-text truncate text-[14px] font-semibold text-white sm:text-[15px]">{children}</p>
    </div>
  </div>
)

/** Full-bleed cover with title, status and the four facts that decide a booking. */
const TripHero = ({ trip, status, pricing, placeCount, registrationClosed, onBack }) => {
  const ref = useHeroIntro()
  const { price, hasOffer, originalPrice } = pricing
  return (
    <section ref={ref} className="relative isolate flex min-h-[60svh] flex-col justify-end overflow-hidden bg-navy-900 sm:min-h-[64svh]">
      <Photo src={trip.coverImage} tone={surfaceFor(trip.slug || trip.id)} eager className="absolute inset-0" />
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/70 to-ink/10" aria-hidden="true" />
      <div className="absolute inset-0 bg-gradient-to-r from-ink/70 via-ink/20 to-transparent" aria-hidden="true" />
      <div className="yatra-mandala absolute inset-0 opacity-10 mix-blend-soft-light" aria-hidden="true" />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-8 pt-20 sm:px-6 sm:pb-12 lg:px-8">
        <button
          data-hero type="button" onClick={onBack}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 text-[14px] font-semibold text-white backdrop-blur-md transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron"
        >
          <ArrowLeft size={16} /> All trips
        </button>

        <div className="user-text-box mt-5 max-w-3xl sm:mt-6">
          <div data-hero className="flex flex-wrap items-center gap-2">
            <StatusPill status={status} />
            {trip.durationLabel && (
              <span className="user-text inline-flex h-7 max-w-full items-center rounded-full border border-white/25 bg-white/10 px-3 text-[12px] font-semibold text-white backdrop-blur-md">{trip.durationLabel}</span>
            )}
            {registrationClosed && <span className="inline-flex h-7 items-center rounded-full bg-white px-3 text-[12px] font-semibold text-ink">Registration closed</span>}
          </div>

          <h1 data-hero className="user-text mt-4 font-display text-[34px] font-semibold leading-[1.08] text-white sm:text-[56px]">{trip.title}</h1>
          <div data-hero className="mt-4 h-px w-24 bg-gradient-to-r from-marigold to-transparent" aria-hidden="true" />
          {trip.subtitle && <p data-hero className="user-text mt-4 max-w-xl text-[16px] leading-relaxed text-white/80 sm:text-[18px]">{trip.subtitle}</p>}
        </div>

        <div data-hero className="mt-6 grid grid-cols-1 gap-3 xs:grid-cols-2 lg:grid-cols-4 sm:mt-8">
          <Fact icon={Calendar} label="When">{formatDateRange(trip.startDate, trip.endDate)}</Fact>
          {trip.location && <Fact icon={MapPin} label="Where">{trip.location}</Fact>}
          {price > 0 && (
            <Fact icon={Ticket} label="From">
              {inr(price)} / person
              {hasOffer && <span className="ml-1.5 font-normal text-white/60 line-through">{inr(originalPrice)}</span>}
            </Fact>
          )}
          {placeCount > 0 && <Fact icon={MapIcon} label="Darshan">{plural(placeCount, 'holy place')}</Fact>}
        </div>
      </div>
    </section>
  )
}

export default TripHero
