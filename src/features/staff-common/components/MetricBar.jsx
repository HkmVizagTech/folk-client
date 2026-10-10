import React from 'react'
import { ProgressBar } from '../../../components/ui'

/** Label, proportional bar and value on one aligned row. */
const MetricBar = ({ label, value, max, tone, hint }) => (
  <li className="grid grid-cols-[minmax(0,7.5rem)_1fr_auto] items-center gap-3 text-[14px] sm:grid-cols-[minmax(0,9rem)_1fr_auto]">
    <span className="truncate text-ink-soft" title={label}>{label}</span>
    <ProgressBar value={value} max={max} tone={tone} />
    <span className="min-w-[2rem] text-right font-display text-[15px] font-semibold text-ink">{hint ?? value}</span>
  </li>
)

export default MetricBar
