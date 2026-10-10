import React from 'react'
import { Bus, MapPin, Plus } from 'lucide-react'
import { Badge, Button } from '../../../components/ui'
import { EmptyState } from '../../../components/common'
import { PanelCard, DataTable } from '../../staff-common/components'

// Full management (create, edit, registrations, CSV manifest) lives on the Trips admin page.
const TripsPanel = ({ trips, pendingCount, onNavigate }) => {
  const go = () => onNavigate('trips-admin')
  const columns = [
    {
      key: 'trip', header: 'Trip', mobile: 'title',
      cell: (t) => (
        <div className="min-w-0">
          <p className="truncate font-semibold text-ink">{t.title}</p>
          <p className="mt-0.5 flex items-center gap-1 text-[12px] font-normal text-ink-muted"><MapPin size={12} aria-hidden="true" />{t.location || '—'}</p>
        </div>
      ),
    },
    { key: 'dates', header: 'Dates', cell: (t) => <span className="whitespace-nowrap text-ink-muted">{t.startDate || '—'} → {t.endDate || '—'}</span> },
    {
      key: 'registered', header: 'Registered',
      cell: (t) => <span className="font-semibold text-ink">{t.registered}{t.capacity > 0 && <span className="font-normal text-ink-muted"> / {t.capacity}</span>}</span>,
    },
    { key: 'pending', header: 'To confirm', cell: (t) => (t.pending > 0 ? <Badge tone="warning" size="sm">{t.pending}</Badge> : <span className="text-ink-muted">—</span>) },
    { key: 'action', header: '', align: 'right', mobile: 'footer', cell: () => <Button variant="soft" size="sm" onClick={go}>Manage</Button> },
  ]

  return (
    <PanelCard
      icon={Bus}
      tone="maroon"
      title="Trips & yatras"
      flush
      actions={<>
        <Badge tone="maroon">{trips.length} upcoming</Badge>
        <Badge tone="saffron">{pendingCount} to confirm</Badge>
        <Button size="sm" onClick={go}><Plus size={14} aria-hidden="true" /> New trip</Button>
      </>}
    >
      <DataTable
        columns={columns}
        rows={trips.slice(0, 5)}
        getRowKey={(t) => t.id}
        empty={<EmptyState icon={Bus} title="No upcoming trips" description="Create a yatra to start taking registrations." action={<Button variant="secondary" onClick={go}>Create a trip</Button>} />}
      />
    </PanelCard>
  )
}

export default TripsPanel
