import React from 'react'
import { ProgressBar } from '../../../components/ui'
import { cn } from '../../../lib/utils'

const SessionProgress = ({ done, total, className }) => (
  <div className={className}>
    <ProgressBar value={done} max={total} />
    <p className={cn('mt-1.5 text-[13px] text-ink-muted')}>{done} of {total} sessions</p>
  </div>
)

export default SessionProgress
