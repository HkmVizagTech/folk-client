import gsap from 'gsap'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(useGSAP)

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

// One easing/duration vocabulary so every screen moves the same way.
export const EASE = 'power3.out'
export const DURATION = { fast: 0.25, base: 0.5, slow: 0.8 }

export { gsap, useGSAP }
