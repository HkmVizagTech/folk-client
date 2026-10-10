import React from 'react'
import { Trash2, UserCheck, Users } from 'lucide-react'
import { Avatar, Badge, Button, Modal, Skeleton } from '../../../components/ui'
import { EmptyState } from '../../../components/common'
import { statusTone } from '../lib/seva'

const roundBtn = 'inline-flex h-11 w-11 items-center justify-center rounded-xl border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron'

const Row = ({ reg, onMark }) => (
  <li className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-white p-3.5">
    <div className="flex min-w-0 items-center gap-3">
      <Avatar name={reg.userName || 'Devotee'} />
      <div className="min-w-0">
        <p className="user-text truncate font-semibold">{reg.userName || `Devotee ${reg.userId?.substring(0, 5) || '...'}`}</p>
        <Badge tone={statusTone(reg.status)} size="sm" className="mt-1 capitalize">{reg.status}</Badge>
      </div>
    </div>
    <div className="flex shrink-0 gap-2">
      {reg.status === 'registered' && (
        <button type="button" onClick={() => onMark(reg, 'completed')} title="Mark completed" aria-label="Mark attendance completed" className={`${roundBtn} border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700`}><UserCheck size={18} /></button>
      )}
      {reg.status !== 'cancelled' && (
        <button type="button" onClick={() => onMark(reg, 'cancelled')} title="Cancel participation" aria-label="Cancel participation" className={`${roundBtn} border-red-100 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white`}><Trash2 size={16} /></button>
      )}
    </div>
  </li>
)

const VolunteerModal = ({ seva, rows, loading, error, onMark, onRetry, onClose }) => (
  <Modal open={!!seva} onClose={onClose} title="Volunteer roster" description={seva?.title} footer={<Button variant="secondary" onClick={onClose}>Close roster</Button>}>
    {loading ? (
      <div className="space-y-3"><Skeleton className="h-[72px]" /><Skeleton className="h-[72px]" /></div>
    ) : error ? (
      <div role="alert" className="flex flex-col items-center gap-3 py-6 text-center">
        <p className="text-[14px] font-semibold text-red-700">{error}</p>
        <Button variant="dark" size="sm" onClick={onRetry}>Try again</Button>
      </div>
    ) : rows.length === 0 ? (
      <EmptyState icon={Users} title="No volunteers yet" className="py-10" />
    ) : (
      <ul className="space-y-3">{rows.map((r) => <Row key={r.id} reg={r} onMark={onMark} />)}</ul>
    )}
  </Modal>
)

export default VolunteerModal
