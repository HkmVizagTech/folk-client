import React from 'react'
import { Building2 } from 'lucide-react'
import { EmptyState } from '../../../components/common'
import { Skeleton } from '../../../components/ui'
import { useReveal } from '../../../hooks/useReveal'
import ListingCard from './ListingCard'

const ListingGrid = ({ listings, loading, canBook, onBook, staff }) => {
  const ref = useReveal({ selector: '[data-card]', stagger: 0.07, deps: [loading, listings.length] })
  if (loading) {
    return <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-[380px] rounded-2xl" />)}</div>
  }
  if (listings.length === 0) {
    return <EmptyState icon={Building2} title="No stays listed right now" description="Please check back soon." />
  }
  return (
    <div ref={ref} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {listings.map((l) => <ListingCard key={l.id} listing={l} canBook={canBook} onBook={onBook} staff={staff} />)}
    </div>
  )
}

export default ListingGrid
