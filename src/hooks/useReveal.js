import { useRef } from 'react'
import { useGSAP, enter, prefersReducedMotion } from '../lib/motion'

/**
 * Reveals the children matching `selector`, staggered. Attach the returned ref
 * to the section that owns them. Re-runs when `deps` change (e.g. data
 * arrives), but only touches elements not yet revealed, and later batches use
 * the soft entrance, so content already on screen never blinks.
 * No-op under prefers-reduced-motion.
 */
export const useReveal = ({ selector = '[data-reveal]', y = 18, stagger = 0.06, delay = 0, deps = [] } = {}) => {
  const scope = useRef(null)
  const first = useRef(true)
  useGSAP(() => {
    if (prefersReducedMotion() || !scope.current) return
    const targets = Array.from(scope.current.querySelectorAll(selector)).filter((el) => !el.hasAttribute('data-revealed'))
    if (!targets.length) return
    targets.forEach((el) => el.setAttribute('data-revealed', ''))
    enter(targets, { first: first.current, y, stagger, delay })
    first.current = false
  }, { scope, dependencies: deps })
  return scope
}
