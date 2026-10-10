import { useMemo, useState } from 'react'
import { where } from '../../../lib/pgstore'
import { useAuth } from '../../../hooks/useAuth'
import { useFirestore } from '../../../hooks/useFirestore'
import { sortByDate } from '../lib/events'

export const useEventsData = () => {
  const { user } = useAuth()
  const { data: rawEvents, loading } = useFirestore('events')
  const regQuery = useMemo(() => [where('userId', '==', user?.uid || 'guest')], [user?.uid])
  const { data: registrations } = useFirestore('registrations', regQuery)
  const [category, setCategory] = useState('All')

  const events = useMemo(() => sortByDate(rawEvents || []), [rawEvents])
  const filtered = useMemo(
    () => (category === 'All' ? events : events.filter((e) => e.category === category)),
    [events, category],
  )

  return { user, events, filtered, registrations, loading: loading && events.length === 0, category, setCategory }
}
