import React from 'react'
import { Plus } from 'lucide-react'
import { Page, PageHeader, Section } from '../../components/common'
import { Badge, Button } from '../../components/ui'
import { useAuth } from '../../hooks/useAuth'
import { useHostelListings } from './hooks/useHostelListings'
import { useHostelBookings } from './hooks/useHostelBookings'
import { useHostelDialogs } from './hooks/useHostelDialogs'
import ListingGrid from './components/ListingGrid'
import MyBookings from './components/MyBookings'
import ManageBookings from './components/ManageBookings'
import BookingModal from './components/BookingModal'
import ListingModal from './components/ListingModal'

const STAFF_ROLES = ['admin', 'folks_head']

const HostelsPage = () => {
  const { user } = useAuth()
  const isStaff = STAFF_ROLES.includes(user?.role)
  const listings = useHostelListings(isStaff)
  const bookings = useHostelBookings(user, isStaff)
  const dialogs = useHostelDialogs({ onBook: bookings.create, onSaveListing: listings.save })

  const staff = isStaff ? { onEdit: dialogs.listing.openEdit, onToggle: listings.toggleActive } : undefined

  return (
    <Page revealKey={listings.loading}>
      <PageHeader
        kicker="Youth residency"
        title="FOLK hostels"
        description="Ongoing rooms and beds for youth devotees. Browse and request your stay."
        actions={isStaff && <Button onClick={dialogs.listing.openCreate}><Plus size={18} aria-hidden="true" /> New listing</Button>}
      />

      <Section title="Available stays">
        <ListingGrid listings={listings.listings} loading={listings.loading} canBook={!!user} onBook={dialogs.booking.open} staff={staff} />
      </Section>

      <Section title="Your bookings">
        <MyBookings bookings={bookings.mine} onCancel={bookings.cancel} />
      </Section>

      {isStaff && (
        <Section
          title="Manage bookings"
          action={bookings.pending.length > 0 && <Badge tone="saffron" className="bg-saffron text-white">{bookings.pending.length} pending</Badge>}
        >
          <ManageBookings bookings={bookings.bookings} loading={bookings.loading} onStatus={bookings.setStatus} />
        </Section>
      )}

      <BookingModal dialog={dialogs.booking} submitting={dialogs.submitting} />
      <ListingModal dialog={dialogs.listing} submitting={dialogs.submitting} />
    </Page>
  )
}

export default HostelsPage
