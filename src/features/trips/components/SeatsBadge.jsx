import { Users } from 'lucide-react'
import { Badge } from '../../../components/ui'
import { plural } from '../lib/format'

const SeatsBadge = ({ seatsLeft }) => {
  if (typeof seatsLeft !== 'number') {
    return <Badge size="sm" tone="neutral"><Users size={12} /> Open seating</Badge>
  }
  const tone = seatsLeft === 0 ? 'danger' : seatsLeft <= 5 ? 'warning' : 'success'
  return (
    <Badge size="sm" tone={tone}>
      <Users size={12} /> {seatsLeft === 0 ? 'Fully booked' : `${plural(seatsLeft, 'seat')} left`}
    </Badge>
  )
}

export default SeatsBadge
