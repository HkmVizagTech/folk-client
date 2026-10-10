import { useCallback, useEffect, useRef, useState } from 'react'

export const useToast = (ms = 3000) => {
  const [toast, setToast] = useState(null)
  const timer = useRef(null)
  const show = useCallback((message, type = 'success') => {
    clearTimeout(timer.current)
    setToast({ message, type })
    timer.current = setTimeout(() => setToast(null), ms)
  }, [ms])
  useEffect(() => () => clearTimeout(timer.current), [])
  return { toast, show }
}
