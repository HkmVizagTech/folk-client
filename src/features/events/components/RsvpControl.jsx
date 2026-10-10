import React from 'react'
import { CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '../../../components/ui'
import { cn } from '../../../lib/utils'
import { ATTENDING, CANCELLED, DECLINED } from '../lib/events'

const LABEL = {
  [ATTENDING]: 'You are going',
  [DECLINED]: 'You are not going',
}

const INVERSE = {
  label: 'text-white/70',
  secondary: 'border-white/25 bg-white/10 text-white hover:border-white/40 hover:bg-white/20',
  ghost: 'text-white/80 hover:bg-white/10 hover:text-white',
}

/** The member's answer and the moves from it: attend, decline, withdraw. */
const RsvpControl = ({ status, busy, onChoose, inverse = false }) => {
  const answered = status === ATTENDING || status === DECLINED
  return (
    <div className="flex flex-col gap-2.5">
      <p className={cn('text-[12px] font-semibold uppercase tracking-label', inverse ? INVERSE.label : 'text-ink-muted')}>
        {LABEL[status] || 'Will you be there?'}
      </p>
      <div className="flex flex-wrap gap-2">
        {status !== ATTENDING && (
          <Button size="sm" disabled={busy} onClick={() => onChoose(ATTENDING)}>
            <CheckCircle2 size={15} aria-hidden="true" /> I will attend
          </Button>
        )}
        {status !== DECLINED && (
          <Button size="sm" variant="secondary" disabled={busy} onClick={() => onChoose(DECLINED)} className={inverse ? INVERSE.secondary : undefined}>
            <XCircle size={15} aria-hidden="true" /> Can&apos;t make it
          </Button>
        )}
        {answered && (
          <Button size="sm" variant="ghost" disabled={busy} onClick={() => onChoose(CANCELLED)} className={inverse ? INVERSE.ghost : undefined}>
            Withdraw
          </Button>
        )}
      </div>
    </div>
  )
}

export default RsvpControl
