import React from 'react'
import { Skeleton } from '../../../components/ui'

const SadhanaSkeleton = () => (
  <div className="space-y-4" aria-busy="true" aria-label="Loading your sadhana">
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3"><Skeleton className="h-28" /><Skeleton className="h-28" /><Skeleton className="col-span-2 h-28 sm:col-span-1" /></div>
    <div className="grid gap-4 lg:grid-cols-12"><Skeleton className="h-[440px] lg:col-span-5" /><Skeleton className="h-[440px] lg:col-span-7" /></div>
  </div>
)

export default SadhanaSkeleton
