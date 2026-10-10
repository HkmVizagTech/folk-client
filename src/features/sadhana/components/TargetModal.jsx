import React from 'react'
import { ArrowRight, Sun } from 'lucide-react'
import { Button, Modal } from '../../../components/ui'
import { MIN_TARGET, MAX_TARGET, TARGET_STEP } from '../lib/constants'
import Stepper from './Stepper'

const TargetModal = ({ open, target, onChange, onSubmit, onSkip, submitting, dateLabel }) => (
  <Modal
    open={open}
    onClose={onSkip}
    title="Morning vow"
    description="Commit to today's rounds"
    size="sm"
    footer={
      <>
        <Button variant="ghost" onClick={onSkip}>Skip for now</Button>
        <Button onClick={onSubmit} loading={submitting}>Begin today&apos;s journey <ArrowRight size={16} aria-hidden="true" /></Button>
      </>
    }
  >
    <div className="flex flex-col items-center gap-5 text-center">
      <span className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-saffron-50 text-saffron"><Sun size={32} aria-hidden="true" /></span>
      <div className="w-full rounded-2xl border border-line bg-paper p-4 sm:p-5">
        <Stepper
          value={target}
          caption="Rounds"
          decreaseLabel={`Decrease target by ${TARGET_STEP} rounds`}
          increaseLabel={`Increase target by ${TARGET_STEP} rounds`}
          canDecrease={target > MIN_TARGET}
          canIncrease={target < MAX_TARGET}
          onDecrease={() => onChange(Math.max(MIN_TARGET, target - TARGET_STEP))}
          onIncrease={() => onChange(Math.min(MAX_TARGET, target + TARGET_STEP))}
        />
      </div>
      <p className="text-[14px] text-ink-muted">Sacred goal for {dateLabel}</p>
    </div>
  </Modal>
)

export default TargetModal
