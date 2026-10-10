import { ArrowRight, Bus, Image as ImageIcon, Search, X } from 'lucide-react'
import { Button } from '../../../components/ui'
import { EmptyState } from '../../../components/common'
import { useStagger } from '../hooks/useStagger'
import TripCard from './TripCard'
import TripCardSkeleton from './TripCardSkeleton'

const GRID = 'grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 xl:grid-cols-3'

const Empty = ({ tab, isFiltering, onClear, onTab, hasUpcoming, hasCompleted }) => {
  if (isFiltering) {
    return (
      <EmptyState icon={Search} title="No trips match your search" description="Try a different destination, or clear the filters to see everything on offer."
        action={<Button variant="dark" onClick={onClear}><X size={15} /> Clear filters</Button>} />
    )
  }
  if (tab === 'upcoming') {
    return (
      <EmptyState icon={Bus} title="No yatras announced yet" description="The next pilgrimage is being planned. Check back soon: the crew announces dates here first."
        action={hasCompleted && <Button variant="dark" onClick={() => onTab('completed')}>Look back at past yatras <ArrowRight size={15} /></Button>} />
    )
  }
  return (
    <EmptyState icon={ImageIcon} title="No completed trips yet" description="Once a yatra wraps up it moves here, so you can look back at where the crew has been."
      action={hasUpcoming && <Button variant="dark" onClick={() => onTab('upcoming')}>See what&apos;s coming up <ArrowRight size={15} /></Button>} />
  )
}

/** Loading, empty and populated states of the trip list. */
const TripsGrid = ({ loading, trips, tab, onTab, isFiltering, onClear, seatsLeftFor, onOpen, hasUpcoming, hasCompleted }) => {
  const gridRef = useStagger(`${tab}-${trips.length}-${isFiltering}`)

  if (loading) {
    return (
      <div className={GRID}>
        {[0, 1, 2, 3, 4, 5].map((i) => <TripCardSkeleton key={i} />)}
        <span className="sr-only" role="status">Loading trips…</span>
      </div>
    )
  }
  if (trips.length === 0) {
    return <Empty tab={tab} isFiltering={isFiltering} onClear={onClear} onTab={onTab} hasUpcoming={hasUpcoming} hasCompleted={hasCompleted} />
  }
  return (
    <div ref={gridRef} className={GRID}>
      {trips.map((trip) => (
        <TripCard key={trip.id} trip={trip} seatsLeft={tab === 'upcoming' ? seatsLeftFor(trip) : null} onOpen={onOpen} />
      ))}
    </div>
  )
}

export default TripsGrid
