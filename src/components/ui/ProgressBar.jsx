import React from 'react'
import { cn } from '../../lib/utils'

const ProgressBar = ({ value = 0, max = 100, className, tone = 'saffron' }) => {
  const pct = Math.max(0, Math.min(100, (value / (max || 1)) * 100))
  return (
    <div className={cn('h-2 w-full overflow-hidden rounded-full bg-paper-dark', className)} role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
      <div className={cn('h-full rounded-full transition-[width] duration-700 ease-out', tone === 'maroon' ? 'bg-navy' : 'bg-gradient-to-r from-saffron to-marigold')} style={{ width: `${pct}%` }} />
    </div>
  )
}

export default ProgressBar
