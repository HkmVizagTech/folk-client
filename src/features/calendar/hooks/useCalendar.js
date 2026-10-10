import { useMemo, useState } from 'react'
import { useFirestore } from '../../../hooks/useFirestore'
import { dateKeyIST, todayIST } from '../../../lib/dates'
import { buildCells, cursorOf, groupByDay, shiftMonth, upcomingOwnedBy } from '../lib/monthGrid'

/** Calendar state: events, visible month, selected day, and the guide's "only mine" filter. */
export const useCalendar = (user, isStaff) => {
  const { data: events, loading } = useFirestore('events')
  const todayKey = todayIST()
  const [cursor, setCursor] = useState(() => cursorOf(todayKey))
  const [selected, setSelected] = useState(todayKey)
  const [onlyMine, setOnlyMine] = useState(false)

  // The server already hides events this person isn't meant to see; this is only the "show what I run" filter.
  const visible = useMemo(() => (onlyMine && user?.uid ? events.filter((e) => e.ownerId === user.uid) : events), [events, onlyMine, user?.uid])
  const byDay = useMemo(() => groupByDay(visible), [visible])
  const cells = useMemo(() => buildCells(cursor), [cursor])
  const upcomingMine = useMemo(() => (isStaff && user?.uid ? upcomingOwnedBy(events, user.uid) : []), [events, isStaff, user?.uid])

  const move = (delta) => setCursor((c) => shiftMonth(c, delta))
  const goToday = () => { setCursor(cursorOf(todayKey)); setSelected(todayKey) }
  const focusEvent = (e) => { const k = dateKeyIST(e._d); setSelected(k); setCursor(cursorOf(k)) }

  return { events, loading, cursor, selected, setSelected, onlyMine, setOnlyMine, byDay, cells, upcomingMine, todayKey, move, goToday, focusEvent }
}
