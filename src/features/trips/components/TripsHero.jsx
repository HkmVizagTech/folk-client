import { Settings } from 'lucide-react'
import { Button } from '../../../components/ui'
import { useCountUp } from '../../../hooks/useCountUp'
import { useHeroIntro } from '../hooks/useHeroIntro'
import PlaceStrip from './PlaceStrip'

const HeroStat = ({ value, label }) => {
  const numeric = typeof value === 'number'
  const counted = useCountUp(numeric ? value : 0)
  return (
    <div className="min-w-0 sm:border-l sm:border-white/15 sm:pl-6 sm:first:border-l-0 sm:first:pl-0">
      <p className="font-display text-[30px] font-semibold leading-none text-white sm:text-[36px]">{numeric ? counted : value}</p>
      <p className="mt-2 text-[12px] font-semibold uppercase tracking-label text-white/60">{label}</p>
    </div>
  )
}

/** Premium public header: maroon gradient, gold dividers, animated counters. */
const TripsHero = ({ stats, placeNames, isStaff, onManage }) => {
  const ref = useHeroIntro()
  return (
    <section ref={ref} className="relative isolate overflow-hidden rounded-3xl bg-gradient-to-br from-navy-900 via-navy-800 to-navy text-white shadow-premium-xl">
      <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-saffron/30 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-marigold/20 blur-3xl" aria-hidden="true" />
      <div className="yatra-mandala pointer-events-none absolute inset-0 opacity-[0.12] mix-blend-soft-light" aria-hidden="true" />

      <div className="relative z-10 px-5 pb-8 pt-10 sm:px-10 sm:pb-10 sm:pt-14 lg:px-14 lg:pt-16">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 max-w-2xl">
            <p data-hero className="kicker !text-marigold-light">Trips &amp; Yatras</p>
            <h1 data-hero className="mt-3 font-display text-[36px] font-semibold leading-[1.08] sm:text-[52px]">
              Journey to the <span className="text-marigold-light">holy places.</span>
            </h1>
            <div data-hero className="mt-5 h-px w-24 bg-gradient-to-r from-marigold to-transparent" aria-hidden="true" />
            <p data-hero className="mt-5 max-w-xl text-[16px] leading-relaxed text-white/75">
              Pilgrimages, weekend yatras and heritage trails with the FOLK crew. Travel, stay, prasadam and kirtan taken care of. Pick a journey, reserve your seat.
            </p>
            <div data-hero className="mt-8 grid max-w-lg grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-4">
              {stats.map((s) => <HeroStat key={s.label} {...s} />)}
            </div>
          </div>
          {isStaff && (
            <Button data-hero variant="secondary" size="lg" onClick={onManage} className="shrink-0 self-start lg:self-end">
              <Settings size={17} /> Manage trips
            </Button>
          )}
        </div>
      </div>

      {placeNames.length > 0 && (
        <div data-hero className="relative z-10 border-t border-white/10 bg-ink/30 py-4 backdrop-blur-md">
          <PlaceStrip names={placeNames} dark />
        </div>
      )}
    </section>
  )
}

export default TripsHero
