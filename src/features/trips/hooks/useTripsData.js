import { useMemo } from 'react'
import { where } from '../../../lib/pgstore'
import { useFirestore } from '../../../hooks/useFirestore'
import { useAuth } from '../../../hooks/useAuth'
import { isCompletedTrip, todayISO } from '../lib/format'
import { normaliseLocations } from '../lib/locations'

/** Trips, per-trip seat counts and the upcoming/completed split. */
export const useTripsData = () => {
  const { user } = useAuth()
  const isStaff = user?.role === 'admin' || user?.role === 'folks_head'

  const tripsQuery = useMemo(() => [], [])
  const { data: trips, loading } = useFirestore('trips', tripsQuery)

  // Staff read every registration (exact seat counts); everyone else only their own.
  const registrationsQuery = useMemo(() => {
    if (isStaff) return []
    return [where('userId', '==', user?.uid || '__none__')]
  }, [isStaff, user?.uid])
  // A null collection turns the subscription off for public visitors.
  const { data: registrations } = useFirestore(user?.uid ? 'trip_registrations' : null, registrationsQuery)

  const today = useMemo(() => todayISO(), [])

  const visibleTrips = useMemo(
    () => (trips || []).filter((t) => isStaff || (t.status || '').toLowerCase() !== 'draft'),
    [trips, isStaff],
  )

  const seatsTakenByTrip = useMemo(() => {
    const map = {}
    ;(registrations || []).forEach((r) => {
      const s = (r.status || '').toLowerCase()
      if (s !== 'pending' && s !== 'confirmed') return
      map[r.tripId] = (map[r.tripId] || 0) + (parseInt(r.seats, 10) || 1)
    })
    return map
  }, [registrations])

  const { upcoming, completed } = useMemo(() => {
    const up = []
    const done = []
    visibleTrips.forEach((t) => (isCompletedTrip(t, today) ? done : up).push(t))
    up.sort((a, b) => (a.startDate || '9999-99-99').localeCompare(b.startDate || '9999-99-99'))
    done.sort((a, b) => (b.endDate || '').localeCompare(a.endDate || ''))
    return { upcoming: up, completed: done }
  }, [visibleTrips, today])

  const destinations = useMemo(
    () => Array.from(new Set(visibleTrips.map((t) => t.location).filter(Boolean))).sort((a, b) => a.localeCompare(b)),
    [visibleTrips],
  )

  const placeNames = useMemo(() => {
    const set = new Set()
    visibleTrips.forEach((t) => normaliseLocations(t.locations).forEach((l) => l.name && set.add(l.name)))
    return Array.from(set)
  }, [visibleTrips])

  const seatsLeftFor = (trip) => {
    const capacity = parseInt(trip.capacity, 10)
    if (!capacity || capacity <= 0) return null
    // trip.seatsTaken is maintained by the server for everyone; count locally only when it is absent.
    const taken = typeof trip.seatsTaken === 'number' ? trip.seatsTaken : (seatsTakenByTrip[trip.id] || 0)
    return Math.max(0, capacity - taken)
  }

  return {
    isStaff, loading: loading && (trips || []).length === 0, total: visibleTrips.length,
    upcoming, completed, destinations, placeNames, seatsLeftFor,
  }
}
