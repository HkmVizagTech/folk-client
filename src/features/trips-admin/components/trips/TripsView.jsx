import React from 'react'
import { Bus, Calendar, Plus, ToggleRight, Users } from 'lucide-react'
import StatCard from '../../../../components/common/StatCard'
import EmptyState from '../../../../components/common/EmptyState'
import Button from '../../../../components/ui/Button'
import Alert from '../Alert'
import TripCard from './TripCard'

const EMPTY_STATS = { count: 0, seats: 0 }

/** Presentational: summary tiles plus the trip list. */
const TripsView = ({ trips, registrationCount, statsByTrip, busyId, error, isAdmin, onCreate, ...actions }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      <StatCard label="Total trips" value={trips.length} icon={Bus} />
      <StatCard label="Upcoming" value={trips.filter((t) => t.status === 'upcoming').length} icon={Calendar} tone="green" />
      <StatCard label="Open to register" value={trips.filter((t) => t.registrationOpen).length} icon={ToggleRight} tone="gold" />
      <StatCard label="Registrations" value={registrationCount} icon={Users} tone="maroon" />
    </div>

    {error && <Alert>{error}</Alert>}

    {trips.length === 0 ? (
      <div data-reveal>
        <EmptyState
          icon={Bus}
          title="No trips yet"
          description="Create the first yatra and publish it for devotees to register."
          action={<Button onClick={onCreate}><Plus size={18} /> New trip</Button>}
        />
      </div>
    ) : (
      <div className="space-y-4">
        {trips.map((trip) => (
          <div key={trip.id} data-reveal>
            <TripCard
              trip={trip}
              stats={statsByTrip.get(trip.id) || EMPTY_STATS}
              busy={busyId === trip.id}
              isAdmin={isAdmin}
              {...actions}
            />
          </div>
        ))}
      </div>
    )}
  </div>
)

export default TripsView
