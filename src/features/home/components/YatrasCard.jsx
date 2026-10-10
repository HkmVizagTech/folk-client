import React from 'react'
import { Compass } from 'lucide-react'
import { Badge, Button, Skeleton } from '../../../components/ui'
import { plural } from '../lib/format'
import Panel from './Panel'

const YatrasCard = ({ trips, loading, onBrowse }) => (
  <Panel title="My yatras" action="Browse yatras" onAction={onBrowse} className="lg:col-span-3" hover={false}>
    {loading ? <Skeleton className="h-14" /> : trips.length ? (
      <ul className="divide-y divide-line">
        {trips.slice(0, 4).map((t) => {
          const confirmed = String(t.status || '').toLowerCase() === 'confirmed'
          return (
            <li key={t.id} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
              <span className="flex min-w-0 items-center gap-3">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-navy-50 text-navy"><Compass size={18} aria-hidden="true" /></span>
                <span className="truncate font-semibold">{t.tripTitle || 'Yatra'}</span>
              </span>
              <Badge tone={confirmed ? 'success' : 'neutral'} className="shrink-0">{plural(t.seats || 1, 'seat')} · {t.status || 'pending'}</Badge>
            </li>
          )
        })}
      </ul>
    ) : (
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[15px] text-ink-muted">Vrindavan, Tirupati, Jagannath Puri… travel to the holy dhamas with the FOLK crew.</p>
        <Button variant="outline" onClick={onBrowse}><Compass size={17} aria-hidden="true" /> Explore yatras</Button>
      </div>
    )}
  </Panel>
)

export default YatrasCard
