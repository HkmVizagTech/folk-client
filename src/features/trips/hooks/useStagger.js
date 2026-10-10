import { useRef } from 'react'
import { gsap, useGSAP, EASE, DURATION, prefersReducedMotion } from '../../../lib/motion'

/** Staggers the direct children of the returned ref in whenever `key` changes. */
export const useStagger = (key, { y = 20, stagger = 0.06 } = {}) => {
  const scope = useRef(null)
  useGSAP(() => {
    if (prefersReducedMotion() || !scope.current) return
    const items = Array.from(scope.current.children)
    if (!items.length) return
    gsap.fromTo(items, { autoAlpha: 0, y }, {
      autoAlpha: 1, y: 0, duration: DURATION.base, ease: EASE, stagger: Math.min(stagger, 0.4 / items.length), clearProps: 'transform,opacity,visibility',
    })
  }, { scope, dependencies: [key] })
  return scope
}
