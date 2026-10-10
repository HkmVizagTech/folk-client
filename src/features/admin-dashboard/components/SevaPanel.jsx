import React from 'react'
import { Calendar, Heart, Users } from 'lucide-react'
import { Badge, Button, ProgressBar } from '../../../components/ui'
import { EmptyState } from '../../../components/common'
import { PanelCard } from '../../staff-common/components'

const SevaRow = ({ seva }) => (
  <li className="rounded-2xl border border-line/70 bg-paper/50 p-4">
    <div className="flex items-start justify-between gap-3">
      <h3 className="min-w-0 font-semibold text-ink user-text">{seva.title}</h3>
      {seva.sevaType && <Badge tone="saffron" size="sm">{seva.sevaType}</Badge>}
    </div>
    <p className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-ink-muted">
      <span className="inline-flex items-center gap-1.5"><Calendar size={14} aria-hidden="true" />{seva.date}</span>
      <span className="inline-flex items-center gap-1.5"><Users size={14} aria-hidden="true" />{seva.countRegistered || 0} / {seva.maxVolunteers} joined</span>
    </p>
    <ProgressBar className="mt-3 h-1.5" value={seva.countRegistered || 0} max={seva.maxVolunteers || 1} />
  </li>
)

const SevaPanel = ({ sevas, onManage }) => (
  <PanelCard
    icon={Heart}
    title="Seva opportunities"
    actions={<Button variant="ghost" size="sm" onClick={onManage}>Manage all</Button>}
  >
    {sevas.length > 0 ? (
      <ul className="space-y-3">{sevas.slice(0, 5).map((s) => <SevaRow key={s.id} seva={s} />)}</ul>
    ) : (
      <EmptyState icon={Heart} title="No active sevas" description="Create a seva to monitor volunteer sign-ups." />
    )}
  </PanelCard>
)

export default SevaPanel
