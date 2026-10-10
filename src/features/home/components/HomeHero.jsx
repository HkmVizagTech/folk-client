import React, { useRef } from 'react'
import { BookOpenText, Check, Flame, QrCode } from 'lucide-react'
import { Badge, Button, Skeleton } from '../../../components/ui'
import ProgressRing from '../../../components/ui/ProgressRing'
import { Lotus } from '../../../components/site/Ornament'
import { useCountUp } from '../../../hooks/useCountUp'
import { gsap, useGSAP, prefersReducedMotion, EASE } from '../../../lib/motion'

const GHOST_LIGHT = 'border-2 border-white/70 bg-transparent text-white shadow-none hover:bg-white hover:text-ink'

const JapaRing = ({ rounds, target, done, loading }) => {
  const shown = useCountUp(rounds)
  if (loading) return <Skeleton className="h-[160px] w-[160px] rounded-full bg-white/10" />
  return (
    <ProgressRing
      value={rounds}
      max={target}
      size={160}
      stroke={12}
      trackClass="text-white/20"
      barClass={done ? 'text-marigold' : 'text-saffron-light'}
      label={`${rounds} of ${target} rounds today`}
    >
      <span className="font-display text-[40px] font-bold leading-none">{shown}</span>
      <span className="mt-1 text-[11px] font-bold uppercase tracking-label text-white/70">of {target} rounds</span>
    </ProgressRing>
  )
}

/** Greeting, verse of the day and today's japa ring. */
const HomeHero = ({ greeting, name, stageName, verse, rounds, target, done, streak, loading, hasLog, onLog, onQR }) => {
  const ref = useRef(null)
  useGSAP(() => {
    if (prefersReducedMotion()) return
    gsap.timeline({ defaults: { ease: EASE } })
      .from('[data-hero-in]', { autoAlpha: 0, y: 16, duration: 0.6, stagger: 0.09, delay: 0.1 })
      .from('[data-hero-ring]', { autoAlpha: 0, scale: 0.85, duration: 0.7 }, 0.2)
  }, { scope: ref })

  return (
    <section ref={ref} data-reveal className="hero-devotional relative overflow-hidden rounded-3xl text-white shadow-premium-xl">
      <div className="relative grid gap-8 p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center lg:gap-12 lg:p-10">
        <div className="min-w-0">
          <p data-hero-in className="text-[13px] font-semibold uppercase tracking-[0.14em] text-marigold-light/90">{greeting}</p>
          <h1 data-hero-in className="mt-2 font-display text-[30px] font-semibold leading-[1.12] sm:text-[40px] lg:text-[44px]">
            Hare Krishna, <span className="user-text">{name}</span>
          </h1>
          <Badge data-hero-in dot className="mt-4 h-8 border border-marigold/50 bg-white/10 px-3.5 text-marigold-light">{stageName} member</Badge>

          <figure data-hero-in className="mt-6 max-w-xl border-l-2 border-marigold/60 pl-4">
            <blockquote className="user-text font-display text-[17px] italic leading-relaxed text-white/90 sm:text-[18px]">“{verse.text}”</blockquote>
            <figcaption className="mt-2 inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-label text-marigold-light/90">
              <BookOpenText size={14} aria-hidden="true" /> {verse.ref}
            </figcaption>
          </figure>

          <div data-hero-in className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" onClick={onLog} className="shadow-premium-xl">{hasLog ? 'Update today’s rounds' : 'Log today’s rounds'}</Button>
            <Button size="lg" variant="ghost" onClick={onQR} className={GHOST_LIGHT}><QrCode size={18} aria-hidden="true" /> My check-in QR</Button>
          </div>
        </div>

        <div data-hero-ring className="flex flex-col items-center gap-3 justify-self-center lg:justify-self-end">
          <JapaRing rounds={rounds} target={target} done={done} loading={loading} />
          <p className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-white/85">
            {done
              ? <><Check size={16} className="text-marigold" aria-hidden="true" /> Target reached, Jaya!</>
              : <><Flame size={16} className="text-saffron-light" aria-hidden="true" /> {streak} day streak{streak > 0 ? ', keep it alive' : ''}</>}
          </p>
        </div>
      </div>
      <Lotus className="absolute bottom-4 right-6 hidden text-marigold/40 sm:block" />
    </section>
  )
}

export default HomeHero
