import { useEffect, useState } from 'react'
import { callApi } from '../../../lib/api'

/** Pings the API once: 'checking' | 'online' | 'error' | 'offline'. */
export const useBackendStatus = () => {
  const [status, setStatus] = useState('checking')
  useEffect(() => {
    let alive = true
    callApi('ping')
      .then(({ message }) => alive && setStatus(message === 'pong' ? 'online' : 'error'))
      .catch((err) => {
        console.error('Backend ping failed:', err)
        if (alive) setStatus('offline')
      })
    return () => { alive = false }
  }, [])
  return status
}
