import { MapPin } from 'lucide-react'
import { formatLong } from '../../trips/lib/format'
import DetailSection from './DetailSection'

const Tile = ({ label, children }) => (
  <div className="min-w-0 rounded-2xl border border-line/80 bg-paper p-4 sm:p-5">
    <p className="text-[12px] font-semibold uppercase tracking-label text-ink-muted">{label}</p>
    <p className="user-text mt-2 text-[15px] font-semibold leading-relaxed text-ink">{children}</p>
  </div>
)

const LogisticsSection = ({ trip }) => (
  <DetailSection icon={MapPin} kicker="Logistics" title="Where we meet">
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Tile label="Meeting point">{trip.meetingPoint || 'Shared with confirmed travellers.'}</Tile>
      <Tile label="Departure & return">{formatLong(trip.startDate)} &rarr; {formatLong(trip.endDate)}</Tile>
    </div>
  </DetailSection>
)

export default LogisticsSection
