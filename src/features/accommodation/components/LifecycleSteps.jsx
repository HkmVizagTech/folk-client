import React, { useRef } from 'react'
import { Card } from '../../../components/ui'
import { gsap, useGSAP, prefersReducedMotion } from '../../../lib/motion'
import { cn } from '../../../lib/utils'
import { LIFECYCLE } from '../lib/accommodation'

const LifecycleSteps = () => {
  const ref = useRef(null)
  useGSAP(() => {
    if (prefersReducedMotion()) return
    gsap.from('[data-step]', { scale: 0.85, autoAlpha: 0, duration: 0.5, stagger: 0.12, ease: 'back.out(1.6)', delay: 0.2 })
  }, { scope: ref })

  return (
    <Card ref={ref} className="bg-gradient-to-r from-white to-paper">
      <h2 className="mb-8 text-center font-display text-[20px] font-semibold text-ink">Reservation lifecycle</h2>
      <ol className="relative mx-auto grid max-w-3xl gap-6 md:grid-cols-4 md:gap-0">
        <span className="absolute left-[12.5%] right-[12.5%] top-7 hidden h-0.5 bg-line md:block" aria-hidden="true" />
        {LIFECYCLE.map(({ label, done, icon: Icon }) => (
          <li key={label} data-step className="relative flex items-center gap-4 md:flex-col md:gap-3">
            <span className={cn(
              'inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-2',
              done ? 'border-saffron bg-saffron text-white shadow-md' : 'border-line bg-white text-ink-muted/60',
            )}>
              <Icon size={24} aria-hidden="true" />
            </span>
            <span className="flex flex-col md:items-center">
              <span className={cn('text-[12px] font-bold uppercase tracking-label', done ? 'text-saffron-dark' : 'text-ink-muted')}>{label}</span>
              <span className="text-[12px] text-ink-muted md:hidden">{done ? 'Done' : 'Pending verification'}</span>
            </span>
          </li>
        ))}
      </ol>
    </Card>
  )
}

export default LifecycleSteps
