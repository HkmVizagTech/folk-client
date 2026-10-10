import React, { useRef } from 'react'
import { CheckCircle2, Home, Info, Users, XCircle } from 'lucide-react'
import { Avatar, Button } from '../../../components/ui'
import { gsap, useGSAP, prefersReducedMotion } from '../../../lib/motion'
import { cn } from '../../../lib/utils'

const VerifyResult = ({ result, onDismiss }) => {
  const ref = useRef(null)
  const ok = result.success
  const Icon = ok ? CheckCircle2 : XCircle

  useGSAP(() => {
    if (prefersReducedMotion()) return
    gsap.from(ref.current, { autoAlpha: 0, y: 16, scale: 0.97, duration: 0.35, ease: 'power3.out' })
    gsap.from('[data-pop]', { scale: 0.4, autoAlpha: 0, duration: 0.5, delay: 0.1, ease: 'back.out(2)' })
  }, { scope: ref, dependencies: [result] })

  return (
    <div ref={ref} role={ok ? 'status' : 'alert'} className={cn('mt-6 overflow-hidden rounded-2xl border-2 bg-white shadow-premium', ok ? 'border-emerald-500' : 'border-red-500')}>
      <div className={cn('px-4 py-7 text-center text-white', ok ? 'bg-emerald-600' : 'bg-red-600')}>
        <span data-pop className="mx-auto mb-2 inline-flex h-14 w-14 items-center justify-center rounded-full bg-white/20"><Icon size={34} aria-hidden="true" /></span>
        <h3 className="font-display text-[28px] font-semibold tracking-wide">{ok ? 'Allowed' : 'Denied'}</h3>
        <p className="mt-1 px-2 text-[14px] font-medium opacity-90">{result.message}</p>
      </div>

      <div className="space-y-4 p-5">
        {ok && result.devotee && (
          <div className="flex items-center gap-4">
            <Avatar name={result.devotee.name} size="lg" />
            <div className="min-w-0">
              <p className="text-[12px] font-semibold uppercase tracking-label text-ink-muted">Devotee</p>
              <p className="truncate font-display text-[20px] font-semibold text-ink">{result.devotee.name}</p>
              <p className="truncate font-mono text-[12px] text-saffron-dark">ID: {result.devotee.id?.slice(0, 12)}…</p>
            </div>
          </div>
        )}
        {result.notice && (
          <p className="flex items-start gap-3 rounded-xl border border-navy-100 bg-navy-50 p-3 text-[13px] font-medium text-navy">
            <Info size={16} className="mt-0.5 shrink-0" aria-hidden="true" />{result.notice}
          </p>
        )}
        {result.accommodation && (
          <div className="rounded-xl border border-marigold/40 bg-marigold-light/20 p-3">
            <p className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-label text-marigold-dark"><Home size={14} aria-hidden="true" /> Reserved stay</p>
            <div className="mt-2 flex items-center justify-between gap-3 text-[14px]">
              <span className="min-w-0 truncate font-semibold text-ink">{result.accommodation.type}</span>
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-white px-2.5 py-1 font-semibold text-marigold-dark"><Users size={13} aria-hidden="true" />{result.accommodation.guestCount}</span>
            </div>
          </div>
        )}
        <Button variant="dark" className="w-full" onClick={onDismiss}>Dismiss</Button>
      </div>
    </div>
  )
}

export default VerifyResult
