import React from 'react'
import { Inbox } from 'lucide-react'
import { EmptyState } from '../../../components/common'
import { useReveal } from '../../../hooks/useReveal'
import RequestCard from './RequestCard'

const RequestList = ({ requests, role, actingId, onAction }) => {
  const ref = useReveal({ selector: '[data-card]', y: 12, stagger: 0.05, deps: [requests.length] })
  if (requests.length === 0) {
    return <EmptyState icon={Inbox} title="No requests yet" description="Requests will appear here once submitted." className="py-10" />
  }
  return (
    <div ref={ref} className="grid max-h-[520px] gap-3 overflow-y-auto pr-1">
      {requests.map((r) => (
        <RequestCard key={r.id} request={r} role={role} acting={actingId === r.id} onAction={onAction} />
      ))}
    </div>
  )
}

export default RequestList
