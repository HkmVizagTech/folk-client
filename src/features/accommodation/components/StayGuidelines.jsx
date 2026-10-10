import React from 'react'
import { Info } from 'lucide-react'
import { Card } from '../../../components/ui'

const RULES = [
  <>Check-in after <strong>12:00 PM</strong></>,
  <>Check-out before <strong>10:00 AM</strong></>,
  'Simple Satvik Prasadam is provided at set times.',
  'Maintain spiritual decorum and silence during night hours.',
]

const StayGuidelines = () => (
  <Card className="border-marigold/30 bg-gradient-to-br from-saffron-50 to-marigold-light/30">
    <h3 className="mb-4 flex items-center gap-3 font-display text-[18px] font-semibold text-navy">
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white text-saffron shadow-soft"><Info size={18} aria-hidden="true" /></span>
      Stay guidelines
    </h3>
    <ul className="grid gap-3 text-[14px] text-ink-soft">
      {RULES.map((rule, i) => (
        <li key={i} className="flex gap-3">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-saffron" aria-hidden="true" />
          <span>{rule}</span>
        </li>
      ))}
    </ul>
  </Card>
)

export default StayGuidelines
