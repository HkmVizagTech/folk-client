import { MapPin } from 'lucide-react'
import Photo from './Photo'
import { surfaceFor } from '../lib/locations'
import { plural } from '../lib/format'

/** A stack of place photographs, the count and the route as a line of names. */
const LocationStrip = ({ locations }) => {
  if (locations.length === 0) return null
  const withPhotos = locations.filter((l) => l.image).slice(0, 3)
  const remaining = locations.length - withPhotos.length
  const names = locations.map((l) => l.name).filter(Boolean).join(' · ')

  return (
    <div className="user-text-box flex min-w-0 items-center gap-3">
      {withPhotos.length > 0 && (
        <div className="flex shrink-0 -space-x-2.5" aria-hidden="true">
          {withPhotos.map((loc) => (
            <Photo key={loc.id} src={loc.image} tone={surfaceFor(loc.name || loc.id)} className="h-9 w-9 rounded-xl shadow-sm ring-2 ring-white" />
          ))}
          {remaining > 0 && (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-navy text-[11px] font-semibold text-white shadow-sm ring-2 ring-white">
              +{remaining}
            </span>
          )}
        </div>
      )}
      <div className="min-w-0">
        <p className="flex items-center gap-1.5 text-[12px] font-semibold text-saffron-dark">
          {withPhotos.length === 0 && <MapPin size={13} className="shrink-0" />}
          Visits {plural(locations.length, 'place')}
        </p>
        {names && <p className="user-text mt-0.5 truncate text-[13px] text-ink-muted">{names}</p>}
      </div>
    </div>
  )
}

export default LocationStrip
