import { useRef } from 'react'
import { gsap, useGSAP, EASE, prefersReducedMotion } from '../../../lib/motion'

/** Plays a staggered entrance timeline over every `[data-hero]` inside the returned ref. */
export const useHeroIntro = () => {
  const scope = useRef(null)
  useGSAP(() => {
    if (prefersReducedMotion() || !scope.current) return
    const items = gsap.utils.toArray('[data-hero]', scope.current)
    if (!items.length) return
    gsap.timeline({ defaults: { ease: EASE } })
      .fromTo(items, { autoAlpha: 0, y: 24 }, {
        autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.09, clearProps: 'transform,opacity,visibility',
      })
  }, { scope })
  return scope
}
