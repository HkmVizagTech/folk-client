import { useMemo, useState } from 'react'
import { filterRegistrations, summarizeRegistrations } from '../lib/registrations'

export const useRegistrationFilters = (registrations, resolve) => {
  const [trip, setTrip] = useState('all')
  const [status, setStatus] = useState('all')
  const [method, setMethod] = useState('all')
  const [search, setSearch] = useState('')

  const filtered = useMemo(
    () => filterRegistrations(registrations, { trip, status, method, search }, resolve),
    [registrations, trip, status, method, search, resolve],
  )
  const summary = useMemo(() => summarizeRegistrations(filtered, resolve), [filtered, resolve])

  const active = trip !== 'all' || status !== 'all' || method !== 'all' || !!search
  const clear = () => { setTrip('all'); setStatus('all'); setMethod('all'); setSearch('') }

  return { trip, setTrip, status, setStatus, method, setMethod, search, setSearch, filtered, summary, active, clear }
}
