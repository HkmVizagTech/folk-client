import React from 'react'
import { CheckCircle2, ShieldCheck, TrendingUp, Zap } from 'lucide-react'
import { Card } from '../../../components/ui'

const RULES = [
  { label: 'Earnings', value: '2 pts', text: 'Every round counts', icon: ShieldCheck },
  { label: 'Bonus', value: '+10 pts', text: 'When your goal is reached', icon: CheckCircle2 },
  { label: 'Streak', value: 'Boost', text: 'Higher streaks earn more points', icon: TrendingUp },
  { label: 'Rule', value: 'Strict', text: 'Miss one day and the streak resets', icon: Zap },
]

const RulesCard = () => (
  <Card data-reveal className="lg:col-span-7">
    <p className="kicker">How points work</p>
    <h2 className="mt-1 font-display text-[22px] font-semibold text-ink">Sacred rules</h2>
    <ul className="mt-5 grid gap-3 sm:grid-cols-2">
      {RULES.map(({ label, value, text, icon: Icon }) => (
        <li key={label} className="flex items-start gap-3 rounded-2xl border border-line bg-paper p-4">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-saffron-50 text-saffron-dark"><Icon size={18} aria-hidden="true" /></span>
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-label text-ink-muted">{label} <span className="rounded-full bg-white px-2 py-0.5 text-[11px] text-navy shadow-soft">{value}</span></p>
            <p className="mt-1 text-[14px] font-semibold text-ink-soft">{text}</p>
          </div>
        </li>
      ))}
    </ul>
  </Card>
)

export default RulesCard
