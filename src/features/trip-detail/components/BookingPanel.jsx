import { Banknote, Calendar, Clock, CreditCard, MapPin, Users } from 'lucide-react'
import { Badge, Card, ProgressBar } from '../../../components/ui'
import { cn } from '../../../lib/utils'
import { inr } from '../../trips/lib/format'

/**
 * Compound booking card:
 *   <BookingPanel><BookingPanel.Price/><BookingPanel.Body><BookingPanel.Facts/>…</BookingPanel.Body></BookingPanel>
 */
const BookingPanel = ({ className, ...p }) => (
  <Card padded={false} className={cn('user-text-box overflow-hidden rounded-3xl shadow-premium-xl', className)} {...p} />
)

/** The loudest piece of information on the page. */
const Price = ({ pricing, modes }) => {
  const { price, hasOffer, originalPrice, advance } = pricing
  return (
    <div className="border-b border-line/80 bg-gradient-to-br from-paper to-white px-5 py-5 sm:px-7 sm:py-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          {price > 0 ? (
            <>
              <p className="flex flex-wrap items-baseline gap-2">
                <span className="font-display text-[34px] font-semibold leading-none text-ink">{inr(price)}</span>
                {hasOffer && <span className="text-[16px] text-ink-muted line-through">{inr(originalPrice)}</span>}
              </p>
              <p className="mt-1.5 text-[13px] text-ink-muted">per person</p>
            </>
          ) : (
            <>
              <p className="font-display text-[28px] font-semibold leading-none text-emerald-700">By seva</p>
              <p className="mt-1.5 text-[13px] text-ink-muted">No fixed fee</p>
            </>
          )}
        </div>
        {advance > 0 && (
          <div className="shrink-0 text-right">
            <p className="text-[16px] font-semibold text-saffron-dark">{inr(advance)}</p>
            <p className="mt-0.5 text-[12px] text-ink-muted">advance / person</p>
          </div>
        )}
      </div>
      {(modes.onlineAvailable || modes.cashAvailable) && (
        <div className="mt-4 flex flex-wrap gap-2">
          {modes.onlineAvailable && <Badge tone="saffron"><CreditCard size={13} /> Pay online</Badge>}
          {modes.cashAvailable && <Badge tone="success"><Banknote size={13} /> Cash at office</Badge>}
        </div>
      )}
    </div>
  )
}

const Body = ({ className, ...p }) => <div className={cn('space-y-5 p-5 sm:p-7', className)} {...p} />

const Fact = ({ icon: Icon, label, children, tone }) => (
  <div className="user-text-box flex items-start gap-3">
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-paper text-saffron-dark"><Icon size={18} /></span>
    <div className="min-w-0">
      <dt className="text-[12px] font-semibold uppercase tracking-label text-ink-muted">{label}</dt>
      <dd className={cn('user-text text-[15px] font-semibold text-ink', tone)}>{children}</dd>
    </div>
  </div>
)

const Facts = ({ trip, dateRange, seatsLeft, capacity }) => (
  <dl className="space-y-3">
    <Fact icon={Calendar} label="Dates">{dateRange}</Fact>
    {trip.durationLabel && <Fact icon={Clock} label="Duration">{trip.durationLabel}</Fact>}
    {trip.location && <Fact icon={MapPin} label="Destination">{trip.location}</Fact>}
    {trip.eligibility && <Fact icon={Users} label="Who can come">{trip.eligibility}</Fact>}
    {seatsLeft !== null && (
      <Fact icon={Users} label="Seats" tone={seatsLeft === 0 ? 'text-red-600' : undefined}>
        {seatsLeft === 0 ? 'Fully booked' : `${seatsLeft} of ${capacity} left`}
      </Fact>
    )}
  </dl>
)

const Capacity = ({ taken, capacity, full }) => {
  if (capacity <= 0) return null
  return (
    <div className="space-y-1.5">
      <ProgressBar value={taken} max={capacity} tone={full ? 'maroon' : 'saffron'} />
      <p className="text-[13px] text-ink-muted">{taken} of {capacity} booked</p>
    </div>
  )
}

BookingPanel.Price = Price
BookingPanel.Body = Body
BookingPanel.Facts = Facts
BookingPanel.Capacity = Capacity

export default BookingPanel
