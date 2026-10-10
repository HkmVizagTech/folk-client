import React, { useRef } from 'react';
import { gsap, useGSAP, prefersReducedMotion } from '../../lib/motion';

/**
 * Wraps one screen. Keyed by the active tab so the previous screen unmounts
 * completely, and the new one fades in before its first paint (layout effect),
 * so there is never a frame of the old screen or of an un-animated new one.
 */
const PageTransition = ({ children }) => {
  const ref = useRef(null);
  useGSAP(() => {
    window.scrollTo({ top: 0 });
    if (prefersReducedMotion()) return;
    gsap.fromTo(ref.current, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.35, ease: 'power2.out', clearProps: 'transform,opacity,visibility' });
  }, { scope: ref });
  return <div ref={ref}>{children}</div>;
};

export default PageTransition;
