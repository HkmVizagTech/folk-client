import { Filter, Search, X } from 'lucide-react'
import { Input, Select, Tabs } from '../../../components/ui'

const TABS = [
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'completed', label: 'Completed' },
]

/** Upcoming / completed switch, plus search and destination filter once the list is long. */
const TripsToolbar = ({ tab, onTab, counts, showFilters, search, onSearch, destination, onDestination, destinations }) => (
  <div data-reveal className="mb-6 space-y-4">
    <Tabs value={tab} onValueChange={onTab}>
      <Tabs.List className="w-full sm:w-fit">
        {TABS.map((t) => (
          <Tabs.Trigger key={t.id} value={t.id} className="h-11 flex-1 gap-2 px-5 sm:flex-none">
            {t.label}
            <span className="ml-2 rounded-md bg-paper-dark px-1.5 py-0.5 text-[12px] text-ink-muted">{counts[t.id]}</span>
          </Tabs.Trigger>
        ))}
      </Tabs.List>
    </Tabs>

    {showFilters && (
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative min-w-0 flex-1">
          <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" />
          <Input
            type="text" value={search} onChange={(e) => onSearch(e.target.value)}
            placeholder="Search trips, destinations, holy places…" aria-label="Search trips"
            className="h-12 pl-10 pr-12"
          />
          {search && (
            <button type="button" onClick={() => onSearch('')} aria-label="Clear search" className="absolute right-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-xl text-ink-muted hover:bg-paper">
              <X size={16} />
            </button>
          )}
        </div>
        <div className="relative shrink-0 sm:w-64">
          <Filter size={16} className="pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-ink-muted" />
          <Select value={destination} onChange={(e) => onDestination(e.target.value)} aria-label="Filter by destination" className="h-12 pl-10">
            <option value="all">All destinations</option>
            {destinations.map((d) => <option key={d} value={d}>{d}</option>)}
          </Select>
        </div>
      </div>
    )}
  </div>
)

export default TripsToolbar
