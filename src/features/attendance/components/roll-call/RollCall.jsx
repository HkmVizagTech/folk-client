import React from 'react'
import { UserCheck, Users } from 'lucide-react'
import { Badge, Card, ProgressBar, Select, Skeleton, Tabs } from '../../../../components/ui'
import { EmptyState } from '../../../../components/common'
import { Alert, Toolbar } from '../../../staff-common/components'
import { useRollCall } from '../../hooks/useRollCall'
import RollCallRow from './RollCallRow'

/** Tick the people who came to a program. */
const RollCall = ({ eventId, eventTitle }) => {
  const rc = useRollCall({ eventId, eventTitle })
  const emptyText = rc.search ? 'Nobody matches that search.' : rc.scope === 'mine' ? 'No members assigned to this guide yet.' : 'No members yet.'

  return (
    <Card data-reveal padded={false} className="mb-6">
      <Card.Header className="flex-wrap">
        <div className="min-w-0">
          <Card.Title>Roll call</Card.Title>
          <Card.Description>
            Tap a name to mark them present at <span className="font-semibold text-ink user-text">{eventTitle || 'this program'}</span>. People who scanned their QR are already ticked.
          </Card.Description>
        </div>
        <Badge tone="saffron" className="shrink-0"><UserCheck size={14} aria-hidden="true" /> {rc.presentCount} of {rc.roll.length} present</Badge>
      </Card.Header>

      <Card.Body className="space-y-4">
        <ProgressBar value={rc.presentCount} max={rc.roll.length || 1} />
        <Toolbar className="border-0 bg-transparent p-0 shadow-none sm:p-0">
          <Tabs value={rc.scope} onValueChange={rc.setScope}>
            <Tabs.List aria-label="Which members">
              <Tabs.Trigger value="mine">{rc.isAdmin ? "This guide's members" : 'My members'}</Tabs.Trigger>
              <Tabs.Trigger value="all">Everyone</Tabs.Trigger>
            </Tabs.List>
          </Tabs>
          {rc.isAdmin && rc.scope === 'mine' && (
            <Select aria-label="Guide" value={rc.guideId} onChange={(e) => rc.setGuideId(e.target.value)} className="sm:w-52">
              {rc.staff.map((s) => <option key={s.id} value={s.id}>{s.id === rc.user?.uid ? 'Me' : s.displayName}</option>)}
            </Select>
          )}
          <Toolbar.Search value={rc.search} onChange={rc.setSearch} placeholder="Search a name or number" />
        </Toolbar>

        {rc.error && <Alert onDismiss={rc.dismissError}>{rc.error}</Alert>}

        {rc.loading ? (
          <div className="grid gap-2 sm:grid-cols-2" aria-hidden="true">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-16" />)}</div>
        ) : rc.roll.length === 0 ? (
          <EmptyState icon={Users} title={emptyText} className="py-10" />
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {rc.roll.map((m) => <li key={m.id}><RollCallRow member={m} busy={!!rc.busyIds[m.id]} onToggle={() => rc.toggle(m)} /></li>)}
          </ul>
        )}
      </Card.Body>
    </Card>
  )
}

export default RollCall
