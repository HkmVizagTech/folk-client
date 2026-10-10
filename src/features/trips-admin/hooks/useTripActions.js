import { useCallback, useEffect, useMemo, useState } from 'react'
import { doc, updateDoc, serverTimestamp } from '../../../lib/pgstore'
import { db } from '../../../lib/firebase'
import { useOptimisticMutation } from '../../../hooks/useOptimistic'

const sortTrips = (trips) => trips.slice().sort((a, b) => {
  const av = a.startDate || ''
  const bv = b.startDate || ''
  if (av === bv) return (a.title || '').localeCompare(b.title || '')
  return bv.localeCompare(av)
})

/**
 * Status and registration-open flips on a trip. Both are safe to apply
 * optimistically: the patch overlays the live data and is rolled back if the
 * write fails, and is dropped once the snapshot catches up.
 */
export const useTripActions = (rawTrips) => {
  const { run } = useOptimisticMutation()
  const [patches, setPatches] = useState({})
  const [busyId, setBusyId] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    setPatches((prev) => {
      let changed = false
      const next = {}
      Object.entries(prev).forEach(([id, patch]) => {
        const trip = (rawTrips || []).find((t) => t.id === id)
        const remaining = Object.fromEntries(Object.entries(patch).filter(([k, v]) => !trip || trip[k] !== v))
        if (Object.keys(remaining).length) next[id] = remaining
        if (Object.keys(remaining).length !== Object.keys(patch).length) changed = true
      })
      return changed ? next : prev
    })
  }, [rawTrips])

  const trips = useMemo(
    () => sortTrips((rawTrips || []).map((t) => (patches[t.id] ? { ...t, ...patches[t.id] } : t))),
    [rawTrips, patches],
  )

  const mutate = useCallback(async (trip, patch, fallback) => {
    setBusyId(trip.id)
    setError('')
    const keys = Object.keys(patch)
    await run({
      optimistic: () => setPatches((prev) => ({ ...prev, [trip.id]: { ...prev[trip.id], ...patch } })),
      commit: () => updateDoc(doc(db, 'trips', trip.id), { ...patch, updatedAt: serverTimestamp() }),
      rollback: () => setPatches((prev) => {
        const rest = { ...prev[trip.id] }
        keys.forEach((k) => delete rest[k])
        return { ...prev, [trip.id]: rest }
      }),
      onError: (err) => {
        console.error(fallback, err)
        setError(err?.message || fallback)
      },
    })
    setBusyId(null)
  }, [run])

  const setStatus = useCallback((trip, status) => mutate(trip, { status }, 'Failed to update the trip status'), [mutate])
  const toggleRegistration = useCallback(
    (trip) => mutate(trip, { registrationOpen: !trip.registrationOpen }, 'Failed to update registrations'),
    [mutate],
  )

  return { trips, busyId, error, setStatus, toggleRegistration }
}
