import React from 'react'
import { cn } from '../../lib/utils'

const EmptyState = ({ icon: Icon, title, description, action, className }) => (
  <div className={cn('flex flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-white/60 px-6 py-14 text-center', className)}>
    {Icon && (
      <span className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-saffron-50 text-saffron-dark">
        <Icon size={26} aria-hidden="true" />
      </span>
    )}
    <h3 className="font-display text-[18px] font-semibold text-ink">{title}</h3>
    {description && <p className="mt-1.5 max-w-sm text-[14px] text-ink-muted">{description}</p>}
    {action && <div className="mt-5">{action}</div>}
  </div>
)

export default EmptyState
