import React from 'react'
import { Search } from 'lucide-react'
import { Input } from '../../../components/ui'
import { cn } from '../../../lib/utils'

/**
 * Compound filter bar:
 *   <Toolbar><Toolbar.Search …/><Toolbar.Group>…selects/buttons…</Toolbar.Group></Toolbar>
 */
const Toolbar = ({ className, ...p }) => (
  <div className={cn('flex flex-col gap-3 rounded-2xl border border-line/80 bg-white p-3 shadow-card sm:flex-row sm:items-center sm:p-4', className)} {...p} />
)

Toolbar.Search = ({ value, onChange, placeholder = 'Search', label, className }) => (
  <div className={cn('relative min-w-0 flex-1', className)}>
    <Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" aria-hidden="true" />
    <Input type="search" aria-label={label || placeholder} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="pl-10" />
  </div>
)

Toolbar.Search.displayName = 'Toolbar.Search'

Toolbar.Group = ({ className, ...p }) => <div className={cn('flex flex-wrap items-center gap-2', className)} {...p} />

Toolbar.Group.displayName = 'Toolbar.Group'

export default Toolbar
