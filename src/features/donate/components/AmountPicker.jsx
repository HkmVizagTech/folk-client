import React from 'react';
import { Input } from '../../../components/ui';
import { cn } from '../../../lib/utils';
import { formatINR } from '../lib/causes';

const AmountPicker = ({ presets, amount, onChange }) => (
  <div>
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4" role="radiogroup" aria-label="Amount">
      {presets.map((p) => {
        const active = amount === String(p);
        return (
          <button
            key={p}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(String(p))}
            className={cn(
              'min-h-[44px] rounded-xl border text-[15px] font-semibold tabular-nums transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron focus-visible:ring-offset-2',
              active ? 'border-saffron bg-saffron text-white shadow-md' : 'border-line bg-paper text-ink-soft hover:border-marigold hover:bg-saffron-50',
            )}
          >
            {formatINR(p)}
          </button>
        );
      })}
    </div>
    <label className="mt-4 block">
      <span className="mb-1.5 block text-[14px] font-semibold text-ink">Or enter an amount</span>
      <span className="relative block">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-semibold text-ink-muted" aria-hidden="true">₹</span>
        <Input type="number" inputMode="numeric" min="1" value={amount} onChange={(e) => onChange(e.target.value)} placeholder="Custom amount" className="pl-8 font-semibold tabular-nums" />
      </span>
    </label>
  </div>
);

export default AmountPicker;
