import { MapPin } from 'lucide-react'
import ScrollRow from './ScrollRow'

/** Every holy place the crew travels to, as a scrolling strip. */
const PlaceStrip = ({ names, dark = false }) => {
  if (names.length === 0) return null
  return (
    <ScrollRow
      className="user-text-box flex items-center gap-x-5 px-5 sm:px-8"
      fadeClass={dark ? 'from-navy-900' : 'from-paper'}
      chevronClass={dark ? 'text-white/60' : 'text-saffron'}
    >
      <span className={`shrink-0 text-[12px] font-semibold uppercase tracking-label ${dark ? 'text-marigold-light' : 'text-ink-muted'}`}>On the map</span>
      {names.slice(0, 12).map((name) => (
        <span key={name} className={`flex shrink-0 items-center gap-1.5 text-[14px] font-medium ${dark ? 'text-white/85' : 'text-ink-soft'}`}>
          <MapPin size={13} className="shrink-0 text-saffron" />
          <span className="user-text max-w-[12rem] truncate">{name}</span>
        </span>
      ))}
      {names.length > 12 && <span className={`shrink-0 whitespace-nowrap text-[13px] ${dark ? 'text-white/55' : 'text-ink-muted'}`}>+{names.length - 12} more</span>}
    </ScrollRow>
  )
}

export default PlaceStrip
