export const MAX_SEATS = 20

export const isOnlineEnabled = (trip) => trip?.onlinePaymentEnabled !== false
export const isCashEnabled = (trip) => trip?.cashPaymentEnabled === true

/** Price figures for `seatsInput` travellers. */
export const computePricing = (trip, seatsInput) => {
  const price = Number(trip?.price) || 0
  // Only a real saving is shown: a stray or smaller number is ignored.
  const originalPrice = Number(trip?.originalPrice) || 0
  const advance = Number(trip?.advanceAmount) || 0
  const seats = Math.min(MAX_SEATS, Math.max(1, parseInt(seatsInput, 10) || 1))
  const total = price * seats
  const payNow = advance > 0 ? Math.min(advance * seats, total || advance * seats) : total
  return {
    price, originalPrice, hasOffer: originalPrice > price, advance, seats, total, payNow,
    balance: Math.max(0, total - payNow),
  }
}

/**
 * Which payment routes this trip offers right now. Online also needs a real
 * Razorpay key and something to charge; cash is opt-in and, like online, is
 * pointless for a 0 "by seva" yatra, which becomes a plain pending request.
 */
export const computePaymentModes = (trip, { razorpayReady, total, payMethod }) => {
  const onlineAvailable = isOnlineEnabled(trip) && razorpayReady && total > 0
  const cashAvailable = isCashEnabled(trip) && total > 0
  const bothAvailable = onlineAvailable && cashAvailable
  const noPaymentAvailable = !onlineAvailable && !cashAvailable
  const effectiveMethod = bothAvailable ? payMethod : (cashAvailable ? 'cash' : 'online')
  // 'pay' (Razorpay now) | 'cash' (at the office) | 'later' (pending request)
  const submitMode = noPaymentAvailable ? 'later' : (effectiveMethod === 'cash' ? 'cash' : 'pay')
  return { onlineAvailable, cashAvailable, bothAvailable, noPaymentAvailable, effectiveMethod, submitMode }
}

/** Label for the primary booking button, shared by the rail and the mobile bar. */
export const bookLabel = ({ noPaymentAvailable, cashAvailable, onlineAvailable }, fallback) => {
  if (noPaymentAvailable) return 'Request a seat'
  if (cashAvailable && !onlineAvailable) return 'Register & pay cash'
  return fallback
}
