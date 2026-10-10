import { formatDateRange } from '../../trips/lib/format'
import BookingPanel from './BookingPanel'
import BookingCta from './BookingCta'

/** Right-hand booking rail (first on mobile): price, facts, seat meter and the action area. */
const BookingRail = ({ trip, pricing, modes, capacity, seatsTaken, seatsLeft, user, registration, blockedReason, onBook, summaryProps, waHref }) => (
  <BookingPanel>
    <BookingPanel.Price pricing={pricing} modes={modes} />
    <BookingPanel.Body>
      <BookingPanel.Facts trip={trip} dateRange={formatDateRange(trip.startDate, trip.endDate)} seatsLeft={seatsLeft} capacity={capacity} />
      <BookingPanel.Capacity taken={seatsTaken} capacity={capacity} full={seatsLeft === 0} />
      <BookingCta
        user={user} registration={registration} blockedReason={blockedReason} modes={modes} advance={pricing.advance}
        onBook={onBook} summaryProps={summaryProps} waHref={waHref}
      />
    </BookingPanel.Body>
  </BookingPanel>
)

export default BookingRail
