import React from 'react'
import { Skeleton } from '../../../components/ui'

const EventsSkeleton = () => (
  <div className="grid gap-6" aria-busy="true" aria-label="Loading events">
    <Skeleton className="h-[420px] rounded-2xl" />
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {[0, 1, 2].map((i) => <Skeleton key={i} className="h-[380px] rounded-2xl" />)}
    </div>
  </div>
)

export default EventsSkeleton
