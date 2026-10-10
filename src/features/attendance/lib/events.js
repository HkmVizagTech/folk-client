/** A profile's display name, in the order the data actually uses. */
export const devoteeName = (profile) =>
  (profile?.name || profile?.fullName || profile?.displayName || '').trim() || 'Devotee'

/**
 * Which event an "auto-detect" scan belongs to.
 *
 * Events are created without a `status` field, so looking only for
 * status === 'active' never matched and the fallback silently used events[0].
 * Prefer an explicitly active event, otherwise the one closest to right now,
 * with today/upcoming winning ties over a past one.
 */
export const pickActiveEvent = (events) => {
  const list = (events || []).filter(Boolean)
  if (!list.length) return null
  const active = list.find((e) => String(e.status || '').toLowerCase() === 'active')
  if (active) return active

  const now = Date.now()
  const scored = list
    .map((e) => {
      const t = Date.parse(e.dateISO || e.date || '')
      return Number.isNaN(t) ? null : { event: e, delta: t - now }
    })
    .filter(Boolean)
  if (!scored.length) return list[0]

  // Soonest upcoming (or in progress today); if everything is in the past, the most recent one.
  const upcoming = scored.filter((s) => s.delta >= -12 * 3600000)
  const pool = upcoming.length ? upcoming : scored
  pool.sort((a, b) => (upcoming.length ? a.delta - b.delta : b.delta - a.delta))
  return pool[0].event
}
