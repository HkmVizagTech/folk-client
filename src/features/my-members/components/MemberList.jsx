import React from 'react'
import { PartyPopper, Users } from 'lucide-react'
import { Skeleton } from '../../../components/ui'
import { EmptyState } from '../../../components/common'
import MemberCard from './MemberCard'

const MemberList = ({ rows, shown, loading, view, onLog, onHistory }) => {
  if (loading) return <div className="grid gap-4 lg:grid-cols-2">{[0, 1].map((i) => <Skeleton key={i} className="h-72 rounded-2xl" />)}</div>
  if (shown.length === 0) {
    return rows.length === 0
      ? <EmptyState icon={Users} title="No members assigned yet" description="An admin assigns members to you from the Members page." />
      : <EmptyState icon={PartyPopper} title="Everyone is doing well" description="Nobody needs a follow-up right now." />
  }
  return (
    <ul data-reveal className="grid gap-4 lg:grid-cols-2">
      {shown.map((m) => (
        <li key={m.id}><MemberCard member={m} showReasons={view === 'attention'} onLog={() => onLog(m)} onHistory={() => onHistory(m)} /></li>
      ))}
    </ul>
  )
}

export default MemberList
