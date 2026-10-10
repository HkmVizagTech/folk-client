import React from 'react'
import { cn } from '../../../lib/utils'

/** Pill-style segmented control. `items`: [{ id, label, icon? }]. */
const Segmented = ({ items, value, onChange, label, className }) => (
  <div role="tablist" aria-label={label} className={cn('grid gap-1 rounded-xl bg-paper p-1', className)} style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
    {items.map(({ id, label: text, icon: Icon }) => (
      <button
        key={id}
        type="button"
        role="tab"
        aria-selected={value === id}
        onClick={() => onChange(id)}
        className={cn(
          'flex min-h-[40px] items-center justify-center gap-2 rounded-lg text-[14px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron',
          value === id ? 'bg-white text-navy shadow-sm' : 'text-ink-muted hover:text-ink',
        )}
      >
        {Icon && <Icon size={15} aria-hidden="true" />}
        {text}
      </button>
    ))}
  </div>
)

export default Segmented
