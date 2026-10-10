import { useCallback, useEffect, useMemo, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { auth, db } from '../../../lib/firebase'
// Postgres-backed shim, NOT the real Firebase SDK (see useFirestore).
import { serverTimestamp, setDoc, doc, runTransaction } from '../../../lib/pgstore'
import { useOptimisticMutation } from '../../../hooks/useOptimistic'
import { useOptimisticPatches } from './useOptimisticPatches'
import { ATTENDING, CANCELLED, COUNTER_FIELD, expectedCount } from '../lib/events'

/**
 * RSVP state for the signed-in member. The answer shows instantly (optimistic)
 * and rolls back if the write fails; the head-count moves with it.
 */
export const useRsvp = ({ user, registrations }) => {
  const { patches, apply, clear, prune } = useOptimisticPatches()
  const { run } = useOptimisticMutation()
  const [busy, setBusy] = useState({})

  const serverReg = useCallback((eventId) => registrations?.find((r) => r.eventId === eventId), [registrations])

  // Once the live feed shows the answer, the local override has done its job.
  useEffect(() => {
    prune((eventId, patch) => serverReg(eventId)?.status !== patch.status)
  }, [serverReg, prune])

  const registrationFor = useCallback((eventId) => {
    const base = serverReg(eventId)
    return patches[eventId] ? { ...base, ...patches[eventId] } : base
  }, [serverReg, patches])

  const attendingFor = useCallback((event) => {
    const base = expectedCount(event)
    const patch = patches[event.id]
    if (!patch) return base
    const was = serverReg(event.id)?.status
    return Math.max(0, base + (patch.status === ATTENDING ? 1 : 0) - (was === ATTENDING ? 1 : 0))
  }, [patches, serverReg])

  const respond = useCallback(async (event, nextStatus) => {
    if (!user) {
      alert('Please login to RSVP')
      return
    }
    // A second tap before the first write lands would read the same stale
    // answer and move the same counter a second time.
    if (busy[event.id]) return

    const prevStatus = serverReg(event.id)?.status || null
    if (prevStatus === nextStatus) return
    // Nothing to withdraw from: no counter to give back, and no reason to
    // leave a "Cancelled" row behind for someone who never answered.
    if (nextStatus === CANCELLED && !COUNTER_FIELD[prevStatus]) return

    const token = nextStatus === ATTENDING ? uuidv4().slice(0, 8).toUpperCase() : null
    const registrationRef = doc(db, 'registrations', `${event.id}_${user.uid}`)
    const eventRef = doc(db, 'events', event.id)
    const leaving = COUNTER_FIELD[prevStatus]
    const joining = COUNTER_FIELD[nextStatus]
    const registration = {
      eventId: event.id,
      eventTitle: event.title,
      userId: user.uid,
      // The profile field is `name`; `fullName` never existed.
      userName: user.name || user.fullName || auth.currentUser?.displayName || 'Devotee',
      // Cleared on anything but "attending" so a withdrawn member's old token
      // can no longer be scanned through at the gate.
      token,
      status: nextStatus,
      updatedAt: serverTimestamp(),
    }

    setBusy((b) => ({ ...b, [event.id]: true }))
    await run({
      optimistic: () => apply(event.id, { status: nextStatus, token }),
      rollback: () => clear(event.id),
      onError: (error) => {
        console.error('Registration error:', error)
        alert('Your RSVP could not be saved: ' + error.message)
      },
      commit: async () => {
        // Mock events live only in this page, so there is no document to count on.
        if (event.id.startsWith('mock')) {
          await setDoc(registrationRef, registration, { merge: true })
          return
        }
        // The answer and the counters it moves go up in one commit; the server
        // only accepts a move of one per counter.
        await runTransaction(db, async (transaction) => {
          const counts = (await transaction.get(eventRef)).data() || {}
          const patch = {}
          // Absolute values rather than increment(): events created before the
          // counters existed read as 0, and a blind -1 would be refused.
          if (leaving) patch[leaving] = Math.max(0, (Number(counts[leaving]) || 0) - 1)
          if (joining) patch[joining] = (Number(counts[joining]) || 0) + 1
          transaction.set(registrationRef, registration, { merge: true })
          transaction.update(eventRef, patch)
        })
      },
    })
    setBusy((b) => ({ ...b, [event.id]: false }))
  }, [user, busy, serverReg, run, apply, clear])

  const goingCount = useMemo(
    () => (registrations || []).filter((r) => registrationFor(r.eventId)?.status === ATTENDING).length,
    [registrations, registrationFor],
  )

  return { registrationFor, attendingFor, respond, busy, goingCount }
}
