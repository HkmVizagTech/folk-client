import React from 'react'
import { Flame, Trophy } from 'lucide-react'
import { Avatar, Button } from '../../../components/ui'
import { EmptyState } from '../../../components/common'
import { PanelCard } from '../../staff-common/components'
import { cn } from '../../../lib/utils'

const Row = ({ user, rank }) => (
  <li className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-paper">
    <span className="relative shrink-0">
      <Avatar name={user.name} src={user.photo} />
      {rank <= 3 && (
        <span className={cn('absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white text-[10px] font-bold text-white', rank === 1 ? 'bg-marigold' : 'bg-marigold-dark/70')}>{rank}</span>
      )}
    </span>
    <span className="min-w-0 flex-1">
      <span className="block truncate text-[14px] font-semibold text-ink">{user.name}</span>
      <span className="mt-0.5 flex items-center gap-1 text-[12px] text-ink-muted"><Flame size={12} className="text-saffron" aria-hidden="true" />{user.streak || 0}d streak</span>
    </span>
    <span className="shrink-0 text-right">
      <span className="block font-display text-[16px] font-semibold text-saffron-dark">{Math.max(0, user.score || 0)}</span>
      <span className="block text-[11px] uppercase tracking-label text-ink-muted">pts</span>
    </span>
  </li>
)

const TopPerformers = ({ users, onViewAll }) => (
  <PanelCard
    icon={Trophy}
    tone="gold"
    title="Top performers"
    actions={<Button variant="ghost" size="sm" onClick={onViewAll}>View all</Button>}
  >
    {users.length === 0 ? (
      <EmptyState icon={Trophy} title="No devotees yet" />
    ) : (
      <ul className="-mx-2 max-h-[420px] divide-y divide-line/60 overflow-y-auto pr-1">
        {users.map((u, i) => <Row key={u.id} user={u} rank={i + 1} />)}
      </ul>
    )}
  </PanelCard>
)

export default TopPerformers
