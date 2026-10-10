export const TRIP_STATUSES = ['draft', 'upcoming', 'ongoing', 'completed', 'cancelled']
export const REG_STATUSES = ['pending', 'confirmed', 'waitlisted', 'cancelled']

// Images live in the R2 bucket and the trip document only holds their URLs.
export const GALLERY_MAX = 3

export const UPLOAD_PHASE_LABEL = {
  compressing: 'Compressing…',
  requesting: 'Preparing…',
  uploading: 'Uploading…',
}

// Stable key for a location row - React keys and reordering both depend on it.
export const newLocationId = () => {
  const uuid = globalThis.crypto?.randomUUID?.()
  if (uuid) return uuid
  return `loc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export const EMPTY_FORM = {
  slug: '',
  title: '',
  subtitle: '',
  location: '',
  description: '',
  coverImage: '',
  gallery: [],
  startDate: '',
  endDate: '',
  durationLabel: '',
  price: '',
  // What the yatra really costs when the temple subsidises it; shown struck through.
  originalPrice: '',
  advanceAmount: '',
  capacity: '',
  // 'Boys only', 'Girls only', or blank when everybody is welcome.
  eligibility: '',
  status: 'draft',
  registrationOpen: false,
  // Online defaults ON so a trip that predates these fields behaves as before.
  onlinePaymentEnabled: true,
  cashPaymentEnabled: false,
  highlights: [],
  itinerary: [],
  locations: [],
  inclusions: [],
  exclusions: [],
  meetingPoint: '',
  contactPhone: '',
}
