import { useState } from 'react'
import { useOptimisticMutation } from '../../../hooks/useOptimistic'
import { createTargetTx, logRoundsTx } from '../lib/sadhanaTx'
import { MIN_TARGET, MAX_TARGET, MAX_ROUNDS } from '../lib/constants'
import { useFlash } from './useFlash'

const withToday = (data, today, patch) => ({ ...data, logs: data.logs.map((l) => (l.date === today ? { ...l, ...patch } : l)) })

/**
 * Set-target and log-rounds mutations. Both apply to the screen first and are
 * rolled back to the previous snapshot if the transaction fails.
 */
export const useSadhanaActions = ({ user, today, data, setData, reload }) => {
  const { run, pending } = useOptimisticMutation()
  const [actionError, setActionError] = useState('')
  const [saved, flashSaved] = useFlash(2500)
  const [milestone, flashMilestone, clearMilestone] = useFlash(6000)

  const guard = (fn) => async (...args) => {
    setActionError('')
    return fn(...args)
  }

  const setTarget = guard(async (target) => {
    if (target < MIN_TARGET || target > MAX_TARGET) { setActionError(`Target must be between ${MIN_TARGET} and ${MAX_TARGET} rounds.`); return }
    const snapshot = data
    await run({
      optimistic: () => setData((d) => ({ ...d, logs: [...d.logs, { userId: user.uid, date: today, target, roundsCompleted: 0, progressPercentage: 0, score: 0, status: 'locked' }] })),
      commit: async () => { await createTargetTx(user, today, target); flashSaved(); await reload() },
      rollback: () => setData(snapshot),
      onError: (e) => setActionError(e.message),
    })
  })

  const logRounds = guard(async (rounds) => {
    if (!Number.isInteger(rounds) || rounds < 0 || rounds > MAX_ROUNDS) { setActionError('Please enter a valid number of rounds.'); return }
    const log = data.logs.find((l) => l.date === today)
    if (!log) { setActionError('Please set your target first!'); return }
    const snapshot = data
    const completes = rounds >= log.target && !log.completed
    await run({
      optimistic: () => setData((d) => {
        const next = withToday(d, today, { roundsCompleted: rounds, completed: rounds >= log.target, progressPercentage: Math.min(100, Math.round((rounds / log.target) * 100)) })
        return completes ? { ...next, profile: { ...next.profile, streak: (next.profile.streak || 0) + 1 } } : next
      }),
      commit: async () => {
        await logRoundsTx(user, today, rounds)
        if (completes) flashMilestone(true); else flashSaved()
        await reload()
      },
      rollback: () => setData(snapshot),
      onError: (e) => setActionError(e.message),
    })
  })

  return { setTarget, logRounds, pending, actionError, dismissError: () => setActionError(''), saved: !!saved, milestone: !!milestone, closeMilestone: clearMilestone }
}
