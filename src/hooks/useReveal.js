import { useRef } from 'react'
import { gsap, useGSAP, EASE, DURATION, prefersReducedMotion } from '../lib/motion'

/**
 * Fades + lifts the children matching `selector` into view, staggered.
 * Attach the returned ref to the section that owns them. Re-runs when `deps`
 * change (e.g. data arrives). No-op under prefers-reduced-motion.
 */
export const useReveal = ({ selector = '[data-reveal]', y = 18, stagger = 0.06, delay = 0, deps = [] } = {}) => {
  const scope = useRef(null)
  useGSAP(() => {
    if (prefersReducedMotion()) return
    const targets = gsap.utils.toArray(selector, scope.current)
    if (!targets.length) return
    gsap.fromTo(
      targets,
      { autoAlpha: 0, y },
      { autoAlpha: 1, y: 0, duration: DURATION.base, ease: EASE, stagger, delay, clearProps: 'transform,opacity,visibility' },
    )
  }, { scope, dependencies: deps })
  return scope
}
