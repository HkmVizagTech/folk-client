import { useEffect, useMemo, useRef, useState } from 'react';
import { useFirestore } from '../../../hooks/useFirestore';
import { gsap, useGSAP, prefersReducedMotion } from '../../../lib/motion';
import { cn } from '../../../lib/utils';
import { buildPosterSlides } from '../lib/posterSlides';
import Mandala from './Mandala';
import PosterInfo from './PosterInfo';
import PosterStage from './PosterStage';

const ROTATE_MS = 6000;

/**
 * What FOLK is doing next. Every yatra and festival has a poster, so the
 * posters are the story: nearest one centre stage, turning by itself, with a
 * countdown. Renders nothing when there is nothing upcoming.
 */
const PosterHero = ({ onLoginClick }) => {
  const { data: trips } = useFirestore('trips');
  const { data: events } = useFirestore('events');
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const infoRef = useRef(null);

  const slides = useMemo(() => buildPosterSlides(trips, events), [trips, events]);

  useEffect(() => { setIndex(0); }, [slides.length]);

  useEffect(() => {
    if (paused || slides.length < 2) return undefined;
    const t = setInterval(() => setIndex((i) => (i + 1) % slides.length), ROTATE_MS);
    return () => clearInterval(t);
  }, [paused, slides.length]);

  useGSAP(() => {
    if (prefersReducedMotion() || !infoRef.current) return;
    gsap.from(infoRef.current, { autoAlpha: 0, y: 14, duration: 0.45, ease: 'power2.out', clearProps: 'all' });
  }, { dependencies: [index, slides.length > 0] });

  if (!slides.length) return null;
  const current = slides[index] || slides[0];
  const go = (delta) => setIndex((i) => (i + delta + slides.length) % slides.length);

  return (
    <section id="upcoming" className="relative isolate scroll-mt-20 overflow-hidden bg-ink px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
      <Mandala className="pointer-events-none absolute -left-40 -top-40 -z-10 w-[560px] max-w-none text-marigold/10" />
      <div className="pointer-events-none absolute -top-32 left-1/2 -z-10 h-72 w-[80%] -translate-x-1/2 rounded-full bg-marigold/20 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-32 -left-20 -z-10 h-72 w-72 rounded-full bg-saffron/20 blur-3xl" aria-hidden="true" />

      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="kicker text-marigold">Coming up · Friends of Lord Krishna</p>
          <h2 className="mt-3 font-display text-[clamp(2rem,5vw,3.25rem)] font-semibold leading-[1.1] text-white">Come with us</h2>
          <p className="mt-4 text-[16px] leading-relaxed text-white/70 sm:text-[17px]">
            Yatras to the holy places, festivals and weekly programs, with a circle of friends your own age.
          </p>
        </div>

        <div className="mt-10 sm:mt-12">
          <PosterStage slides={slides} index={index} onPrev={() => go(-1)} onNext={() => go(1)} onPause={setPaused} />
        </div>

        <div ref={infoRef} className="mt-8" key={current.id}>
          <PosterInfo slide={current} onLoginClick={onLoginClick} />
        </div>

        {slides.length > 1 && (
          <div className="mt-6 flex items-center justify-center" role="tablist" aria-label="Choose a poster">
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={s.title}
                onClick={() => setIndex(i)}
                className="group flex h-8 items-center px-1"
              >
                <span className={cn('block h-1.5 rounded-full transition-all', i === index ? 'w-7 bg-marigold' : 'w-1.5 bg-white/30 group-hover:bg-white/50')} />
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default PosterHero;
