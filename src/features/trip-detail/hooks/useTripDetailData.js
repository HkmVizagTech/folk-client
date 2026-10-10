import { useMemo } from 'react'
import { where } from '../../../lib/pgstore'
import { useFirestore } from '../../../hooks/useFirestore'
import { useAuth } from '../../../hooks/useAuth'

/**
 * Trip, registrations and payment truth for one trip page.
 * `cancelledId` overlays an optimistic cancel until the live feed catches up.
 */
export const useTripDetailData = (slug, cancelledId) => {
  const { user } = useAuth()
  const isStaff = user?.role === 'admin' || user?.role === 'folks_head'

  const tripQuery = useMemo(() => [where('slug', '==', slug || '__none__')], [slug])
  const { data: tripMatches, loading: tripLoading } = useFirestore('trips', tripQuery)
  const allTripsQuery = useMemo(() => [], [])
  const { data: allTrips } = useFirestore('trips', allTripsQuery)
  const trip = (tripMatches || [])[0] || null

  // Staff read every registration for this trip; a devotee only their own. A
  // logged-out visitor reads neither (null collection = subscription off), so
  // the public page never makes a request the server must refuse.
  const registrationsQuery = useMemo(() => {
    if (isStaff && trip?.id) return [where('tripId', '==', trip.id)]
    return [where('userId', '==', user?.uid || '__none__')]
  }, [isStaff, trip?.id, user?.uid])
  const { data: registrations } = useFirestore(user?.uid ? 'trip_registrations' : null, registrationsQuery)

  // Payment truth lives in `payments`, written only by the server webhook.
  const paymentsQuery = useMemo(() => [where('userId', '==', user?.uid || '__none__')], [user?.uid])
  const { data: payments } = useFirestore(user?.uid ? 'payments' : null, paymentsQuery)

  const tripRegistrations = useMemo(
    () => (registrations || []).filter((r) => trip?.id && r.tripId === trip.id),
    [registrations, trip?.id],
  )

  // The server keeps trip.seatsTaken (every pending|confirmed seat, whoever booked it); older
  // servers do not send it, so fall back to counting the registrations this user can read.
  const countedSeats = useMemo(
    () => tripRegistrations
      .filter((r) => ['pending', 'confirmed'].includes((r.status || '').toLowerCase()))
      .reduce((sum, r) => sum + (parseInt(r.seats, 10) || 1), 0),
    [tripRegistrations],
  )
  const seatsTaken = typeof trip?.seatsTaken === 'number' ? trip.seatsTaken : countedSeats

  const capacity = parseInt(trip?.capacity, 10) || 0
  const seatsLeft = capacity > 0 ? Math.max(0, capacity - seatsTaken) : null

  /** The signed-in user's live registration; a cancelled one never blocks re-registering. */
  const myRegistration = useMemo(() => {
    if (!user?.uid) return null
    const mine = tripRegistrations.filter((r) => r.userId === user.uid)
    const reg = mine.find((r) => (r.status || '').toLowerCase() !== 'cancelled') || mine[0] || null
    return reg && reg.id === cancelledId ? { ...reg, status: 'cancelled' } : reg
  }, [tripRegistrations, user?.uid, cancelledId])

  // Money arrived only when the webhook marked the order completed AND verified.
  const myPayment = useMemo(() => {
    const orderId = myRegistration?.paymentOrderId
    if (!orderId) return null
    return (payments || []).find((p) => p.id === orderId || p.orderId === orderId || p.razorpayOrderId === orderId) || null
  }, [payments, myRegistration?.paymentOrderId])

  const isPaid = !!myPayment && String(myPayment.status || '').toLowerCase() === 'completed' && myPayment.verified === true
  // Cash truth is `cashCollected`, which only staff can write.
  const isCashRegistration = String(myRegistration?.paymentMode || '').toLowerCase() === 'cash'
  const isCashCollected = myRegistration?.cashCollected === true
  const isSettled = isCashRegistration ? isCashCollected : isPaid

  return {
    user, isStaff, trip, tripLoading, allTrips,
    capacity, seatsTaken, seatsLeft,
    myRegistration, myPayment, isPaid, isCashRegistration, isCashCollected, isSettled,
  }
}
