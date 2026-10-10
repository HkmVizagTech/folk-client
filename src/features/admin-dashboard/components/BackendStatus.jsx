import React from 'react'
import { Badge } from '../../../components/ui'
import { cn } from '../../../lib/utils'

const TONE = { online: 'success', offline: 'danger', error: 'danger', checking: 'neutral' }

const BackendStatus = ({ status }) => (
  <Badge tone={TONE[status] || 'neutral'} className="capitalize" aria-live="polite">
    <span className={cn('h-1.5 w-1.5 rounded-full bg-current', status === 'online' && 'animate-pulse')} aria-hidden="true" />
    Backend {status}
  </Badge>
)

export default BackendStatus
