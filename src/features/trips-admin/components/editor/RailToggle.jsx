import React from 'react'
import Switch from '../../../../components/ui/Switch'
import { cn } from '../../../../lib/utils'

/** Payment-rail toggle: big target, explicit on/off wording, and what it means for the devotee. */
const RailToggle = ({ on, onToggle, icon: Icon, title, onCopy, offCopy }) => (
  <div className={cn('rounded-2xl border-2 p-4 transition-colors user-text-box', on ? 'border-emerald-200 bg-emerald-50/70' : 'border-line bg-paper')}>
    <div className="flex items-start gap-3">
      <span className={cn('inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', on ? 'bg-emerald-500 text-white' : 'border border-line bg-white text-ink-muted')}>
        <Icon size={18} aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className={cn('text-[14px] font-semibold', on ? 'text-emerald-700' : 'text-ink-muted')}>{title}</p>
          <Switch checked={on} onCheckedChange={onToggle} aria-label={`${title}: ${on ? 'enabled' : 'disabled'}`} />
        </div>
        <p className="mt-1 text-[13px] leading-relaxed text-ink-muted user-text">{on ? onCopy : offCopy}</p>
      </div>
    </div>
  </div>
)

export default RailToggle
