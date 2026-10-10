import React from 'react'
import { ShieldCheck, Star, Sun, Target } from 'lucide-react'
import { Badge, Button, Card } from '../../../components/ui'
import ProgressRing from '../../../components/ui/ProgressRing'
import { useCountUp } from '../../../hooks/useCountUp'
import { MAX_ROUNDS } from '../lib/constants'
import Stepper from './Stepper'

const Ring = ({ rounds, target }) => {
  const shown = useCountUp(rounds)
  return (
    <ProgressRing value={rounds} max={target || 16} size={200} stroke={14} barClass={rounds >= target && target ? 'text-marigold' : 'text-saffron'} label={`${rounds} of ${target || '--'} rounds today`}>
      <span className="font-display text-[52px] font-semibold leading-none text-ink">{shown}</span>
      <span className="mt-1 text-[12px] font-bold uppercase tracking-label text-ink-muted">of {target || '--'} rounds</span>
    </ProgressRing>
  )
}

/** Today's japa: ring, +/- logger and the day's score. */
const TodayCard = ({ log, draft, onDraft, onSubmit, onSetTarget, submitting }) => {
  const rounds = Number(log?.roundsCompleted) || 0
  const target = Number(log?.target) || 0
  return (
    <Card data-reveal className="flex flex-col items-center text-center lg:col-span-5">
      <p className="kicker">Today&apos;s japa</p>
      <div className="my-6"><Ring rounds={rounds} target={target} /></div>

      {log ? (
        <div className="w-full max-w-sm space-y-5">
          <div className="rounded-2xl border border-line bg-paper p-4">
            <Stepper
              value={draft}
              caption="Rounds logged"
              decreaseLabel="Decrease rounds logged by 1"
              increaseLabel="Increase rounds logged by 1"
              canDecrease={draft > 0}
              canIncrease={draft < MAX_ROUNDS}
              onDecrease={() => onDraft(Math.max(0, draft - 1))}
              onIncrease={() => onDraft(Math.min(MAX_ROUNDS, draft + 1))}
            />
          </div>
          <Button size="lg" onClick={onSubmit} loading={submitting} className="w-full">
            <ShieldCheck size={20} aria-hidden="true" /> {rounds > 0 ? 'Update record' : 'Submit entry'}
          </Button>
          <p className="inline-flex items-center gap-2 text-[13px] font-semibold text-ink-muted"><Target size={15} aria-hidden="true" /> Vow: {target} rounds</p>
          {log.score > 0 && (
            <div className="flex items-center justify-center gap-3">
              <Badge tone="success" dot>Secured</Badge>
              <Badge tone="gold"><Star size={13} fill="currentColor" aria-hidden="true" /> +{log.score} pts</Badge>
            </div>
          )}
        </div>
      ) : (
        <div className="flex max-w-xs flex-col items-center gap-4">
          <p className="text-[15px] text-ink-muted">Set today&apos;s rounds target to start logging your practice.</p>
          <Button onClick={onSetTarget}><Sun size={17} aria-hidden="true" /> Set target now</Button>
        </div>
      )}
    </Card>
  )
}

export default TodayCard
