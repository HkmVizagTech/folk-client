import React from 'react'
import { QrCode } from 'lucide-react'
import Panel from './Panel'

const CheckInCard = ({ onOpen }) => (
  <Panel title="Check-in">
    <button type="button" onClick={onOpen} className="flex flex-1 items-center gap-4 rounded-xl border border-saffron/20 bg-saffron-50 p-5 text-left text-ink transition-colors hover:bg-saffron-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron">
      <QrCode size={40} className="shrink-0 text-saffron-dark" aria-hidden="true" />
      <span>
        <span className="block font-display text-[17px] font-semibold">Show my QR</span>
        <span className="block text-[14px] text-ink-muted">Staff scan it at programs for check-in &amp; prasadam</span>
      </span>
    </button>
  </Panel>
)

export default CheckInCard
