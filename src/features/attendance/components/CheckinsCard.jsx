import React from 'react'
import { Clock, Search } from 'lucide-react'
import { Avatar, Badge, Card } from '../../../components/ui'
import { EmptyState } from '../../../components/common'
import { DataTable, Toolbar } from '../../staff-common/components'

const columns = [
  {
    key: 'name', header: 'Devotee', mobile: 'title',
    cell: (r) => <span className="flex min-w-0 items-center gap-3"><Avatar name={r.name} size="sm" /><span className="truncate font-semibold text-ink">{r.name}</span></span>,
  },
  { key: 'session', header: 'Session', cell: (r) => <span className="text-ink-soft">{r.session}</span> },
  { key: 'time', header: 'Time', cell: (r) => <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-ink-muted"><Clock size={14} className="text-marigold-dark" aria-hidden="true" />{r.time || 'N/A'}</span> },
  { key: 'status', header: 'Status', cell: (r) => <Badge tone={r.status === 'On-time' ? 'success' : 'danger'} size="sm">{r.status}</Badge> },
]

const CheckinsCard = ({ rows, loading, search, onSearch }) => {
  const term = search.trim()
  return (
    <Card data-reveal padded={false} className="overflow-hidden">
      <Card.Header className="flex-wrap items-center pb-4">
        <Card.Title>Recent check-ins</Card.Title>
        <Toolbar.Search value={search} onChange={onSearch} placeholder="Search check-ins" className="w-full sm:w-64 sm:flex-none" />
      </Card.Header>
      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        getRowKey={(r) => r.id}
        empty={<EmptyState icon={Search} title={term ? `No check-ins found for “${term}”` : 'No check-ins recorded yet'} className="py-12" />}
      />
    </Card>
  )
}

export default CheckinsCard
