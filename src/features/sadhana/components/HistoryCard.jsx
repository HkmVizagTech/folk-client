import React from 'react'
import { Badge, Card } from '../../../components/ui'
import { EmptyState } from '../../../components/common'

/** One recent-activity list (attendance, prasadam). */
const HistoryCard = ({ title, icon: Icon, tone, badge, rows, emptyText }) => (
  <Card data-reveal>
    <div className="flex items-center gap-3">
      <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-saffron-50 text-saffron-dark"><Icon size={22} aria-hidden="true" /></span>
      <h3 className="font-display text-[19px] font-semibold text-ink">{title}</h3>
    </div>
    {rows.length ? (
      <ul className="mt-5 divide-y divide-line">
        {rows.map((r) => (
          <li key={r.key} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold text-ink-muted">{r.title}</p>
              <p className="text-[15px] font-semibold text-ink">{r.date}</p>
            </div>
            <Badge tone={tone} className="shrink-0">{badge}</Badge>
          </li>
        ))}
      </ul>
    ) : (
      <EmptyState icon={Icon} title="No records yet" description={emptyText} className="mt-5 border-0 bg-paper py-8" />
    )}
  </Card>
)

export default HistoryCard
