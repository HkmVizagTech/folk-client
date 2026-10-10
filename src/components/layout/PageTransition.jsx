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
    // Barely-there fade: the screen's own reveals do the real entrance, so a
    // stronger fade here would double up and read as a blank flash.
    gsap.fromTo(ref.current, { autoAlpha: 0.85 }, { autoAlpha: 1, duration: 0.2, ease: 'power1.out', clearProps: 'opacity,visibility' });
  }, { scope: ref });
  return <div ref={ref}>{children}</div>;
};

export default PageTransition;
