import { useRef } from 'react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { gsap, useGSAP, EASE, prefersReducedMotion } from '../../../lib/motion';

gsap.registerPlugin(ScrollTrigger);

/**
 * Hero entrance timeline. Children tagged `data-hero="<name>"` enter in the
 * order below; `art` keeps a slow float and the mandala a slow turn.
 */
export const useHeroTimeline = () => {
  const scope = useRef(null);
  useGSAP(() => {
    if (prefersReducedMotion()) return;
    const q = (name) => gsap.utils.toArray(`[data-hero="${name}"]`, scope.current);
    const tl = gsap.timeline({ defaults: { ease: EASE } });
    tl.from(q('kicker'), { autoAlpha: 0, y: 16, duration: 0.5 })
      .from(q('line'), { autoAlpha: 0, yPercent: 40, duration: 0.7, stagger: 0.12 }, '-=0.25')
      .from(q('copy'), { autoAlpha: 0, y: 18, duration: 0.55 }, '-=0.35')
      .from(q('cta'), { autoAlpha: 0, y: 18, duration: 0.5, stagger: 0.08, clearProps: 'all' }, '-=0.3')
      .from(q('art'), { autoAlpha: 0, scale: 0.92, y: 24, duration: 1, ease: 'power2.out' }, 0.2)
      .from(q('float'), { autoAlpha: 0, scale: 0.8, duration: 0.5, stagger: 0.12, ease: 'back.out(1.6)' }, '-=0.4')
      .from(q('stat'), { autoAlpha: 0, y: 20, duration: 0.5, stagger: 0.08 }, '-=0.5');

    gsap.to(q('art'), { y: -10, duration: 3.2, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 1.2 });
    gsap.to(q('mandala'), { rotation: 360, duration: 140, ease: 'none', repeat: -1 });
    gsap.to(q('float'), { y: -8, duration: 2.6, ease: 'sine.inOut', yoyo: true, repeat: -1, stagger: { each: 0.5, from: 'random' } });
  }, { scope });
  return scope;
};

/**
 * Scroll-triggered reveal for everything marked `data-reveal` under the
 * returned ref (plus a soft parallax on `data-parallax`). Elements in view
 * animate together, staggered; re-runs when `deps` change so late-arriving
 * data (events) is picked up too.
 */
export const useScrollReveal = (deps = []) => {
  const scope = useRef(null);
  useGSAP(() => {
    if (prefersReducedMotion()) return undefined;
    gsap.utils.toArray('[data-parallax]', scope.current).forEach((el) => {
      gsap.fromTo(el, { yPercent: -6 }, {
        yPercent: 6, ease: 'none',
        scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true },
      });
    });
    const targets = gsap.utils.toArray('[data-reveal]', scope.current);
    if (!targets.length) return undefined;
    gsap.set(targets, { autoAlpha: 0, y: 28 });
    ScrollTrigger.batch(targets, {
      start: 'top 90%',
      once: true,
      onEnter: (batch) => gsap.to(batch, {
        autoAlpha: 1, y: 0, duration: 0.7, ease: EASE, stagger: 0.09, overwrite: true,
        clearProps: 'transform,opacity,visibility',
      }),
    });
    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener('load', refresh);
    return () => window.removeEventListener('load', refresh);
  }, { scope, dependencies: deps, revertOnUpdate: true });
  return scope;
};
