import { Skeleton } from '../../../components/ui'

/** Card-shaped placeholder so the grid reads as filling in, not stalling. */
const TripCardSkeleton = () => (
  <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-line/80 bg-white shadow-card" aria-hidden="true">
    <Skeleton className="aspect-[16/10] w-full rounded-none" />
    <div className="flex flex-1 flex-col gap-4 p-5">
      <Skeleton className="h-5 w-4/5" />
      <Skeleton className="h-4 w-3/5" />
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-20" />
        <Skeleton className="h-4 flex-1" />
      </div>
      <div className="mt-auto flex items-end justify-between border-t border-line/80 pt-4">
        <div className="space-y-2"><Skeleton className="h-6 w-24" /><Skeleton className="h-6 w-20" /></div>
        <Skeleton className="h-11 w-11 rounded-full" />
      </div>
    </div>
  </div>
)

export default TripCardSkeleton
