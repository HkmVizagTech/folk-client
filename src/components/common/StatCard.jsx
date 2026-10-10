import React from 'react'
import { cn } from '../../lib/utils'
import { useCountUp } from '../../hooks/useCountUp'

const TONES = {
  saffron: 'bg-saffron-50 text-saffron-dark',
  maroon: 'bg-navy-50 text-navy',
  gold: 'bg-marigold-light/40 text-marigold-dark',
  green: 'bg-emerald-50 text-emerald-700',
}

/** KPI tile. Numeric `value` counts up; strings render as given. */
const StatCard = ({ label, value, sub, icon: Icon, tone = 'saffron', onClick, className }) => {
  const numeric = typeof value === 'number'
  const counted = useCountUp(numeric ? value : 0)
  const Comp = onClick ? 'button' : 'div'
  return (
    <Comp
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      data-reveal
      className={cn(
        'group relative w-full overflow-hidden rounded-2xl border border-line/80 bg-white p-4 sm:p-5 text-left shadow-card',
        onClick && 'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-premium-xl hover:border-marigold/50',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[12px] font-semibold uppercase tracking-label text-ink-muted">{label}</p>
        {Icon && <span className={cn('inline-flex h-9 w-9 items-center justify-center rounded-xl', TONES[tone])}><Icon size={18} aria-hidden="true" /></span>}
      </div>
      <p className="mt-3 font-display text-[28px] sm:text-[32px] font-semibold leading-none text-ink break-words">{numeric ? counted.toLocaleString('en-IN') : value}</p>
      {sub && <p className="mt-2 text-[13px] text-ink-muted">{sub}</p>}
    </Comp>
  )
}

export default StatCard
