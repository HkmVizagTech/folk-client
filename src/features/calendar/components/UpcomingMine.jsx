import React from 'react'
import { Card } from '../../../components/ui'
import { formatTime } from '../../../lib/dates'

const dayOf = (d) => d.toLocaleDateString('en-IN', { day: '2-digit', timeZone: 'Asia/Kolkata' })
const monthOf = (d) => d.toLocaleDateString('en-IN', { month: 'short', timeZone: 'Asia/Kolkata' })

const UpcomingMine = ({ events, onPick }) => (
  <Card data-reveal className="mt-5">
    <h2 className="text-[12px] font-bold uppercase tracking-label text-ink-muted">Your next programs</h2>
    <ul className="mt-4 grid gap-3 sm:grid-cols-2">
      {events.map((e) => (
        <li key={e.id}>
          <button type="button" onClick={() => onPick(e)} className="flex min-h-[64px] w-full items-center gap-4 rounded-xl border border-line p-3.5 text-left transition-colors hover:border-marigold/50 hover:bg-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron">
            <span className="w-12 shrink-0 rounded-lg bg-paper py-1.5 text-center">
              <span className="block font-display text-[18px] font-bold leading-none text-navy">{dayOf(e._d)}</span>
              <span className="mt-0.5 block text-[10px] font-bold uppercase tracking-label text-saffron-dark">{monthOf(e._d)}</span>
            </span>
            <span className="min-w-0">
              <span className="user-text block truncate font-semibold">{e.title}</span>
              <span className="block text-[13px] text-ink-muted">{formatTime(e._d)}{e.location ? ` · ${e.location}` : ''}</span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  </Card>
)

export default UpcomingMine
