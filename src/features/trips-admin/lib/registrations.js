import { formatStamp, toInt, toNumber, tsToDate } from './format'
import { payMeta } from './payments'

export const regStatusOf = (reg) => (reg.status || 'pending').toLowerCase()

/** Travellers as one readable cell: "Ravi | 21 | Male | aadhaar 1234…", one per line. */
export const travellerSummary = (reg) => (reg.travellers || [])
  .map((t) => [t.name, t.age, t.gender, [t.idType, t.idNumber].filter(Boolean).join(' ')]
    .filter((x) => x !== undefined && x !== null && x !== '')
    .join(' | '))
  .filter(Boolean)
  .join('\n')

/** Where each traveller studies or works, one per line. */
export const studentSummary = (reg) => (reg.travellers || [])
  .map((t) => [t.name, t.college, t.course, t.year].filter(Boolean).join(' | '))
  .filter(Boolean)
  .join('\n')

/** Has everything a ticket needs, for every seat. */
export const detailsComplete = (reg) => {
  const seats = parseInt(reg?.seats, 10) || 0
  const list = reg?.travellers || []
  if (!seats || list.length < seats) return false
  return list.slice(0, seats).every((t) => String(t?.name || '').trim() && Number(t?.age) > 0 && t?.gender)
}

export const filterRegistrations = (registrations, { trip, status, method, search }, resolve) => {
  const term = search.trim().toLowerCase()
  return (registrations || [])
    .filter((r) => (trip === 'all' ? true : r.tripId === trip))
    .filter((r) => (status === 'all' ? true : regStatusOf(r) === status))
    .filter((r) => (method === 'all' ? true : payMeta(resolve(r).state).rail === method))
    .filter((r) => {
      if (!term) return true
      return ['userName', 'userPhone', 'userEmail', 'tripTitle']
        .some((k) => String(r[k] || '').toLowerCase().includes(term))
    })
    .sort((a, b) => (tsToDate(b.createdAt)?.getTime() || 0) - (tsToDate(a.createdAt)?.getTime() || 0))
}

/* "Collected" is money genuinely in hand: webhook-verified online payments
 * plus cash a staff member has attested to. */
export const summarizeRegistrations = (regs, resolve) => {
  let confirmed = 0
  let seats = 0
  let online = 0
  let cash = 0
  let pending = 0
  let cashToCollect = 0
  regs.forEach((r) => {
    const status = regStatusOf(r)
    const due = toNumber(r.amountDue)
    const pay = resolve(r)
    if (status === 'confirmed') {
      confirmed += 1
      seats += toInt(r.seats) || 1
    }
    if (pay.state === 'online_paid') {
      online += pay.amount > 0 ? pay.amount : due
    } else if (pay.state === 'cash_collected') {
      cash += pay.amount > 0 ? pay.amount : due
    } else if (status !== 'cancelled' && pay.state !== 'checking') {
      pending += due
      if (pay.state === 'cash_pending') cashToCollect += 1
    }
  })
  return { total: regs.length, confirmed, seats, collected: online + cash, online, cash, pending, cashToCollect }
}

export const tripRegStats = (registrations) => {
  const map = new Map()
  ;(registrations || []).forEach((r) => {
    const key = r.tripId || '—'
    const entry = map.get(key) || { count: 0, seats: 0, confirmed: 0 }
    entry.count += 1
    if (regStatusOf(r) === 'confirmed') {
      entry.confirmed += 1
      entry.seats += toInt(r.seats) || 1
    }
    map.set(key, entry)
  })
  return map
}

// The travel manifest staff carry; the office reconciles the cash box against it.
const EXPORT_HEADERS = [
  'Name', 'Phone', 'Email', 'Trip', 'Trip Slug', 'Seats',
  'Amount Due (INR)', 'Payment Method', 'Payment State',
  'Online Verified (INR)', 'Order ID',
  'Cash Collected', 'Cash Amount (INR)', 'Cash Collected On', 'Cash Collected By',
  'Status', 'Registered On', 'Travellers (name | age | gender | ID)', 'College / Course / Year', 'Boarding Point',
  'Traveller Notes', 'Emergency Contact', 'Staff Notes',
]

export const buildExport = (regs, resolve) => ({
  headers: EXPORT_HEADERS,
  rows: regs.map((r) => {
    const pay = resolve(r)
    const meta = payMeta(pay.state)
    return [
      r.userName || '',
      r.userPhone || '',
      r.userEmail || '',
      r.tripTitle || '',
      r.tripSlug || '',
      toInt(r.seats) || 1,
      toNumber(r.amountDue),
      meta.rail === 'none' ? '' : meta.rail,
      meta.label,
      pay.state === 'online_paid' ? pay.onlineAmount : '',
      pay.orderId || '',
      pay.cashDone ? 'yes' : 'no',
      pay.cashDone ? pay.cashAmount : '',
      pay.cashDone ? formatStamp(pay.cashAt) : '',
      pay.cashDone ? (pay.cashBy || '') : '',
      r.status || 'pending',
      formatStamp(r.createdAt),
      travellerSummary(r),
      studentSummary(r),
      r.pickup || '',
      r.travellerNotes || '',
      r.emergencyContact || '',
      r.staffNotes || '',
    ]
  }),
})
