import { useCallback, useState } from 'react'

/**
 * Optimistic mutation: apply `optimistic()` immediately, run the real `commit`,
 * and `rollback()` if it throws. Returns { run, pending, error }.
 *
 *   const { run } = useOptimisticMutation()
 *   run({
 *     optimistic: () => setDone(true),
 *     commit: () => updateDoc(...),
 *     rollback: () => setDone(false),
 *   })
 */
export const useOptimisticMutation = () => {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState(null)

  const run = useCallback(async ({ optimistic, commit, rollback, onError }) => {
    setError(null)
    setPending(true)
    optimistic?.()
    try {
      return await commit()
    } catch (e) {
      rollback?.()
      setError(e)
      onError?.(e)
      return undefined
    } finally {
      setPending(false)
    }
  }, [])

  return { run, pending, error }
}
