import React from 'react'
import { BedDouble, Building2, Plus } from 'lucide-react'
import { Badge, Button } from '../../../components/ui'
import { EmptyState } from '../../../components/common'
import { PanelCard, DataTable } from '../../staff-common/components'

// Approving/rejecting happens on the Hostels page (that's where the write rules
// are matched), so this panel surfaces what needs attention and links across.
const ResidencyPanel = ({ bookings, listings, onNavigate }) => {
  const go = () => onNavigate('hostels')
  const noListings = listings.length === 0
  const columns = [
    { key: 'devotee', header: 'Devotee', mobile: 'title', cell: (b) => <span className="font-semibold text-ink">{b.userName || 'Unknown'}</span> },
    { key: 'room', header: 'Room / bed', cell: (b) => <span className="text-ink-soft">{b.listingName || '—'}</span> },
    { key: 'dates', header: 'Stay dates', cell: (b) => <span className="whitespace-nowrap text-ink-muted">{b.checkIn} → {b.checkOut}</span> },
    { key: 'guests', header: 'Guests', cell: (b) => b.guestCount || 1 },
    { key: 'action', header: '', align: 'right', mobile: 'footer', cell: () => <Button variant="soft" size="sm" onClick={go}>Review</Button> },
  ]

  return (
    <PanelCard
      icon={Building2}
      tone="green"
      title="FOLK Residency"
      flush
      actions={<>
        <Badge tone="success">{listings.length} live</Badge>
        <Badge tone="saffron">{bookings.length} pending</Badge>
        <Button size="sm" onClick={go}><Plus size={14} aria-hidden="true" /> Upload listing</Button>
      </>}
    >
      <DataTable
        columns={columns}
        rows={bookings}
        getRowKey={(b) => b.id}
        empty={(
          <EmptyState
            icon={BedDouble}
            title={noListings ? 'No listings yet' : 'All caught up'}
            description={noListings ? 'Upload your first hostel room or bed to start taking bookings.' : 'No pending residency bookings.'}
            action={<Button variant="secondary" onClick={go}>{noListings ? 'Upload a listing' : 'Manage residency'}</Button>}
          />
        )}
      />
    </PanelCard>
  )
}

export default ResidencyPanel
