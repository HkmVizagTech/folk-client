import { useCallback, useEffect, useMemo } from 'react'
import { auth, db } from '../../../lib/firebase'
// Postgres-backed shim, NOT the real Firebase SDK (see useFirestore).
import { collection, addDoc, updateDoc, doc, serverTimestamp, where, orderBy } from '../../../lib/pgstore'
import { useFirestore } from '../../../hooks/useFirestore'
import { useOptimisticMutation } from '../../../hooks/useOptimistic'
import { useOptimisticPatches } from './useOptimisticPatches'
import { normalize } from '../lib/hostels'

export const useHostelBookings = (user, isStaff) => {
  // Staff read every booking; everyone else only their own.
  const query = useMemo(() => (
    isStaff
      ? [orderBy('createdAt', 'desc')]
      : [where('userId', '==', user?.uid || 'guest'), orderBy('createdAt', 'desc')]
  ), [isStaff, user?.uid])

  const { data, loading } = useFirestore('hostel_bookings', query)
  const { patches, apply, clear, prune } = useOptimisticPatches()
  const { run } = useOptimisticMutation()

  useEffect(() => {
    const byId = new Map((data || []).map((b) => [b.id, b.status]))
    prune((id, patch) => byId.get(id) !== patch.status)
  }, [data, prune])

  const bookings = useMemo(
    () => (data || []).map((b) => (patches[b.id] ? { ...b, ...patches[b.id] } : b)),
    [data, patches],
  )
  const mine = useMemo(() => bookings.filter((b) => b.userId === user?.uid), [bookings, user?.uid])
  const pending = useMemo(() => bookings.filter((b) => normalize(b.status) === 'pending'), [bookings])

  const changeStatus = useCallback((booking, status, failure) => run({
    optimistic: () => apply(booking.id, { status }),
    rollback: () => clear(booking.id),
    // Deliberately leaves staffNotes alone: blanking it hid the staff note from
    // the member every time a booking was approved or rejected.
    commit: () => updateDoc(doc(db, 'hostel_bookings', booking.id), { status, updatedAt: serverTimestamp() }),
    onError: (error) => {
      console.error(failure, error)
      alert(`${failure}: ${error.message}`)
    },
  }), [run, apply, clear])

  const cancel = useCallback((booking) => changeStatus(booking, 'cancelled', 'Failed to cancel booking'), [changeStatus])
  const setStatus = useCallback((booking, status) => changeStatus(booking, status, 'Failed to update booking'), [changeStatus])

  /** Creates a pending request. Resolves true on success. */
  const create = useCallback(async (listing, form) => {
    if (!user) return false
    // A stay that ends before it starts is never what the member meant.
    if (form.checkOut < form.checkIn) {
      alert('Check-out must be on or after the check-in date.')
      return false
    }
    try {
      const memberName = user.name || user.fullName || auth.currentUser?.displayName || 'Devotee'
      await addDoc(collection(db, 'hostel_bookings'), {
        listingId: listing.id,
        listingName: listing.name,
        userId: user.uid,
        userName: memberName,
        checkIn: form.checkIn,
        checkOut: form.checkOut,
        guestCount: parseInt(form.guestCount, 10) || 1,
        notes: form.notes || '',
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      // Best effort: the booking is saved, so a failed announcement must not
      // be reported as a failed booking (members resubmitted duplicates).
      try {
        await addDoc(collection(db, 'notifications'), {
          type: 'new_hostel_booking',
          title: 'New Hostel Booking Request',
          message: `${memberName} requested "${listing.name}" from ${form.checkIn} to ${form.checkOut}.`,
          link: '/hostels',
          createdAt: serverTimestamp(),
          createdBy: auth.currentUser?.uid || 'system',
        })
      } catch (notifyError) {
        console.error('Booking saved, but staff could not be notified:', notifyError)
      }
      return true
    } catch (error) {
      console.error('Error submitting hostel booking:', error)
      alert('Failed to submit booking request: ' + error.message)
      return false
    }
  }, [user])

  return { bookings, mine, pending, loading: loading && bookings.length === 0, create, cancel, setStatus }
}
