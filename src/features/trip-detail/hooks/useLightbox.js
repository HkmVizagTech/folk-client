import { useCallback, useEffect, useState } from 'react'

/** Index-based lightbox state with Escape / arrow-key control. */
export const useLightbox = (count) => {
  const [index, setIndex] = useState(null)
  const close = useCallback(() => setIndex(null), [])
  const step = useCallback(
    (delta) => setIndex((cur) => (cur === null || count === 0 ? null : (cur + delta + count) % count)),
    [count],
  )

  useEffect(() => {
    if (index === null) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') close()
      else if (e.key === 'ArrowRight') step(1)
      else if (e.key === 'ArrowLeft') step(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [index, close, step])

  return { index, open: setIndex, close, step }
}
