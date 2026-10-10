import React from 'react'
import { Cake } from 'lucide-react'
import { Card } from '../../../components/ui'

const BirthdayCard = ({ people }) => (
  <Card data-reveal>
    <h2 className="flex items-center gap-2 font-display text-[18px] font-semibold text-ink"><Cake size={18} className="text-marigold-dark" aria-hidden="true" /> Birthdays this month</h2>
    <ul className="mt-4 flex flex-wrap gap-2">
      {people.map((m) => (
        <li key={m.id} className="inline-flex min-h-[40px] items-center gap-2 rounded-full border border-line bg-paper/60 px-4 text-[14px]">
          <span className="font-semibold text-ink">{m.displayName}</span>
          <span className="text-ink-muted">{Number(m.dob.slice(8))} {new Date(`${m.dob}T12:00:00`).toLocaleDateString('en-IN', { month: 'short' })}</span>
        </li>
      ))}
    </ul>
  </Card>
)

export default BirthdayCard
