/**
 * The places a yatra visits. Staff edit these in TripsAdmin; the field is
 * untrusted, so a half-filled row (no name, or no photo) must still render and
 * a trip with none at all simply has no places to show.
 */
export const normaliseLocations = (value) => {
  if (!Array.isArray(value)) return []
  return value
    .filter((l) => l && typeof l === 'object')
    .map((l, i) => ({
      id: typeof l.id === 'string' && l.id ? l.id : `loc-${i}`,
      name: typeof l.name === 'string' ? l.name.trim() : '',
      description: typeof l.description === 'string' ? l.description.trim() : '',
      image: typeof l.image === 'string' && l.image.trim() ? l.image.trim() : '',
    }))
    .filter((l) => l.name || l.image)
}

// Brand-harmonised stand-ins for anything with no photograph.
const SURFACES = [
  'from-saffron-light via-saffron to-navy-800',
  'from-marigold-light via-marigold to-navy-700',
  'from-saffron to-navy-900',
  'from-marigold via-saffron-dark to-navy-800',
  'from-navy-300 via-navy-600 to-navy-900',
  'from-marigold-light via-saffron-dark to-navy-900',
]

export const surfaceFor = (key = '') => {
  const str = String(key)
  let hash = 0
  for (let i = 0; i < str.length; i += 1) hash = (hash * 31 + str.charCodeAt(i)) % 9973
  return SURFACES[hash % SURFACES.length]
}
