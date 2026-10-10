import { Banknote, Clock, CreditCard, HandCoins, Loader2, XCircle } from 'lucide-react'
import { toNumber } from './format'

/* Five resolved states plus a transient "checking". Online and cash differ in
 * hue AND icon so staff reconciling a cash box can tell them apart at a glance.
 * `settled` means money is genuinely in hand: only a verified payments doc
 * (online) or the staff-written cashCollected attestation (cash) sets it. */
export const PAY_STATES = {
  online_paid: { label: 'Online paid', rail: 'online', settled: true, tone: 'success', dot: 'bg-emerald-500', icon: CreditCard },
  online_pending: { label: 'Online pending', rail: 'online', settled: false, tone: 'warning', dot: 'bg-amber-400', icon: Clock },
  cash_collected: { label: 'Cash collected', rail: 'cash', settled: true, tone: 'cash', dot: 'bg-teal-500', icon: Banknote },
  cash_pending: { label: 'Cash pending', rail: 'cash', settled: false, tone: 'orange', dot: 'bg-orange-400', icon: HandCoins },
  unpaid: { label: 'Unpaid', rail: 'none', settled: false, tone: 'danger', dot: 'bg-rose-400', icon: XCircle },
  checking: { label: 'Checking…', rail: 'none', settled: false, tone: 'neutral', dot: 'bg-line', icon: Loader2 },
}

export const payMeta = (state) => PAY_STATES[state] || PAY_STATES.unpaid

export const indexPayments = (payments) => {
  const map = new Map()
  ;(payments || []).forEach((p) => {
    if (p.id) map.set(String(p.id), p)
    if (p.orderId) map.set(String(p.orderId), p)
  })
  return map
}

/* Resolve one registration into a single payment state.
 *
 * Trust model:
 *   ONLINE money is true only when payments/{orderId} says
 *   status === 'completed' AND verified === true (written by the Razorpay
 *   webhook). `paymentOrderId` on the registration is a devotee-writable
 *   pointer and proves nothing.
 *   CASH money is true only when `cashCollected === true`, which
 *   firestore.rules lets staff write and the devotee never can.
 *   `paymentMode` is declared intent: it decides which ACTION to offer and how
 *   to label a not-yet-paid row, never whether anything is paid. */
export const resolvePayment = (reg, paymentsById, paymentsLoading) => {
  const orderId = reg?.paymentOrderId || null
  const due = toNumber(reg?.amountDue)
  const declared = String(reg?.paymentMode || '').toLowerCase() === 'cash' ? 'cash' : (orderId ? 'online' : '')
  const cashDone = reg?.cashCollected === true
  const cashAmount = Number.isFinite(Number(reg?.cashAmount)) ? Number(reg.cashAmount) : 0

  const base = {
    orderId, declared, cashDone,
    cashAmount: cashDone ? (cashAmount > 0 ? cashAmount : due) : 0,
    cashAt: reg?.cashCollectedAt || null,
    cashBy: reg?.cashCollectedBy || '',
    onlineAmount: 0,
  }

  if (orderId) {
    const p = paymentsById.get(String(orderId))
    // An order made for a specific registration only settles that one.
    const forThisReg = !p?.tripRegistrationId || p.tripRegistrationId === reg?.id
    if (p && p.status === 'completed' && p.verified === true && forThisReg) {
      const amt = Number.isFinite(Number(p.amount)) ? Number(p.amount) : 0
      return { ...base, state: 'online_paid', onlineAmount: amt > 0 ? amt : due, amount: amt > 0 ? amt : due }
    }
    // Staff may still have taken cash for a half-finished online attempt.
    if (cashDone) return { ...base, state: 'cash_collected', amount: base.cashAmount }
    if (!p && paymentsLoading) return { ...base, state: 'checking', amount: 0 }
    return { ...base, state: 'online_pending', amount: 0 }
  }

  if (cashDone) return { ...base, state: 'cash_collected', amount: base.cashAmount }
  if (declared === 'cash') return { ...base, state: 'cash_pending', amount: 0 }
  return { ...base, state: 'unpaid', amount: 0 }
}
