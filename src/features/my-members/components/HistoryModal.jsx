import React, { useMemo } from 'react'
import { Modal, Skeleton } from '../../../components/ui'
import { EmptyState } from '../../../components/common'
import { NotebookPen } from 'lucide-react'
import { where } from '../../../lib/pgstore'
import { useFirestore } from '../../../hooks/useFirestore'
import { formatDay, toDate } from '../../../lib/dates'
import { dayFromKey } from '../lib/memberMetrics'

const Timeline = ({ memberId }) => {
  const q = useMemo(() => [where('memberId', '==', memberId)], [memberId])
  const { data, loading } = useFirestore('followups', q)
  const items = useMemo(() => data.slice().sort((a, b) => (toDate(b.createdAt)?.getTime() || 0) - (toDate(a.createdAt)?.getTime() || 0)), [data])

  if (loading) return <Skeleton className="h-24" />
  if (!items.length) return <EmptyState icon={NotebookPen} title="No follow-ups yet" description="Logged conversations will show up here." className="py-8" />
  return (
    <ol className="space-y-5">
      {items.map((f) => (
        <li key={f.id} className="relative border-l-2 border-marigold/40 pl-5">
          <span className="absolute -left-[7px] top-1 h-3 w-3 rounded-full border-2 border-white bg-marigold" aria-hidden="true" />
          <p className="text-[13px] text-ink-muted">{formatDay(toDate(f.createdAt))} · {f.channel} · {f.guideName || 'Team'}</p>
          <p className="mt-1 text-ink user-text">{f.note}</p>
          {f.nextDate && <p className="mt-1 text-[13px] text-ink-muted">Next follow-up: {formatDay(dayFromKey(f.nextDate))}</p>}
        </li>
      ))}
    </ol>
  )
}

const HistoryModal = ({ member, onClose }) => (
  <Modal open={!!member} onClose={onClose} title={`History · ${member?.displayName || ''}`}>
    {member && <Timeline memberId={member.id} />}
  </Modal>
)

export default HistoryModal
