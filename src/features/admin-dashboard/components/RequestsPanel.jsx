import React from 'react'
import { Home, ShieldCheck } from 'lucide-react'
import { Badge, Button } from '../../../components/ui'
import { EmptyState } from '../../../components/common'
import { PanelCard, DataTable } from '../../staff-common/components'

const RequestsPanel = ({ requests, onNavigate }) => {
  const go = () => onNavigate('accommodation')
  const columns = [
    { key: 'devotee', header: 'Devotee', mobile: 'title', cell: (r) => <span className="font-semibold text-ink">{r.userName || 'Unknown'}</span> },
    { key: 'type', header: 'Type', cell: (r) => <span className="text-ink-soft">{r.type || '—'}</span> },
    { key: 'dates', header: 'Dates', cell: (r) => <span className="whitespace-nowrap text-ink-muted">{r.arrivalDate} → {r.departureDate}</span> },
    { key: 'status', header: 'Status', cell: (r) => <Badge tone="warning" size="sm" className="capitalize">{r.status}</Badge> },
    { key: 'action', header: '', align: 'right', mobile: 'footer', cell: () => <Button variant="soft" size="sm" onClick={go}>Manage</Button> },
  ]

  return (
    <PanelCard
      icon={Home}
      title="Accommodation requests"
      flush
      actions={<Badge tone="saffron">{requests.length} pending</Badge>}
    >
      <DataTable
        columns={columns}
        rows={requests}
        getRowKey={(r) => r.id}
        empty={<EmptyState icon={ShieldCheck} title="All caught up" description="No pending accommodation requests." action={<Button variant="secondary" onClick={go}>View all requests</Button>} />}
      />
    </PanelCard>
  )
}

export default RequestsPanel
