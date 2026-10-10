import { toDate } from '../../../lib/dates'

const lower = (v) => (v || '').toLowerCase()
const WEEK_MS = 604800000

export const isPending = (item) => lower(item.status) === 'pending'

export const upcomingTrips = (trips, today) =>
  trips.filter((t) => {
    const status = lower(t.status)
    if (status === 'draft' || status === 'cancelled' || status === 'completed') return false
    return !t.endDate || t.endDate >= today
  })

export const tripRow = (trip, registrations) => {
  const regs = registrations.filter((r) => r.tripId === trip.id)
  return {
    ...trip,
    registered: regs.filter((r) => lower(r.status) !== 'cancelled').length,
    pending: regs.filter(isPending).length,
  }
}

export const joinedThisWeek = (users) => users.filter((u) => (toDate(u.createdAt)?.getTime() || 0) > Date.now() - WEEK_MS).length

export const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`

export const roleBreakdown = (users) => [
  { label: 'Folks Heads', count: users.filter((u) => u.role === 'folks_head').length, tone: 'saffron' },
  { label: 'Devotees', count: users.filter((u) => u.role === 'devotee').length, tone: 'maroon' },
  { label: 'Administrators', count: users.filter((u) => u.role === 'admin').length, tone: 'maroon' },
]

export const topPerformers = (users, n = 20) => [...users].sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, n)
