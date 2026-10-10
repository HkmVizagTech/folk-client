import React from 'react'
import { ArrowRight, CheckCircle2, Users } from 'lucide-react'
import { Button } from '../../../components/ui'
import { cn } from '../../../lib/utils'

const ROLES = [
  { id: 'devotee', title: 'Devotee', desc: 'Log sadhana, track attendance, and join events.', icon: Users },
]

/** Post-sign-in step: confirm the role before entering the app. */
const ProfileStep = ({ flow }) => {
  const { selectedRole, setSelectedRole, loading, finishProfile } = flow
  return (
    <div className="space-y-5">
      <div role="radiogroup" aria-label="Account type" className="grid gap-3">
        {ROLES.map(({ id, title, desc, icon: Icon }) => {
          const active = selectedRole === id
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setSelectedRole(id)}
              className={cn(
                'flex items-start gap-4 rounded-2xl border-2 p-4 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron',
                active ? 'border-saffron bg-saffron-50' : 'border-line bg-paper hover:border-marigold/60',
              )}
            >
              <span className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', active ? 'bg-white text-saffron shadow-sm' : 'bg-white text-ink-muted')}>
                <Icon size={20} aria-hidden="true" />
              </span>
              <span className="flex-1">
                <span className="flex items-center justify-between">
                  <span className="font-display text-[17px] font-semibold text-ink">{title}</span>
                  {active && <CheckCircle2 size={18} className="text-saffron" aria-hidden="true" />}
                </span>
                <span className="mt-0.5 block text-[14px] text-ink-muted">{desc}</span>
              </span>
            </button>
          )
        })}
      </div>
      <Button size="lg" className="w-full" loading={loading} disabled={!selectedRole} onClick={finishProfile}>
        Enter application <ArrowRight size={18} aria-hidden="true" />
      </Button>
      <p className="text-center text-[13px] text-ink-muted">Folks Head or Admin access is granted by an existing admin after you sign up.</p>
    </div>
  )
}

export default ProfileStep
