import React from 'react'
import { Card } from '../../../components/ui'
import { DataTable } from '../../staff-common/components'
import { cn } from '../../../lib/utils'

const columns = [
  { key: 'name', header: 'Guide', mobile: 'title', cell: (g) => <span className="font-semibold text-ink">{g.name}</span> },
  { key: 'members', header: 'Members', align: 'right', cell: (g) => g.members },
  { key: 'quiet', header: 'Quiet 7+ days', align: 'right', cell: (g) => <span className={cn(g.quiet > 0 && 'font-semibold text-red-700')}>{g.quiet}</span> },
  { key: 'followups', header: 'Follow-ups', align: 'right', cell: (g) => g.followups },
]

const GuidesTable = ({ guides }) => (
  <Card data-reveal padded={false} className="overflow-hidden">
    <Card.Header className="pb-4"><Card.Title>FOLK guides</Card.Title></Card.Header>
    <DataTable columns={columns} rows={guides} getRowKey={(g) => g.id} />
  </Card>
)

export default GuidesTable
