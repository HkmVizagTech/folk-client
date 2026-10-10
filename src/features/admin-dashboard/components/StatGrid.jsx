import React from 'react'
import { StatCard } from '../../../components/common'
import { Users, Calendar, ClipboardCheck, Heart, Building2, Bus } from 'lucide-react'
import { joinedThisWeek, plural } from '../lib/summary'

const StatGrid = ({ data, onNavigate }) => {
  const { users, events, requests, sevas, pendingHostelBookings, activeHostelListings, pendingTripRegs, upcomingTrips } = data
  const volunteers = sevas.reduce((acc, s) => acc + (s.countRegistered || 0), 0)

  const stats = [
    { label: 'Total devotees', value: users.length, sub: `+${joinedThisWeek(users)} this week`, icon: Users, tone: 'maroon', tab: 'devotees' },
    { label: 'Upcoming events', value: events.length, sub: events[0] ? `Next: ${events[0].title}` : 'No events scheduled', icon: Calendar, tone: 'gold', tab: 'events' },
    { label: 'Pending requests', value: requests.length, sub: 'Action required', icon: ClipboardCheck, tone: 'saffron', tab: 'accommodation' },
    { label: 'Seva volunteers', value: volunteers, sub: `${plural(sevas.length, 'active seva')}`, icon: Heart, tone: 'saffron', tab: 'seva' },
    { label: 'Residency bookings', value: pendingHostelBookings.length, sub: `${plural(activeHostelListings.length, 'listing')} live`, icon: Building2, tone: 'green', tab: 'hostels' },
    { label: 'Trip registrations', value: pendingTripRegs.length, sub: `${plural(upcomingTrips.length, 'upcoming yatra')}`, icon: Bus, tone: 'maroon', tab: 'trips-admin' },
  ]

  return (
    <div className="mb-8 grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 lg:grid-cols-3">
      {stats.map(({ tab, ...s }) => (
        <StatCard key={s.label} {...s} onClick={() => onNavigate(tab)} className="[&_p:last-child]:truncate" />
      ))}
    </div>
  )
}

export default StatGrid
