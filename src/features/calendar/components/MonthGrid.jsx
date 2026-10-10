import React, { useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button, Card } from '../../../components/ui'
import { audienceOf } from '../../../content/audiences'
import { cn } from '../../../lib/utils'
import { gsap, useGSAP, prefersReducedMotion } from '../../../lib/motion'
import { WEEKDAYS, monthLabel } from '../lib/monthGrid'
import { toneOf } from '../lib/audienceTone'

const Day = ({ dayKey, events, selected, today, onSelect }) => {
  // One dot per audience present that day, up to three.
  const dots = [...new Set(events.map((e) => audienceOf(e).id))].slice(0, 3)
  const count = events.length
  return (
    <button
      type="button"
      data-day
      onClick={() => onSelect(dayKey)}
      aria-pressed={selected}
      aria-label={`${dayKey}${count ? `, ${count} program${count > 1 ? 's' : ''}` : ''}`}
      className={cn(
        'flex aspect-square min-h-[44px] flex-col items-center justify-center gap-1 rounded-xl text-[15px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron',
        selected ? 'bg-navy font-bold text-white shadow-soft' : today ? 'bg-saffron-50 font-bold text-saffron-dark ring-1 ring-saffron/40' : 'text-ink hover:bg-paper',
      )}
    >
      {Number(dayKey.slice(8))}
      <span className="flex h-1.5 gap-0.5" aria-hidden="true">
        {dots.map((id) => <span key={id} className={cn('h-1.5 w-1.5 rounded-full', selected ? 'bg-marigold' : toneOf(id).dot)} />)}
      </span>
    </button>
  )
}

const MonthGrid = ({ cursor, cells, byDay, selected, todayKey, onSelect, onMove, onToday }) => {
  const ref = useRef(null)
  useGSAP(() => {
    if (prefersReducedMotion()) return
    gsap.from('[data-day]', { autoAlpha: 0, y: 6, duration: 0.3, stagger: 0.008, ease: 'power2.out', clearProps: 'all' })
  }, { scope: ref, dependencies: [cursor.y, cursor.m] })

  return (
    <Card data-reveal className="lg:col-span-2">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-[22px] font-semibold text-ink">{monthLabel(cursor)}</h2>
        <div className="flex items-center gap-1.5">
          <Button variant="secondary" size="icon" onClick={() => onMove(-1)} aria-label="Previous month" className="h-11 w-11"><ChevronLeft size={18} /></Button>
          <Button variant="secondary" onClick={onToday} className="min-h-[44px] px-4 text-[14px]">Today</Button>
          <Button variant="secondary" size="icon" onClick={() => onMove(1)} aria-label="Next month" className="h-11 w-11"><ChevronRight size={18} /></Button>
        </div>
      </div>
      <div className="mt-5 grid grid-cols-7 text-center text-[12px] font-bold uppercase tracking-label text-ink-muted">
        {WEEKDAYS.map((d) => <div key={d} className="py-2">{d}</div>)}
      </div>
      <div ref={ref} className="grid grid-cols-7 gap-1 sm:gap-1.5">
        {cells.map((k, i) => k
          ? <Day key={k} dayKey={k} events={byDay.get(k) || []} selected={k === selected} today={k === todayKey} onSelect={onSelect} />
          : <div key={`pad-${i}`} />)}
      </div>
    </Card>
  )
}

export default MonthGrid
