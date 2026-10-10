import { daysBetween, dateKeyIST, toDate } from '../../../lib/dates'

export const CHANNELS = ['Call', 'WhatsApp', 'Met at program', 'Home visit']

export const addDays = (key, n) => dateKeyIST(new Date(Date.parse(`${key}T12:00:00+05:30`) + n * 86400000))

export const dayFromKey = (key) => new Date(`${key}T12:00:00+05:30`)

/** Days until the next birthday (0 = today), or null without a date of birth. */
export const daysToBirthday = (dob, today) => {
  const m = /^\d{4}-(\d{2})-(\d{2})$/.exec(dob || '')
  if (!m) return null
  const y = Number(today.slice(0, 4))
  for (const year of [y, y + 1]) {
    const d = daysBetween(today, `${year}-${m[1]}-${m[2]}`)
    if (d !== null && d >= 0) return d
  }
  return null
}

export const birthdayText = (days) => (days === 0 ? 'today' : days === 1 ? 'tomorrow' : `in ${days} days`)

/** The programs that already happened in the last two months: the yardstick for turning up regularly. */
export const recentProgramsOf = (events) => {
  const from = Date.now() - 60 * 86400000
  const until = Date.now() - 2 * 3600 * 1000 // a program starting later today hasn't happened yet
  return events
    .map((e) => ({ id: e.id, t: toDate(e.dateISO || e.date)?.getTime() || null }))
    .filter((e) => e.t && e.t >= from && e.t <= until)
    .sort((a, b) => b.t - a.t)
    .slice(0, 8)
}

export const lastSeenMap = (attendance) => {
  const map = new Map()
  for (const a of attendance) {
    const d = toDate(a.createdAt || a.timestamp)
    const id = a.userId || a.uid
    if (d && id && !map.has(id)) map.set(id, dateKeyIST(d))
  }
  return map
}

/** How many of the recent programs each member was marked at (QR or roll call). */
export const attendedMap = (attendance, programs) => {
  const ids = new Set(programs.map((p) => p.id))
  const map = new Map()
  for (const a of attendance) {
    const uid = a.userId || a.uid
    if (!uid || !ids.has(a.eventId)) continue
    if (!map.has(uid)) map.set(uid, new Set())
    map.get(uid).add(a.eventId)
  }
  return map
}

/** Derives the care signals for one member. `weight >= 2` reasons put them on the attention list. */
export const buildRow = (m, { today, lastSeen, attendedBy, programCount }) => {
  const chantGap = m.lastSadhanaDate ? daysBetween(m.lastSadhanaDate, today) : null
  const seen = lastSeen.get(m.id) || null
  const seenGap = seen ? daysBetween(seen, today) : null
  const followDue = m.nextFollowUpDate && m.nextFollowUpDate <= today
  const reasons = []
  if (followDue) reasons.push({ text: `Follow-up due${m.nextFollowUpDate < today ? ` (${daysBetween(m.nextFollowUpDate, today)}d overdue)` : ' today'}`, weight: 3 })
  if (chantGap === null) reasons.push({ text: 'Has never logged chanting', weight: 1 })
  else if (chantGap >= 7) reasons.push({ text: `No chanting logged for ${chantGap} days`, weight: 2 })
  if (seenGap === null) reasons.push({ text: 'Not checked in at a program yet', weight: 1 })
  else if (seenGap >= 21) reasons.push({ text: `Not at a program for ${seenGap} days`, weight: 2 })
  // A guide who just spoke to them and scheduled the next follow-up has it in
  // hand: keep them off the attention list until that date.
  const lastFollowUp = toDate(m.lastFollowUpAt)
  const snoozed = !followDue && m.nextFollowUpDate && m.nextFollowUpDate > today
    && lastFollowUp && Date.now() - lastFollowUp.getTime() < 14 * 86400000
  return {
    ...m, chantGap, seen, seenGap, reasons, snoozed: !!snoozed,
    score: snoozed ? 0 : reasons.reduce((s, r) => s + r.weight, 0),
    attended: (attendedBy.get(m.id) || new Set()).size,
    programs: programCount,
    bday: daysToBirthday(m.dob, today),
  }
}
