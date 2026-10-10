import { useMemo } from 'react'
import { useFirestore } from '../../../hooks/useFirestore'
// Postgres-backed shim, NOT the real Firebase SDK: `db` is only a marker
// object now, so firebase/firestore helpers throw on it - and useFirestore
// swallows that, leaving the screen silently empty instead of erroring.
import { where } from '../../../lib/pgstore'
import { isPending, upcomingTrips as filterUpcomingTrips } from '../lib/summary'

/**
 * Every live collection the command center reads, plus the filtered slices the
 * panels need. Accommodation.jsx writes `status: 'pending'` (lowercase), so the
 * query and every comparison here is lowercase.
 * Hostels and trips are deliberately kept out of `loading`: they are newer
 * collections, so a site without any must still render rather than spin.
 */
export const useAdminDashboardData = () => {
  const requestsQuery = useMemo(() => [where('status', '==', 'pending')], [])

  const users = useFirestore('users')
  const events = useFirestore('events')
  const requests = useFirestore('accommodation_requests', requestsQuery)
  const sevas = useFirestore('sevas')
  const { data: hostelListings } = useFirestore('hostel_listings')
  const { data: hostelBookings } = useFirestore('hostel_bookings')
  const { data: trips } = useFirestore('trips')
  const { data: tripRegistrations } = useFirestore('trip_registrations')

  const today = new Date().toISOString().slice(0, 10)

  return {
    loading: users.loading || events.loading || requests.loading || sevas.loading,
    users: users.data,
    events: events.data,
    requests: requests.data,
    sevas: sevas.data,
    tripRegistrations,
    upcomingTrips: filterUpcomingTrips(trips || [], today),
    pendingTripRegs: (tripRegistrations || []).filter(isPending),
    pendingHostelBookings: (hostelBookings || []).filter(isPending),
    activeHostelListings: (hostelListings || []).filter((l) => l.active !== false),
  }
}
