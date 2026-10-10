import React from 'react'
import { Ticket } from 'lucide-react'
import { cn } from '../../../lib/utils'

/** The attendance token a member shows at the gate. */
const TicketChip = ({ token, inverse = false }) => (
  <div className={cn(
    'inline-flex items-center gap-2.5 rounded-xl border px-3 py-2',
    inverse ? 'border-white/25 bg-white/10 text-white' : 'border-emerald-200 bg-emerald-50 text-emerald-800',
  )}>
    <Ticket size={18} aria-hidden="true" />
    <span className="leading-tight">
      <span className={cn('block text-[11px] font-semibold uppercase tracking-label', inverse ? 'text-white/70' : 'text-emerald-700/80')}>Your token</span>
      <span className="block font-mono text-[15px] font-semibold tracking-widest">{token}</span>
    </span>
  </div>
)

export default TicketChip
