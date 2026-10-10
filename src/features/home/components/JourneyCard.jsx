import React from 'react'
import { Check } from 'lucide-react'
import { cn } from '../../../lib/utils'
import Panel from './Panel'

const dotClass = (current, reached) => cn(
  'relative z-10 inline-flex h-8 w-8 items-center justify-center rounded-full border-2 text-[12px] font-bold',
  current ? 'border-saffron bg-saffron text-white shadow-premium' : reached ? 'border-saffron bg-saffron-50 text-saffron-dark' : 'border-line bg-white text-ink-muted',
)

const JourneyCard = ({ stages, stageIdx }) => (
  <Panel title="My journey" className="lg:col-span-2">
    <ol className="flex items-start" aria-label="FOLK journey stages">
      {stages.map((s, i) => {
        const reached = i <= stageIdx
        const current = i === stageIdx
        return (
          <li key={s.id} className="relative flex min-w-0 flex-1 flex-col items-center text-center">
            {i > 0 && <span className={cn('absolute top-[15px] left-[-50%] h-0.5 w-full', reached ? 'bg-saffron' : 'bg-line')} aria-hidden="true" />}
            <span className={dotClass(current, reached)} aria-hidden="true">{reached && !current ? <Check size={14} /> : i + 1}</span>
            <span className={cn('mt-2 break-words text-[11px] font-semibold leading-tight sm:text-[12px]', current ? 'text-navy' : reached ? 'text-ink' : 'text-ink-muted')}>{s.label}</span>
          </li>
        )
      })}
    </ol>
    <p className="mt-5 rounded-xl bg-paper px-4 py-3 text-[14px] text-ink-muted">
      <span className="font-semibold text-ink">{stages[stageIdx]?.label}:</span> {stages[stageIdx]?.desc}. Your FOLK guide walks the next step with you.
    </p>
  </Panel>
)

export default JourneyCard
