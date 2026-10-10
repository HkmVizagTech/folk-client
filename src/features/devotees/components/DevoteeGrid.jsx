import React from 'react'
import { Users } from 'lucide-react'
import { Skeleton } from '../../../components/ui'
import { EmptyState } from '../../../components/common'
import DevoteeCard from './DevoteeCard'

const DevoteeGrid = ({ devotees, loading, canDelete, onQr, onEdit, onDelete }) => {
  if (loading) {
    return <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-48 rounded-2xl" />)}</div>
  }
  if (!devotees.length) return <EmptyState icon={Users} title="No devotees found" description="Try adjusting your search or filters." />
  return (
    <ul data-reveal className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {devotees.map((d) => (
        <li key={d.id}>
          <DevoteeCard devotee={d} canDelete={canDelete} onQr={() => onQr(d)} onEdit={() => onEdit(d)} onDelete={() => onDelete(d.id)} />
        </li>
      ))}
    </ul>
  )
}

export default DevoteeGrid
