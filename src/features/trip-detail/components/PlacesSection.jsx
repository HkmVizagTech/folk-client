import { Map as MapIcon, MapPin } from 'lucide-react'
import Photo from '../../trips/components/Photo'
import ScrollRow from '../../trips/components/ScrollRow'
import { plural } from '../../trips/lib/format'
import { surfaceFor } from '../../trips/lib/locations'
import { SectionHeading } from './DetailSection'

const altFor = (loc, tripTitle) => (loc.name ? `${loc.name}${tripTitle ? ` - ${tripTitle}` : ''}` : '')
const Index = ({ i, className }) => <span className={className}>{String(i + 1).padStart(2, '0')}</span>

const RouteStrip = ({ locations }) => (
  <ScrollRow outerClassName="-mx-1 mb-6 sm:mb-8" className="px-1 py-0.5">
    <ol className="flex min-w-min items-center">
      {locations.map((loc, i) => (
        <li key={loc.id} className="flex shrink-0 items-center">
          {i > 0 && <span className="h-px w-5 shrink-0 bg-marigold/60 sm:w-8" aria-hidden="true" />}
          <span className="inline-flex items-center gap-2 rounded-full border border-line bg-white py-1.5 pl-1.5 pr-3.5 shadow-soft">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-saffron text-[12px] font-semibold text-white">{i + 1}</span>
            <span className="user-text max-w-[11rem] truncate text-[13px] font-semibold text-ink-soft">{loc.name || `Stop ${i + 1}`}</span>
          </span>
        </li>
      ))}
    </ol>
  </ScrollRow>
)

/** Editorial row: a large photograph against its prose, alternating sides. */
const PlaceRow = ({ loc, i, tripTitle }) => {
  const flip = i % 2 === 1
  return (
    <article className="user-text-box group grid grid-cols-1 overflow-hidden rounded-2xl border border-line/80 bg-white shadow-card transition-shadow duration-300 hover:shadow-premium-xl lg:grid-cols-12">
      <Photo
        src={loc.image} alt={altFor(loc, tripTitle)} tone={surfaceFor(loc.name || loc.id)} icon={<MapPin size={34} strokeWidth={1.5} />}
        className={`aspect-[16/10] w-full lg:col-span-7 lg:aspect-auto lg:min-h-[300px] ${flip ? 'lg:order-2' : ''}`}
        imgClassName="group-hover:scale-[1.04]"
      />
      <div className={`flex min-w-0 flex-col justify-center p-5 sm:p-7 lg:col-span-5 lg:p-8 ${flip ? 'lg:order-1' : ''}`}>
        <div className="flex items-center gap-3">
          <Index i={i} className="shrink-0 font-display text-[15px] font-semibold text-saffron-dark" />
          <span className="h-px flex-1 bg-gradient-to-r from-marigold/70 to-transparent" aria-hidden="true" />
        </div>
        <h3 className="user-text mt-3 font-display text-[22px] font-semibold leading-tight text-ink sm:text-[26px]">{loc.name || `Stop ${i + 1}`}</h3>
        {loc.description && <p className="user-text mt-3 whitespace-pre-line text-[15px] leading-[1.75] text-ink-muted">{loc.description}</p>}
      </div>
    </article>
  )
}

/** Mosaic tile used when staff named the stops but wrote no prose. */
const PlaceTile = ({ loc, i, tripTitle }) => (
  <figure className="group min-w-0">
    <Photo
      src={loc.image} alt={altFor(loc, tripTitle)} tone={surfaceFor(loc.name || loc.id)} icon={<MapPin size={28} strokeWidth={1.5} />}
      className="aspect-[4/5] w-full rounded-2xl border border-line/80 shadow-card" imgClassName="group-hover:scale-[1.05]"
    >
      <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-transparent" aria-hidden="true" />
      <figcaption className="user-text-box absolute inset-x-0 bottom-0 p-3.5 sm:p-5">
        <Index i={i} className="text-[12px] font-semibold text-marigold-light" />
        <p className="user-text mt-1 font-display text-[16px] font-semibold leading-tight text-white sm:text-[18px]">{loc.name || `Stop ${i + 1}`}</p>
      </figcaption>
    </Photo>
  </figure>
)

/** The centrepiece: a pilgrimage is sold by where it goes. Layout is chosen from the data. */
const PlacesSection = ({ locations, tripTitle }) => {
  if (!locations.length) return null
  const hasProse = locations.some((l) => l.description)
  return (
    <section id="places" data-reveal className="user-text-box scroll-mt-24">
      <SectionHeading
        icon={MapIcon} kicker="On this yatra" title="The places you'll visit"
        description={`${plural(locations.length, 'stop')} on the route: the darshan this journey is actually for.`}
      />
      {locations.length > 1 && <RouteStrip locations={locations} />}
      {hasProse ? (
        <div className="space-y-4 sm:space-y-6">
          {locations.map((loc, i) => <PlaceRow key={loc.id} loc={loc} i={i} tripTitle={tripTitle} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
          {locations.map((loc, i) => <PlaceTile key={loc.id} loc={loc} i={i} tripTitle={tripTitle} />)}
        </div>
      )}
    </section>
  )
}

export default PlacesSection
