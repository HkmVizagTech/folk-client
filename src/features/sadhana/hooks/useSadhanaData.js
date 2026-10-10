import { useCallback, useEffect, useState } from 'react'
import { fetchSadhana } from '../lib/fetchSadhana'
import { EMPTY_DATA } from '../lib/constants'

/** Loads the member's sadhana records; `setData` lets mutations update them optimistically. */
export const useSadhanaData = (user, today) => {
  const [data, setData] = useState(EMPTY_DATA)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [indexBuilding, setIndexBuilding] = useState(false)
  const uid = user?.uid

  const load = useCallback(async () => {
    if (!uid) { setData(EMPTY_DATA); setLoading(false); return }
    try {
      setError('')
      const res = await fetchSadhana(user, today)
      setData(res.data)
      setIndexBuilding(res.indexBuilding)
    } catch (e) {
      // A failed read must not masquerade as a confident "0 rounds" state.
      console.error('Critical error fetching sadhana data:', e)
      setError(e?.message || 'Could not load your sadhana records. Check your connection and try again.')
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, today])

  useEffect(() => { setLoading(true); load() }, [load])

  const retry = useCallback(() => { setLoading(true); load() }, [load])

  return { data, setData, loading, error, indexBuilding, reload: load, retry }
}
