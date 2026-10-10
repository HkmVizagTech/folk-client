import { useMemo } from 'react'
import { where } from '../../../lib/pgstore'
import { useAuth } from '../../../hooks/useAuth'
import { useFirestore } from '../../../hooks/useFirestore'
import { todayIST, toDate } from '../../../lib/dates'
import { STAGES, stageOf, ROUNDS_TARGET } from '../../../content/journey'
import { verseOfTheDay } from '../../../content/wisdom'

const SIX_HOURS = 6 * 3600 * 1000

/** Everything the member dashboard shows, derived from the live collections. */
export const useHomeData = () => {
  const { user } = useAuth()
  const uid = user?.uid || '__none__'
  const today = todayIST()
  const verse = useMemo(() => verseOfTheDay(), [])

  const logQ = useMemo(() => [where('userId', '==', uid), where('date', '==', today)], [uid, today])
  const { data: todayLogs, loading: logLoading } = useFirestore('sadhana_logs', logQ)
  const log = todayLogs[0] || null

  const { data: events, loading: eventsLoading } = useFirestore('events')
  const mineQ = useMemo(() => [where('userId', '==', uid)], [uid])
  const { data: myRegs } = useFirestore('registrations', mineQ)
  const { data: myTrips, loading: tripsLoading } = useFirestore('trip_registrations', mineQ)

  const next = useMemo(() => {
    const from = Date.now() - SIX_HOURS
    return (events || [])
      .map((e) => ({ ...e, _d: toDate(e.dateISO || e.date) }))
      .filter((e) => e._d && e._d.getTime() >= from)
      .sort((a, b) => a._d - b._d)[0] || null
  }, [events])

  const going = !!next && myRegs.some((r) => r.eventId === next.id && r.status === 'Attending')
  const activeTrips = useMemo(() => myTrips.filter((t) => String(t.status || '').toLowerCase() !== 'cancelled'), [myTrips])

  const rounds = Number(log?.roundsCompleted) || 0
  const target = Number(log?.target) || Number(user?.sadhanaTarget) || ROUNDS_TARGET
  const stage = stageOf(user)

  return {
    user, verse, log, logLoading, next, going, eventsLoading, activeTrips, tripsLoading,
    rounds, target, done: rounds >= target, streak: user?.streak || 0,
    stage, stageIdx: Math.max(0, STAGES.findIndex((s) => s.id === stage)),
  }
}
