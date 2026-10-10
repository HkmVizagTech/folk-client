import { todayISO } from '../../trips/lib/format'
import { normaliseLocations } from '../../trips/lib/locations'

const list = (v) => (Array.isArray(v) ? v.filter(Boolean) : [])

/** Normalised, render-ready content lists of a trip document. */
export const getTripContent = (trip) => ({
  highlights: list(trip.highlights),
  inclusions: list(trip.inclusions),
  exclusions: list(trip.exclusions),
  gallery: list(trip.gallery).slice(0, 6),
  locations: normaliseLocations(trip.locations),
  itinerary: list(trip.itinerary).slice().sort((a, b) => (Number(a.day) || 0) - (Number(b.day) || 0)),
})

export const hasNoContent = (trip, c) =>
  !trip.description && !c.highlights.length && !c.itinerary.length && !c.inclusions.length
  && !c.exclusions.length && !c.gallery.length && !c.locations.length

/** Up to three other trips still open for booking, soonest first. */
export const pickOtherTrips = (allTrips, trip, isStaff) => {
  const today = todayISO()
  return (allTrips || [])
    .filter((t) => t.id !== trip.id)
    .filter((t) => isStaff || (t.status || '').toLowerCase() !== 'draft')
    .filter((t) => {
      const s = (t.status || '').toLowerCase()
      if (s === 'completed' || s === 'cancelled') return false
      return !t.endDate || t.endDate >= today
    })
    .sort((a, b) => (a.startDate || '9999-99-99').localeCompare(b.startDate || '9999-99-99'))
    .slice(0, 3)
}

export const buildWhatsappHref = (waNum, title) =>
  waNum ? `https://wa.me/${waNum}?text=${encodeURIComponent(`Hare Krishna! I have a question about the ${title || 'yatra'}.`)}` : null

export const telHref = (phone) => `tel:${String(phone).replace(/\s/g, '')}`
