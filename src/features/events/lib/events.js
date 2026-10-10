export const ATTENDING = 'Attending'
export const DECLINED = 'Not Attending'
export const CANCELLED = 'Cancelled'

// Which head-count on the event each answer belongs to. `Cancelled` is a
// withdrawal, so it is deliberately absent: it sits in neither count.
export const COUNTER_FIELD = { [ATTENDING]: 'attendingCount', [DECLINED]: 'declinedCount' }

export const CATEGORIES = ['All', 'Weekly Program', 'Retreats', 'Kirtans', 'Festivals', 'Yatras', 'Seminars', 'Other']

const IST = 'Asia/Kolkata'

const timeOf = (event) => {
  const t = new Date(event.dateISO || event.date).getTime()
  return Number.isNaN(t) ? 0 : t
}

export const sortByDate = (events) => events.slice().sort((a, b) => timeOf(a) - timeOf(b))

/** Calendar-tile pieces in IST, or null when the event has no machine-readable date. */
export const dateParts = (event) => {
  const d = new Date(event.dateISO)
  if (!event.dateISO || Number.isNaN(d.getTime())) return null
  const fmt = (opts) => d.toLocaleString('en-IN', { timeZone: IST, ...opts })
  return {
    month: fmt({ month: 'short' }),
    day: fmt({ day: 'numeric' }),
    weekday: fmt({ weekday: 'short' }),
    time: fmt({ hour: 'numeric', minute: '2-digit' }),
  }
}

// `??` not `||`: 0 is a real answer once the last attendee can withdraw, and
// `||` would fall through to the number staff typed at creation.
export const expectedCount = (event) => event.attendingCount ?? event.attendees ?? 0
