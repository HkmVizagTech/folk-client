import React from 'react'
import { Minus, Plus } from 'lucide-react'
import { cn } from '../../../lib/utils'

const stepBtn = 'inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-line bg-white text-ink-muted shadow-soft transition-all hover:border-saffron hover:bg-saffron-50 hover:text-saffron-dark active:scale-95 disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron focus-visible:ring-offset-2 sm:h-14 sm:w-14'

/** Big +/- counter with a caption. Presentational: the parent owns the number. */
const Stepper = ({ value, caption, onDecrease, onIncrease, decreaseLabel, increaseLabel, canDecrease = true, canIncrease = true, className }) => (
  <div className={cn('flex items-center justify-between gap-3', className)}>
    <button type="button" onClick={onDecrease} disabled={!canDecrease} aria-label={decreaseLabel} className={stepBtn}><Minus size={22} aria-hidden="true" /></button>
    <div className="text-center">
      <p className="font-display text-[48px] font-semibold leading-none tabular-nums text-ink sm:text-[56px]" aria-live="polite">{value}</p>
      <p className="mt-2 text-[12px] font-bold uppercase tracking-label text-ink-muted">{caption}</p>
    </div>
    <button type="button" onClick={onIncrease} disabled={!canIncrease} aria-label={increaseLabel} className={stepBtn}><Plus size={22} aria-hidden="true" /></button>
  </div>
)

export default Stepper
