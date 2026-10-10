import { useRef } from 'react'
import { useGSAP, enter, prefersReducedMotion } from '../../../lib/motion'

/** Eases the direct children of the returned ref in when `key` changes: full entrance first, soft after. */
export const useStagger = (key, { y = 20, stagger = 0.06 } = {}) => {
  const scope = useRef(null)
  const first = useRef(true)
  useGSAP(() => {
    if (prefersReducedMotion() || !scope.current) return
    const items = Array.from(scope.current.children)
    if (!items.length) return
    enter(items, { first: first.current, y, stagger: Math.min(stagger, 0.4 / items.length) })
    first.current = false
  }, { scope, dependencies: [key] })
  return scope
}
