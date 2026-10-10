import React from 'react'
import { Calendar } from 'lucide-react'
import { cn } from '../../../lib/utils'

/** Calendar-leaf tile: month strip over a large day number. */
const DateBadge = ({ parts, className }) => (
  <div
    className={cn('flex w-14 shrink-0 flex-col overflow-hidden rounded-xl border border-line/80 bg-white text-center shadow-soft', className)}
    aria-hidden="true"
  >
    {parts ? (
      <>
        <span className="bg-saffron py-0.5 text-[11px] font-bold uppercase tracking-label text-white">{parts.month}</span>
        <span className="py-1.5 font-display text-[22px] font-semibold leading-none text-ink">{parts.day}</span>
      </>
    ) : (
      <span className="flex h-14 items-center justify-center text-saffron-dark"><Calendar size={22} /></span>
    )}
  </div>
)

export default DateBadge
