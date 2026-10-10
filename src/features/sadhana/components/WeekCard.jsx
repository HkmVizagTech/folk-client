import React, { useRef } from 'react'
import { Check, Loader2 } from 'lucide-react'
import { Badge, Card } from '../../../components/ui'
import { cn } from '../../../lib/utils'
import { gsap, useGSAP, prefersReducedMotion, EASE } from '../../../lib/motion'

const Bar = ({ day, scale }) => {
  const pct = Math.min(100, (day.rounds / scale) * 100)
  const tick = day.target ? Math.min(100, (day.target / scale) * 100) : null
  return (
    <li className="flex min-w-0 flex-1 flex-col items-center gap-2" title={`${day.label}: ${day.rounds}${day.target ? ` of ${day.target}` : ''} rounds`}>
      <span className={cn('text-[12px] font-bold tabular-nums', day.logged ? 'text-ink' : 'text-ink-muted/50')}>{day.logged ? day.rounds : '·'}</span>
      <div className="relative h-36 w-full max-w-[40px] rounded-xl bg-paper-dark sm:h-44">
        <div data-bar style={{ height: `${pct}%` }} className={cn('absolute inset-x-0 bottom-0 origin-bottom rounded-xl transition-[height] duration-500 ease-out', day.done ? 'bg-gradient-to-t from-saffron to-marigold' : 'bg-saffron-light/60')} />
        {tick !== null && <span style={{ bottom: `${tick}%` }} className="absolute inset-x-[-3px] border-t-2 border-dashed border-navy/40" aria-hidden="true" />}
      </div>
      <span className={cn('inline-flex h-6 w-6 items-center justify-center rounded-full', day.done ? 'bg-saffron text-white' : 'bg-transparent')} aria-hidden="true">
        {day.done && <Check size={13} />}
      </span>
      <span className={cn('text-[12px] font-semibold', day.isToday ? 'text-navy' : 'text-ink-muted')}>{day.label}</span>
    </li>
  )
}

/** Seven-day discipline pulse: bars for rounds, dashed tick for each day's vow, check for a kept vow. */
const WeekCard = ({ days, daysKept, indexBuilding }) => {
  const ref = useRef(null)
  const scale = Math.max(16, ...days.map((d) => Math.max(d.rounds, d.target)))
  // Bars grow in once; later log updates glide via the height transition
  // instead of collapsing to zero and growing back.
  useGSAP(() => {
    if (prefersReducedMotion()) return
    gsap.from('[data-bar]', { scaleY: 0, duration: 0.8, ease: EASE, stagger: 0.07 })
  }, { scope: ref })

  return (
    <Card data-reveal className="lg:col-span-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="kicker">This week</p>
          <h2 className="mt-1 font-display text-[22px] font-semibold text-ink">Discipline pulse</h2>
          <p className="mt-1 text-[14px] text-ink-muted">{daysKept} of 7 days kept your vow</p>
        </div>
        {indexBuilding && <Badge tone="warning"><Loader2 size={13} className="animate-spin" aria-hidden="true" /> Syncing records</Badge>}
      </div>
      <ul ref={ref} className="mt-6 flex items-end gap-1.5 sm:gap-3" aria-label="Rounds chanted in the last seven days">
        {days.map((d) => <Bar key={d.key} day={d} scale={scale} />)}
      </ul>
    </Card>
  )
}

export default WeekCard
