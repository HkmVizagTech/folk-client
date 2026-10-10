import React from 'react'
import { Download, Users } from 'lucide-react'
import { Button } from '../../../components/ui'
import { PanelCard, MetricBar } from '../../staff-common/components'
import { STAGES, stageOf } from '../../../content/journey'
import { stagePalette } from '../../staff-common/lib/chartTheme'
import { roleBreakdown } from '../lib/summary'

// stageOf() folds text labels, an explicit stage and legacy numeric levels onto
// the one journey, the way Reports does.
const StageStrip = ({ users }) => {
  const total = users.length || 1
  return (
    <div>
      <h4 className="mb-3 text-[12px] font-semibold uppercase tracking-label text-ink-muted">Devotees by journey stage</h4>
      <div className="flex h-2.5 gap-1 overflow-hidden rounded-full">
        {STAGES.map((s, i) => {
          const count = users.filter((u) => stageOf(u) === s.id).length
          return (
            <span
              key={s.id}
              title={`${s.label}: ${count} devotees`}
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${(count / total) * 100}%`, minWidth: count > 0 ? 6 : 0, backgroundColor: stagePalette[i] }}
            />
          )
        })}
      </div>
      <div className="mt-2 flex justify-between text-[11px] font-semibold uppercase tracking-label text-ink-muted">
        <span>{STAGES[0].label}</span>
        <span>{STAGES[STAGES.length - 1].label}</span>
      </div>
    </div>
  )
}

const CommunityPanel = ({ users, onExport }) => (
  <PanelCard icon={Users} tone="maroon" title="Devotee reports">
    <ul className="space-y-4">
      {roleBreakdown(users).map((r) => <MetricBar key={r.label} label={r.label} value={r.count} max={users.length || 1} tone={r.tone} />)}
    </ul>
    <div className="mt-6 border-t border-line/70 pt-6"><StageStrip users={users} /></div>
    <div className="mt-6 rounded-2xl border border-marigold/30 bg-marigold-light/20 p-4">
      <p className="text-[12px] font-semibold uppercase tracking-label text-marigold-dark">Total active community</p>
      <p className="mt-1 font-display text-[28px] font-semibold leading-none text-ink">{users.length.toLocaleString('en-IN')}</p>
    </div>
    <Button variant="secondary" className="mt-4 w-full" onClick={onExport}><Download size={16} aria-hidden="true" /> Generate growth audit</Button>
  </PanelCard>
)

export default CommunityPanel
