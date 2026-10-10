import { dateKeyIST } from '../../../lib/dates'

const DAY = 86400000
const dayLabel = (key) => new Date(`${key}T12:00:00+05:30`).toLocaleDateString('en-IN', { weekday: 'short', timeZone: 'Asia/Kolkata' })

/** The seven calendar days ending today, each with what the member logged. */
export const lastSevenDays = (logs, today) => {
  const base = Date.parse(`${today}T12:00:00+05:30`)
  const byDate = new Map(logs.map((l) => [l.date, l]))
  return Array.from({ length: 7 }, (_, i) => {
    const key = dateKeyIST(new Date(base - (6 - i) * DAY))
    const log = byDate.get(key)
    const rounds = Number(log?.roundsCompleted) || 0
    const target = Number(log?.target) || 0
    return { key, label: dayLabel(key), rounds, target, logged: !!log, done: target > 0 && rounds >= target, isToday: key === today }
  })
}

export const toDay = (v) => {
  const d = new Date(v?.toDate?.() || v)
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}
