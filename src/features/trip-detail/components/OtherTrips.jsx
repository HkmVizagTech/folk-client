import { ArrowRight, Bus, Calendar, Compass, Map as MapIcon } from 'lucide-react'
import Photo from '../../trips/components/Photo'
import { formatDateRange, plural } from '../../trips/lib/format'
import { normaliseLocations, surfaceFor } from '../../trips/lib/locations'
import DetailSection from './DetailSection'

const OtherTrips = ({ trips, onOpen }) => {
  if (!trips.length) return null
  return (
    <DetailSection bare icon={Bus} kicker="Also coming up" title="Other yatras">
      {/* Three across only from xl: this sits in a 2/3 column, which at 1024px is too narrow for three cards. */}
      <div className="grid grid-cols-1 gap-4 xs:grid-cols-2 xl:grid-cols-3">
        {trips.map((t) => {
          const places = normaliseLocations(t.locations).length
          return (
            <button
              key={t.id} type="button" onClick={() => onOpen?.(t.slug)} aria-label={`${t.title || 'Trip'} - view details`}
              className="group min-w-0 overflow-hidden rounded-2xl border border-line/80 bg-white text-left shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-marigold/50 hover:shadow-premium-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron"
            >
              <Photo src={t.coverImage} tone={surfaceFor(t.slug || t.id)} icon={<Compass size={24} strokeWidth={1.5} />} className="aspect-[16/9] w-full" imgClassName="group-hover:scale-105" />
              <div className="min-w-0 p-4">
                <p className="user-text font-display text-[16px] font-semibold leading-snug text-ink line-clamp-2">{t.title}</p>
                <p className="mt-2 flex min-w-0 items-center gap-1.5 text-[13px] text-ink-muted">
                  <Calendar size={13} className="shrink-0 text-saffron" /><span className="min-w-0 truncate">{formatDateRange(t.startDate, t.endDate)}</span>
                </p>
                {places > 0 && (
                  <p className="mt-1 flex min-w-0 items-center gap-1.5 text-[13px] text-saffron-dark"><MapIcon size={13} className="shrink-0" />{plural(places, 'place')}</p>
                )}
                <span className="mt-3 inline-flex items-center gap-1 text-[13px] font-semibold text-saffron-dark">View <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" /></span>
              </div>
            </button>
          )
        })}
      </div>
    </DetailSection>
  )
}

export default OtherTrips
