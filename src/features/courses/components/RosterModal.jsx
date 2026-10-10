import React from 'react'
import { CheckCircle2, Minus, Plus, Users } from 'lucide-react'
import { Avatar, Modal, Skeleton } from '../../../components/ui'
import { EmptyState } from '../../../components/common'
import { useRoster } from '../hooks/useRoster'
import SessionProgress from './SessionProgress'

const stepBtn = 'inline-flex h-11 w-11 items-center justify-center rounded-xl border border-line bg-white text-ink-muted hover:bg-paper hover:text-ink active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron'

const Roster = ({ course }) => {
  const { rows, loading, bump, error, total } = useRoster(course)
  if (loading) return <div className="space-y-3"><Skeleton className="h-16" /><Skeleton className="h-16" /></div>
  if (!rows.length) return <EmptyState icon={Users} title="Nobody has enrolled yet" className="py-10" />
  return (
    <>
      {error && <p role="alert" className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-[14px] text-red-700">{error}</p>}
      <ul className="divide-y divide-line">
        {rows.map((e) => (
          <li key={e.id} className="flex items-center gap-3 py-3">
            <Avatar name={e.userName} size="md" />
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 truncate font-semibold">{e.userName || 'Member'} {e.attended >= total && <CheckCircle2 size={16} className="shrink-0 text-emerald-600" aria-label="Completed" />}</p>
              <SessionProgress done={e.attended} total={total} className="mt-1" />
            </div>
            <div className="flex gap-1.5">
              <button type="button" onClick={() => bump(e, -1)} aria-label="One session less" className={stepBtn}><Minus size={16} /></button>
              <button type="button" onClick={() => bump(e, 1)} aria-label="Mark a session attended" className={stepBtn}><Plus size={16} /></button>
            </div>
          </li>
        ))}
      </ul>
    </>
  )
}

const RosterModal = ({ course, onClose }) => (
  <Modal open={!!course} onClose={onClose} title={course ? `${course.title} · participants` : ''} size="lg">
    {course && <Roster course={course} />}
  </Modal>
)

export default RosterModal
