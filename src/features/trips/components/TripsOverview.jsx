import { Bus, CheckCircle2, Compass, MapPin } from 'lucide-react'
import { StatCard } from '../../../components/common'

const ICONS = { Upcoming: Bus, Completed: CheckCircle2, Destinations: Compass, 'Holy places': MapPin }
const TONES = { Upcoming: 'saffron', Completed: 'green', Destinations: 'maroon', 'Holy places': 'gold' }

/** In-app summary row: the same numbers the public hero shows, as KPI tiles. */
const TripsOverview = ({ stats }) => (
  <div className="mb-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
    {stats.map((s) => <StatCard key={s.label} label={s.label} value={s.value} icon={ICONS[s.label]} tone={TONES[s.label]} />)}
  </div>
)

export default TripsOverview
