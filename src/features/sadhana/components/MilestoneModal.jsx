import React, { useRef } from 'react'
import { Flame } from 'lucide-react'
import { Button, Modal } from '../../../components/ui'
import { gsap, useGSAP, prefersReducedMotion } from '../../../lib/motion'

const MilestoneModal = ({ open, streak, onClose }) => {
  const flame = useRef(null)
  useGSAP(() => {
    if (!open || prefersReducedMotion() || !flame.current) return
    gsap.fromTo(flame.current, { scale: 0.6, rotate: -12, autoAlpha: 0 }, { scale: 1, rotate: 0, autoAlpha: 1, duration: 0.7, ease: 'back.out(2)' })
    gsap.to(flame.current, { scale: 1.08, duration: 1.1, yoyo: true, repeat: -1, ease: 'sine.inOut', delay: 0.7 })
  }, { dependencies: [open], revertOnUpdate: true })

  return (
    <Modal open={open} onClose={onClose} title="Streak secured" size="sm" footer={<Button onClick={onClose} className="w-full sm:w-auto">Keep going</Button>}>
      <div className="flex flex-col items-center gap-3 text-center">
        <span ref={flame} className="inline-flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-saffron to-marigold text-white shadow-premium-xl">
          <Flame size={52} fill="currentColor" aria-hidden="true" />
        </span>
        <p className="font-display text-[34px] font-semibold text-ink">Day {streak}</p>
        <div className="h-px w-full bg-gradient-to-r from-transparent via-line to-transparent" aria-hidden="true" />
        <p className="font-display text-[15px] italic text-ink-muted">“Consistent practice is the foundation of spiritual success.”</p>
      </div>
    </Modal>
  )
}

export default MilestoneModal
