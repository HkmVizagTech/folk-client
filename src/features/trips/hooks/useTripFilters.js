import { useMemo, useState } from 'react'
import { normaliseLocations } from '../lib/locations'

const FILTER_THRESHOLD = 6

/** Tab, search and destination filter over the upcoming/completed lists. */
export const useTripFilters = ({ upcoming, completed, total }) => {
  const [tab, setTab] = useState('upcoming')
  const [search, setSearch] = useState('')
  const [destination, setDestination] = useState('all')

  const showFilters = total > FILTER_THRESHOLD
  const activeList = tab === 'upcoming' ? upcoming : completed

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return activeList.filter((t) => {
      if (showFilters && destination !== 'all' && t.location !== destination) return false
      if (!q) return true
      // Place names are searchable too: "Govardhan" finds the Vraja yatra.
      const places = normaliseLocations(t.locations).map((l) => l.name)
      return [t.title, t.subtitle, t.location, t.durationLabel, ...places]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    })
  }, [activeList, search, destination, showFilters])

  const isFiltering = !!search.trim() || (showFilters && destination !== 'all')
  const clear = () => { setSearch(''); setDestination('all') }

  return { tab, setTab, search, setSearch, destination, setDestination, showFilters, filtered, isFiltering, clear }
}
