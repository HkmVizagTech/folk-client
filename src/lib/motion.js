import gsap from 'gsap'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(useGSAP)

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

// One easing/duration vocabulary so every screen moves the same way.
export const EASE = 'power3.out'
export const DURATION = { fast: 0.25, base: 0.5, slow: 0.8 }

export { gsap, useGSAP }

/**
 * Entrance for a batch of elements. The first batch on a screen gets the full
 * fade-and-lift. Anything arriving later (data replacing a skeleton, a filter
 * changing the list) only settles in softly, so content never drops to
 * invisible and blinks back.
 */
export const enter = (targets, { first = true, y = 18, stagger = 0.06, delay = 0 } = {}) => {
  if (!targets.length) return
  const to = { autoAlpha: 1, y: 0, ease: EASE, clearProps: 'transform,opacity,visibility' }
  if (first) {
    gsap.fromTo(targets, { autoAlpha: 0, y }, { ...to, duration: DURATION.base, stagger, delay })
  } else {
    gsap.fromTo(targets, { autoAlpha: 0.7, y: Math.min(y, 8) }, { ...to, duration: DURATION.fast + 0.05, stagger: Math.min(stagger, 0.03) })
  }
}
