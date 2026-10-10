import { Card, Skeleton } from '../../../components/ui'

/** Mirrors the real layout (hero height, rail, tall places section) so nothing lurches on load. */
const DetailSkeleton = () => (
  <div aria-hidden="true">
    <Skeleton className="h-[60svh] w-full rounded-none bg-navy-900/90 sm:h-[64svh]" />
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-10">
        <Card className="space-y-4 lg:order-2">
          <Skeleton className="h-9 w-36" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-[52px] w-full rounded-full" />
        </Card>
        <div className="space-y-6 lg:order-1 lg:col-span-2">
          <Card className="space-y-3 sm:p-8">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-7 w-2/5" />
            <Skeleton className="mt-4 h-4 w-full" />
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="h-4 w-4/5" />
          </Card>
          {[0, 1].map((i) => (
            <Card key={i} padded={false} className="grid grid-cols-1 overflow-hidden lg:grid-cols-12">
              <Skeleton className="aspect-[16/10] rounded-none lg:col-span-7 lg:aspect-auto lg:min-h-[280px]" />
              <div className="space-y-3 p-6 lg:col-span-5">
                <Skeleton className="h-3 w-10" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  </div>
)

export default DetailSkeleton
