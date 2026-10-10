import React, { useState } from 'react'
import { CalendarDays, CalendarX, Plus, Ticket, Users } from 'lucide-react'
import { Page, PageHeader, StatCard, EmptyState } from '../../components/common'
import { Button } from '../../components/ui'
import EventModal from '../../components/events/EventModal'
import { useEventsData } from './hooks/useEventsData'
import { useRsvp } from './hooks/useRsvp'
import CategoryTabs from './components/CategoryTabs'
import EventShowcase from './components/EventShowcase'
import EventsSkeleton from './components/EventsSkeleton'

const CAN_CREATE = ['admin', 'folks_head']

const EventsPage = () => {
  const { user, events, filtered, registrations, loading, category, setCategory } = useEventsData()
  const rsvp = useRsvp({ user, registrations })
  const [creating, setCreating] = useState(false)

  const expected = events.reduce((sum, e) => sum + rsvp.attendingFor(e), 0)

  return (
    <Page revealKey={loading}>
      <PageHeader
        kicker="Spiritual gatherings"
        title="Community events"
        description="Retreats, kirtans, yatras and weekly programs. Reserve your place and carry your token to the gate."
        actions={CAN_CREATE.includes(user?.role) && (
          <Button onClick={() => setCreating(true)}><Plus size={18} aria-hidden="true" /> Create event</Button>
        )}
      />

      {loading ? <EventsSkeleton /> : (
        <>
          <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
            <StatCard label="Events" value={events.length} icon={CalendarDays} tone="saffron" />
            <StatCard label="You are going" value={rsvp.goingCount} icon={Ticket} tone="green" />
            <StatCard label="Devotees expected" value={expected} icon={Users} tone="gold" className="col-span-2 lg:col-span-1" />
          </div>

          <div data-reveal className="mb-6">
            <CategoryTabs value={category} onChange={setCategory} />
          </div>

          {filtered.length === 0 ? (
            <div data-reveal>
              <EmptyState icon={CalendarX} title="No gatherings found" description="Try another category, or check back soon for new programs." />
            </div>
          ) : (
            <EventShowcase events={filtered} featured={category === 'All'} rsvp={rsvp} resetKey={category} />
          )}
        </>
      )}

      <EventModal open={creating} onClose={() => setCreating(false)} />
    </Page>
  )
}

export default EventsPage
