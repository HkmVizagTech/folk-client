import { useCallback, useEffect, useRef, useState } from 'react'

/** A value that clears itself after `ms`: for toasts and celebrations. */
export const useFlash = (ms = 3000) => {
  const [value, setValue] = useState(null)
  const timer = useRef(null)
  const flash = useCallback((v = true) => {
    clearTimeout(timer.current)
    setValue(v)
    timer.current = setTimeout(() => setValue(null), ms)
  }, [ms])
  const clear = useCallback(() => { clearTimeout(timer.current); setValue(null) }, [])
  useEffect(() => () => clearTimeout(timer.current), [])
  return [value, flash, clear]
}
