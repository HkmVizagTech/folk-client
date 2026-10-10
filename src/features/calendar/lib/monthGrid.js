import { toDate, dateKeyIST } from '../../../lib/dates'

export const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const pad = (n) => String(n).padStart(2, '0')

export const cursorOf = (key) => ({ y: Number(key.slice(0, 4)), m: Number(key.slice(5, 7)) - 1 })

export const shiftMonth = ({ y, m }, delta) => {
  const n = new Date(Date.UTC(y, m + delta, 1))
  return { y: n.getUTCFullYear(), m: n.getUTCMonth() }
}

export const monthLabel = ({ y, m }) => new Date(Date.UTC(y, m, 1)).toLocaleDateString('en-IN', { month: 'long', year: 'numeric', timeZone: 'UTC' })

/** Monday-first grid of 'YYYY-MM-DD' keys, null for padding cells. */
export const buildCells = ({ y, m }) => {
  const offset = (new Date(Date.UTC(y, m, 1)).getUTCDay() + 6) % 7
  const days = new Date(Date.UTC(y, m + 1, 0)).getUTCDate()
  const out = Array.from({ length: offset }, () => null)
  for (let d = 1; d <= days; d++) out.push(`${y}-${pad(m + 1)}-${pad(d)}`)
  while (out.length % 7) out.push(null)
  return out
}

/** Map of day key to that day's events, earliest first. */
export const groupByDay = (events) => {
  const map = new Map()
  for (const e of events) {
    const d = toDate(e.dateISO || e.date)
    if (!d) continue
    const k = dateKeyIST(d)
    if (!map.has(k)) map.set(k, [])
    map.get(k).push({ ...e, _d: d })
  }
  for (const list of map.values()) list.sort((a, b) => a._d - b._d)
  return map
}

export const longDayLabel = (key) => new Date(`${key}T12:00:00+05:30`).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Asia/Kolkata' })

export const upcomingOwnedBy = (events, uid, limit = 4) => {
  const from = Date.now() - 6 * 3600 * 1000
  return events
    .filter((e) => e.ownerId === uid)
    .map((e) => ({ ...e, _d: toDate(e.dateISO || e.date) }))
    .filter((e) => e._d && e._d.getTime() >= from)
    .sort((a, b) => a._d - b._d)
    .slice(0, limit)
}
