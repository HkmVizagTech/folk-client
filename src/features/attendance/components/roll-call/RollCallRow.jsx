import React from 'react'
import { Check } from 'lucide-react'
import { Avatar } from '../../../../components/ui'
import { stageLabel } from '../../../../content/journey'
import { cn } from '../../../../lib/utils'

const RollCallRow = ({ member, busy, onToggle }) => (
  <button
    type="button"
    onClick={onToggle}
    aria-busy={busy}
    aria-pressed={member.present}
    className={cn(
      'flex min-h-[64px] w-full items-center gap-3 rounded-xl border p-3 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron active:scale-[0.99]',
      member.present ? 'border-emerald-300 bg-emerald-50' : 'border-line bg-white hover:border-marigold/60 hover:bg-paper',
    )}
  >
    <span className="relative shrink-0">
      <Avatar name={member.displayName} src={member.photo} className={cn(member.present && 'opacity-40')} />
      {member.present && <span className="absolute inset-0 flex items-center justify-center rounded-full bg-emerald-600 text-white"><Check size={20} aria-hidden="true" /></span>}
    </span>
    <span className="min-w-0 flex-1">
      <span className="block truncate font-semibold text-ink user-text">{member.displayName}</span>
      <span className={cn('block text-[13px]', member.present ? 'font-medium text-emerald-700' : 'text-ink-muted')}>{member.present ? 'Present' : stageLabel(member.stage)}</span>
    </span>
  </button>
)

export default RollCallRow
