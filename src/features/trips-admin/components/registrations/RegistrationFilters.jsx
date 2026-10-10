import React from 'react'
import { Banknote, CreditCard, Download, Layers, Search } from 'lucide-react'
import Card from '../../../../components/ui/Card'
import Button from '../../../../components/ui/Button'
import { Input, Select } from '../../../../components/ui/Field'
import { cn } from '../../../../lib/utils'
import { REG_STATUSES } from '../../lib/constants'
import { capitalize } from '../../lib/format'

const METHODS = [
  { key: 'all', label: 'All', icon: Layers },
  { key: 'online', label: 'Online', icon: CreditCard },
  { key: 'cash', label: 'Cash', icon: Banknote },
]

const RegistrationFilters = ({ filters, trips, total, onExport }) => (
  <Card className="space-y-3">
    <div className="relative">
      <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted/60" size={16} aria-hidden="true" />
      <Input
        value={filters.search} onChange={(e) => filters.setSearch(e.target.value)}
        placeholder="Search name, phone or email…" aria-label="Search registrations" className="pl-10"
      />
    </div>

    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <Select value={filters.trip} onChange={(e) => filters.setTrip(e.target.value)} aria-label="Filter by trip" className="min-w-0">
        <option value="all">All trips</option>
        {trips.map((t) => <option key={t.id} value={t.id}>{t.title || t.slug}</option>)}
      </Select>
      <Select value={filters.status} onChange={(e) => filters.setStatus(e.target.value)} aria-label="Filter by status" className="min-w-0">
        <option value="all">All statuses</option>
        {REG_STATUSES.map((s) => <option key={s} value={s}>{capitalize(s)}</option>)}
      </Select>
    </div>

    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div role="group" aria-label="Filter by payment method" className="flex min-w-0 flex-1 items-center gap-1 rounded-xl bg-paper-dark p-1">
        {METHODS.map(({ key, label, icon: Icon }) => {
          const active = filters.method === key
          return (
            <button
              key={key} type="button" aria-pressed={active} onClick={() => filters.setMethod(key)}
              className={cn(
                'flex min-h-[40px] min-w-0 flex-1 items-center justify-center gap-1.5 rounded-lg px-2 text-[14px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron',
                active ? 'bg-white text-navy shadow-soft' : 'text-ink-muted hover:text-ink',
              )}
            >
              <Icon size={14} className="shrink-0" aria-hidden="true" /> <span className="truncate">{label}</span>
            </button>
          )
        })}
      </div>
      <Button variant="secondary" onClick={onExport} disabled={filters.filtered.length === 0} className="shrink-0"><Download size={16} /> Export CSV</Button>
    </div>

    {filters.active && (
      <div className="flex items-center justify-between gap-3">
        <p className="text-[13px] text-ink-muted">Showing {filters.filtered.length} of {total}</p>
        <Button variant="ghost" size="sm" onClick={filters.clear}>Clear filters</Button>
      </div>
    )}
  </Card>
)

export default RegistrationFilters
