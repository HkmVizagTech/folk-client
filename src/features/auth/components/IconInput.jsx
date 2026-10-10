import React from 'react'
import { Input } from '../../../components/ui'
import { cn } from '../../../lib/utils'

/** Labelled input with a leading icon and an invalid state. */
const IconInput = ({ icon: Icon, label, invalid, className, id, ...props }) => (
  <div>
    <label htmlFor={id} className="mb-1.5 block text-[14px] font-semibold text-ink">{label}</label>
    <div className="relative">
      <Icon size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" aria-hidden="true" />
      <Input
        id={id}
        aria-invalid={invalid || undefined}
        className={cn('pl-11', invalid && 'border-red-400 focus:border-red-500 focus:ring-red-500/15', className)}
        {...props}
      />
    </div>
  </div>
)

export default IconInput
