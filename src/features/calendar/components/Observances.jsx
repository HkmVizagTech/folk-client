import React from 'react'
import { Card } from '../../../components/ui'
import { Lotus } from '../../../components/site/Ornament'
import { OBSERVANCES } from '../lib/observances'

const Observances = () => (
  <Card data-reveal className="mt-5">
    <div className="flex items-center gap-3 text-marigold-dark"><Lotus /></div>
    <h2 className="mt-2 font-display text-[22px] font-semibold text-navy">Vaishnava observances</h2>
    <p className="mt-1 max-w-2xl text-[15px] text-ink-muted">Exact dates change each year with the lunar calendar. FOLK Vizag announces each one as an event.</p>
    <ul className="mt-6 grid gap-x-8 gap-y-5 sm:grid-cols-2">
      {OBSERVANCES.map(([title, text]) => (
        <li key={title} className="border-l-2 border-marigold/60 pl-4">
          <p className="font-display text-[17px] font-semibold">{title}</p>
          <p className="mt-0.5 text-[14px] text-ink-muted">{text}</p>
        </li>
      ))}
    </ul>
  </Card>
)

export default Observances
