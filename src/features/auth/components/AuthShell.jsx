import React, { useRef } from 'react'
import { ShieldCheck, Sparkles, HeartHandshake, CalendarHeart } from 'lucide-react'
import { cn } from '../../../lib/utils'
import { gsap, useGSAP, EASE, prefersReducedMotion } from '../../../lib/motion'

const MEMBER_POINTS = [
  { icon: Sparkles, text: 'Log your daily sadhana and track progress' },
  { icon: CalendarHeart, text: 'Join events, programs and seva opportunities' },
  { icon: HeartHandshake, text: 'Stay connected with the devotee community' },
]
const ADMIN_POINTS = [
  { icon: ShieldCheck, text: 'Full control of events, devotees and seva' },
  { icon: Sparkles, text: 'Attendance, payments and reports in one place' },
]

const BrandPanel = ({ admin }) => {
  const points = admin ? ADMIN_POINTS : MEMBER_POINTS
  return (
    <aside
      data-auth-panel
      className={cn(
        'relative hidden lg:flex flex-col justify-between overflow-hidden p-12 xl:p-16 text-white',
        admin ? 'bg-navy-900' : 'bg-navy',
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/30" aria-hidden="true" />
      <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-marigold/20 blur-3xl" aria-hidden="true" />
      <div className="absolute -bottom-32 -left-24 h-96 w-96 rounded-full bg-saffron/20 blur-3xl" aria-hidden="true" />

      <img src="/folk_logo_white.png" alt="FOLK Vizag" className="relative h-12 w-auto self-start" />

      <div className="relative max-w-md">
        <p className="kicker !text-marigold-light mb-4">{admin ? 'Control Portal' : 'The divine journey begins'}</p>
        <h2 className="font-display text-[36px] xl:text-[42px] font-semibold leading-tight">
          {admin ? 'Run the community with clarity.' : 'Grow in devotion, together.'}
        </h2>
        <div className="my-6 h-px w-20 bg-gradient-to-r from-marigold to-transparent" aria-hidden="true" />
        <ul className="space-y-4">
          {points.map(({ icon: Icon, text }) => (
            <li key={text} data-auth-point className="flex items-start gap-3 text-[16px] text-white/85">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15">
                <Icon size={18} className="text-marigold-light" aria-hidden="true" />
              </span>
              <span className="pt-1.5">{text}</span>
            </li>
          ))}
        </ul>
      </div>

      <p className="relative text-[13px] text-white/60">&copy; FOLK Vizag. Hare Krishna.</p>
    </aside>
  )
}

/**
 * Split-screen auth layout: brand panel (desktop) + centred form column.
 * `variant="admin"` swaps to the deeper maroon control-portal treatment.
 */
const AuthShell = ({ variant = 'member', title, description, badge, children, footer, width = 'max-w-md' }) => {
  const scope = useRef(null)
  const admin = variant === 'admin'

  useGSAP(() => {
    if (prefersReducedMotion()) return
    const tl = gsap.timeline({ defaults: { ease: EASE } })
    tl.from('[data-auth-panel]', { autoAlpha: 0, x: -24, duration: 0.7 })
      .from('[data-auth-point]', { autoAlpha: 0, x: -16, stagger: 0.1, duration: 0.45 }, '-=0.35')
      .from('[data-auth-card]', { autoAlpha: 0, y: 24, duration: 0.6, clearProps: 'all' }, 0.1)
      .from('[data-auth-item]', { autoAlpha: 0, y: 12, stagger: 0.06, duration: 0.4, clearProps: 'all' }, 0.3)
  }, { scope })

  return (
    <div ref={scope} className="min-h-screen bg-paper lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <BrandPanel admin={admin} />
      <main className="relative flex min-h-screen items-center justify-center px-4 py-10 sm:px-8">
        <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-marigold/10 to-transparent lg:hidden" aria-hidden="true" />
        <div data-auth-card className={cn('relative w-full', width)}>
          <div className="mb-8 text-center lg:text-left">
            <img src="/folk_logo_blue.png" alt="FOLK Vizag" className="mx-auto mb-6 h-12 w-auto lg:hidden" />
            {badge && (
              <span data-auth-item className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-navy/10 text-navy">
                {badge}
              </span>
            )}
            <h1 data-auth-item className="font-display text-[28px] sm:text-[32px] font-semibold leading-tight text-navy">{title}</h1>
            {description && <p data-auth-item className="mt-2 text-[15px] sm:text-[16px] text-ink-muted">{description}</p>}
          </div>
          <div data-auth-item className="rounded-2xl border border-line/80 bg-white p-5 shadow-card sm:p-7">
            {children}
          </div>
          {footer && <div data-auth-item className="mt-6 text-center text-[13px] text-ink-muted">{footer}</div>}
        </div>
      </main>
    </div>
  )
}

export default AuthShell
