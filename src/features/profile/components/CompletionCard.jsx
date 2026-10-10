import React from 'react'
import { Award } from 'lucide-react'
import { Card } from '../../../components/ui'
import ProgressRing from '../../../components/ui/ProgressRing'
import { useCountUp } from '../../../hooks/useCountUp'

const CompletionCard = ({ percent, missing }) => {
  const shown = useCountUp(percent)
  return (
    <Card data-reveal className="flex items-center gap-5 bg-gradient-to-br from-saffron-50 to-paper lg:flex-col lg:items-start">
      <ProgressRing value={percent} max={100} size={96} stroke={9} label={`Profile ${percent}% complete`}>
        <span className="font-display text-[24px] font-semibold text-saffron-dark">{shown}%</span>
      </ProgressRing>
      <div className="min-w-0">
        <h2 className="flex items-center gap-2 font-display text-[18px] font-semibold text-ink"><Award size={18} className="text-marigold-dark" aria-hidden="true" /> Profile completion</h2>
        <p className="mt-1 text-[14px] text-ink-muted">
          {missing.length ? 'Complete your profile to unlock community badges and your digital ID.' : 'Your profile is complete. Hare Krishna!'}
        </p>
        {missing.length > 0 && <p className="mt-2 text-[13px] text-ink-muted">Missing: {missing.join(', ')}</p>}
      </div>
    </Card>
  )
}

export default CompletionCard
