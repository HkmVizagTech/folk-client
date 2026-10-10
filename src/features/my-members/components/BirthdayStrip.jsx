import React from 'react'
import { Cake } from 'lucide-react'
import { Card } from '../../../components/ui'
import { whatsappUrl } from '../../../lib/phone'
import { birthdayText } from '../lib/memberMetrics'

const BirthdayStrip = ({ birthdays }) => {
  if (!birthdays.length) return null
  return (
    <Card data-reveal className="mb-6">
      <h2 className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-label text-ink-muted"><Cake size={16} className="text-marigold-dark" aria-hidden="true" /> Birthdays this week</h2>
      <ul className="mt-3 flex flex-wrap gap-2">
        {birthdays.map((b) => (
          <li key={b.id}>
            <a
              href={whatsappUrl(b.phone, `Hare Krishna ${b.displayName.split(' ')[0]}! Happy birthday from FOLK Vizag.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-line bg-paper/60 px-4 text-[14px] text-ink transition-colors hover:border-marigold/60 hover:bg-marigold-light/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron"
            >
              <span className="font-semibold">{b.displayName}</span>
              <span className="text-ink-muted">{birthdayText(b.bday)}</span>
            </a>
          </li>
        ))}
      </ul>
    </Card>
  )
}

export default BirthdayStrip
