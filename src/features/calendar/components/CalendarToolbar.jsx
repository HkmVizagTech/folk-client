import React from 'react'
import { Tabs } from '../../../components/ui'
import { TONE } from '../lib/audienceTone'

/** Staff-only: "All programs / Only mine" switch and the colour legend. */
const CalendarToolbar = ({ onlyMine, onChange }) => (
  <div data-reveal className="mb-5 flex flex-wrap items-center gap-x-6 gap-y-3">
    <Tabs value={onlyMine ? 'mine' : 'all'} onValueChange={(v) => onChange(v === 'mine')}>
      <Tabs.List aria-label="Which programs">
        <Tabs.Trigger value="all">All programs</Tabs.Trigger>
        <Tabs.Trigger value="mine">Only mine</Tabs.Trigger>
      </Tabs.List>
    </Tabs>
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px] text-ink-muted">
      {Object.entries(TONE).map(([id, t]) => (
        <li key={id} className="inline-flex items-center gap-1.5"><span className={`h-2.5 w-2.5 rounded-full ${t.dot}`} aria-hidden="true" /> {t.label}</li>
      ))}
    </ul>
  </div>
)

export default CalendarToolbar
