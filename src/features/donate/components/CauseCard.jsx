import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '../../../lib/utils';
import CauseIcon from './CauseIcon';

const CauseCard = ({ cause, selected, onSelect }) => (
  <li data-reveal>
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        'group relative h-full w-full rounded-2xl border bg-white p-5 text-left shadow-card transition-all duration-200 sm:p-6',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron focus-visible:ring-offset-2',
        selected ? 'border-saffron ring-1 ring-saffron' : 'border-line/80 hover:-translate-y-0.5 hover:border-marigold/60 hover:shadow-premium-xl',
      )}
    >
      <CauseIcon cause={cause} className="mb-4 transition-transform group-hover:scale-105" />
      <h3 className="font-display text-[18px] font-semibold text-ink">{cause.title}</h3>
      <p className="mt-1.5 text-[14px] leading-relaxed text-ink-muted">{cause.desc}</p>
      <span
        className={cn('absolute right-4 top-4 inline-flex h-6 w-6 items-center justify-center rounded-full bg-saffron text-white transition-all', selected ? 'scale-100 opacity-100' : 'scale-75 opacity-0')}
        aria-hidden="true"
      >
        <Check size={14} />
      </span>
    </button>
  </li>
);

export default CauseCard;
