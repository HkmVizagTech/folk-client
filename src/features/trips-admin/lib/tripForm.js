import { EMPTY_FORM, GALLERY_MAX, TRIP_STATUSES, newLocationId } from './constants'
import { slugify, toInt, toNumber } from './format'

export const formFromTrip = (trip) => ({
  slug: trip.slug || '',
  title: trip.title || '',
  subtitle: trip.subtitle || '',
  location: trip.location || '',
  description: trip.description || '',
  // Either an https URL (R2) or a legacy inline data: URI; both render as <img src>.
  coverImage: trip.coverImage || '',
  gallery: Array.isArray(trip.gallery) ? trip.gallery.slice(0, GALLERY_MAX) : [],
  startDate: trip.startDate || '',
  endDate: trip.endDate || '',
  durationLabel: trip.durationLabel || '',
  price: trip.price ?? '',
  originalPrice: trip.originalPrice ?? '',
  advanceAmount: trip.advanceAmount ?? '',
  capacity: trip.capacity ?? '',
  eligibility: trip.eligibility ?? '',
  status: TRIP_STATUSES.includes(trip.status) ? trip.status : 'draft',
  registrationOpen: !!trip.registrationOpen,
  // A trip saved before these fields existed counts as online-enabled.
  onlinePaymentEnabled: trip.onlinePaymentEnabled !== false,
  cashPaymentEnabled: trip.cashPaymentEnabled === true,
  highlights: Array.isArray(trip.highlights) ? trip.highlights : [],
  itinerary: Array.isArray(trip.itinerary)
    ? trip.itinerary.map((d, i) => ({
        day: toInt(d?.day) || i + 1,
        title: d?.title || '',
        details: d?.details || '',
      }))
    : [],
  // Rows keep their stored id; anything missing one gets a fresh stable id.
  locations: Array.isArray(trip.locations)
    ? trip.locations.map((l) => ({
        id: String(l?.id || '') || newLocationId(),
        name: l?.name || '',
        description: l?.description || '',
        image: l?.image || '',
      }))
    : [],
  inclusions: Array.isArray(trip.inclusions) ? trip.inclusions : [],
  exclusions: Array.isArray(trip.exclusions) ? trip.exclusions : [],
  meetingPoint: trip.meetingPoint || '',
  contactPhone: trip.contactPhone || '',
})

/** Pre-filled CREATE form: a guaranteed-unique slug and reset publishing flags. */
export const duplicateForm = (trip, trips) => {
  const base = formFromTrip(trip)
  const taken = new Set((trips || []).map((t) => (t.slug || '').toLowerCase()))
  let candidate = slugify(`${base.slug || base.title}-copy`) || 'trip-copy'
  let n = 2
  while (taken.has(candidate)) {
    candidate = slugify(`${base.slug || base.title}-copy-${n}`)
    n += 1
  }
  return { ...base, title: `${base.title} (Copy)`, slug: candidate, status: 'draft', registrationOpen: false }
}

export const buildPayload = (f) => ({
  slug: (f.slug || '').trim(),
  title: (f.title || '').trim(),
  subtitle: (f.subtitle || '').trim(),
  location: (f.location || '').trim(),
  description: f.description || '',
  coverImage: f.coverImage || '',
  gallery: (f.gallery || []).slice(0, GALLERY_MAX),
  startDate: f.startDate || '',
  endDate: f.endDate || '',
  durationLabel: (f.durationLabel || '').trim(),
  price: toNumber(f.price),
  originalPrice: toNumber(f.originalPrice),
  advanceAmount: toNumber(f.advanceAmount),
  capacity: toInt(f.capacity),
  eligibility: String(f.eligibility || '').trim(),
  status: TRIP_STATUSES.includes(f.status) ? f.status : 'draft',
  registrationOpen: !!f.registrationOpen,
  onlinePaymentEnabled: !!f.onlinePaymentEnabled,
  cashPaymentEnabled: !!f.cashPaymentEnabled,
  highlights: (f.highlights || []).map((s) => String(s).trim()).filter(Boolean),
  itinerary: (f.itinerary || [])
    .map((d, i) => ({ day: toInt(d.day) || i + 1, title: String(d.title || '').trim(), details: String(d.details || '').trim() }))
    .filter((d) => d.title || d.details),
  // A completely blank row is dropped; a name, description or photo keeps it.
  locations: (f.locations || [])
    .map((l, i) => ({
      id: String(l?.id || '') || `loc-${i + 1}`,
      name: String(l?.name || '').trim(),
      description: String(l?.description || '').trim(),
      image: String(l?.image || ''),
    }))
    .filter((l) => l.name || l.description || l.image),
  inclusions: (f.inclusions || []).map((s) => String(s).trim()).filter(Boolean),
  exclusions: (f.exclusions || []).map((s) => String(s).trim()).filter(Boolean),
  meetingPoint: (f.meetingPoint || '').trim(),
  contactPhone: (f.contactPhone || '').trim(),
})

export const validateTrip = (form, trips, editingId) => {
  const e = {}
  if (!form.title.trim()) e.title = 'Title is required'
  const slug = (form.slug || '').trim()
  if (!slug) {
    e.slug = 'Slug is required — it is the /trip/<slug> address'
  } else if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) {
    e.slug = 'Use lowercase letters, numbers and hyphens only'
  } else {
    const clash = (trips || []).some(
      (t) => t.id !== editingId && String(t.slug || '').toLowerCase() === slug.toLowerCase(),
    )
    if (clash) e.slug = `"${slug}" is already used by another trip — pick a different one`
  }
  if (!form.startDate) e.startDate = 'Start date is required'
  if (!form.endDate) e.endDate = 'End date is required'
  if (form.startDate && form.endDate && form.endDate < form.startDate) {
    e.endDate = 'End date cannot be before the start date'
  }
  if (form.price !== '' && toNumber(form.price) < 0) e.price = 'Price cannot be negative'
  if (form.advanceAmount !== '' && toNumber(form.advanceAmount) < 0) e.advanceAmount = 'Advance cannot be negative'
  if (form.advanceAmount !== '' && form.price !== '' && toNumber(form.advanceAmount) > toNumber(form.price)) {
    e.advanceAmount = 'Advance cannot exceed the full price'
  }
  if (form.capacity !== '' && toInt(form.capacity) < 0) e.capacity = 'Capacity cannot be negative'
  return e
}

export const sectionHasErrors = (errors) => ({
  basics: !!(errors.title || errors.slug),
  dates: !!(errors.startDate || errors.endDate || errors.price || errors.advanceAmount || errors.capacity),
  media: false,
  itinerary: false,
  locations: false,
  inclusions: false,
})

export { EMPTY_FORM }
