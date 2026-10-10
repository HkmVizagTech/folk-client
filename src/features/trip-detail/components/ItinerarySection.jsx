import { Map as MapIcon } from 'lucide-react'
import DetailSection from './DetailSection'

/** Day-by-day timeline with a gold spine. */
const ItinerarySection = ({ itinerary }) => (
  <DetailSection id="itinerary" icon={MapIcon} kicker="Day by day" title="The itinerary">
    <ol className="relative space-y-7">
      <span className="absolute bottom-3 left-[23px] top-3 w-px bg-gradient-to-b from-marigold/70 via-marigold/30 to-transparent" aria-hidden="true" />
      {itinerary.map((item, i) => (
        <li key={i} className="relative flex min-w-0 gap-4 sm:gap-5">
          <span className="relative z-10 flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-saffron to-saffron-dark text-white shadow-md">
            <span className="text-[10px] font-semibold uppercase leading-none tracking-label opacity-85">Day</span>
            <span className="mt-0.5 max-w-full truncate px-1 font-display text-[17px] font-semibold leading-none">{item.day ?? i + 1}</span>
          </span>
          <div className="min-w-0 max-w-full pb-1 pt-1.5">
            <h3 className="user-text font-display text-[18px] font-semibold leading-snug text-ink">{item.title || `Day ${item.day ?? i + 1}`}</h3>
            {item.details && <p className="user-text mt-1.5 whitespace-pre-line text-[15px] leading-[1.75] text-ink-muted">{item.details}</p>}
          </div>
        </li>
      ))}
    </ol>
  </DetailSection>
)

export default ItinerarySection
