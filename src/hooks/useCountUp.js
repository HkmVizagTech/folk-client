import { useEffect, useRef, useState } from 'react'
import { gsap, prefersReducedMotion } from '../lib/motion'

/** Animates a number from its previous value to `value`. */
export const useCountUp = (value, { duration = 0.9 } = {}) => {
  const target = Number(value) || 0
  const [display, setDisplay] = useState(prefersReducedMotion() ? target : 0)
  const from = useRef(0)
  useEffect(() => {
    if (prefersReducedMotion()) { setDisplay(target); return undefined }
    const state = { n: from.current }
    const tween = gsap.to(state, {
      n: target, duration, ease: 'power2.out',
      onUpdate: () => { from.current = state.n; setDisplay(Math.round(state.n)) },
    })
    return () => tween.kill()
  }, [target, duration])
  return display
}
