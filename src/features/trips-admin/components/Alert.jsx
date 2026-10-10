import React from 'react'
import { AlertTriangle } from 'lucide-react'
import { cn } from '../../../lib/utils'

const TONES = {
  danger: 'bg-red-50 border-red-200 text-red-700',
  warning: 'bg-amber-50 border-amber-200 text-amber-800',
  muted: 'bg-paper border-line text-ink-muted',
}

const Alert = ({ tone = 'danger', title, children, className }) => (
  <div role={tone === 'danger' ? 'alert' : undefined} className={cn('flex items-start gap-3 rounded-xl border p-3.5 text-[14px] user-text-box', TONES[tone], className)}>
    <AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
    <div className="min-w-0 flex-1 user-text">
      {title && <p className="mb-0.5 font-semibold">{title}</p>}
      {children}
    </div>
  </div>
)

export default Alert
