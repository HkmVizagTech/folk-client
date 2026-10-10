import { useMemo, useState } from 'react'
import { Page } from '../../components/common'
import PublicTopBar from '../trips/components/PublicTopBar'
import YatraStyles from '../trips/components/YatraStyles'
import { waNumber } from '../trips/lib/format'
import { useTripDetailData } from './hooks/useTripDetailData'
import { useBookingForm } from './hooks/useBookingForm'
import { useBookingActions } from './hooks/useBookingActions'
import { useLightbox } from './hooks/useLightbox'
import { buildWhatsappHref, getTripContent, hasNoContent, pickOtherTrips } from './lib/content'
import { buildFaq } from './lib/faq'
import { getBlockedReason, isLive } from './lib/registration'
import DetailSkeleton from './components/DetailSkeleton'
import TripNotFound from './components/TripNotFound'
import TripHero from './components/TripHero'
import NoticeBanner from './components/NoticeBanner'
import BookingRail from './components/BookingRail'
import BookingModal from './components/BookingModal'
import MobileBookBar from './components/MobileBookBar'
import QuickPhoneLogin from './components/QuickPhoneLogin'
import ComingSoon from './components/ComingSoon'
import AboutSection from './components/AboutSection'
import PlacesSection from './components/PlacesSection'
import HighlightsSection from './components/HighlightsSection'
import ItinerarySection from './components/ItinerarySection'
import InclusionsSection from './components/InclusionsSection'
import GallerySection from './components/GallerySection'
import LogisticsSection from './components/LogisticsSection'
import FaqSection from './components/FaqSection'
import ContactBand from './components/ContactBand'
import OtherTrips from './components/OtherTrips'
import Lightbox from './components/Lightbox'

// In-app the shell adds p-4 sm:p-6 md:p-10: cancel exactly that so the hero runs full-bleed.
const BLEED = '-mx-4 -mt-4 sm:-mx-6 sm:-mt-6 md:-mx-10 md:-mt-10'

/** Container: owns data, booking state and handlers; every section below is presentational. */
const TripDetailPage = ({ slug, openTrip, setActiveTab, onLoginClick, isPublicView = false }) => {
  const [cancelledId, setCancelledId] = useState(null)
  const data = useTripDetailData(slug, cancelledId)
  const { user, trip, myRegistration } = data

  const [modalOpen, setModalOpen] = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)
  const [notice, setNotice] = useState(null) // { tone, text }

  const booking = useBookingForm({ trip, user, seatsLeft: data.seatsLeft, modalOpen })
  const actions = useBookingActions({
    trip, slug, user, form: booking.form, pricing: booking.pricing, modes: booking.modes,
    seatsLeft: data.seatsLeft, myRegistration, modalOpen, closeModal: () => setModalOpen(false), setNotice, setCancelledId,
  })

  const content = useMemo(() => (trip ? getTripContent(trip) : null), [trip])
  const lightbox = useLightbox(content?.gallery.length || 0)

  const shell = (children) => (isPublicView
    ? <div className="min-h-screen bg-paper"><PublicTopBar onLoginClick={onLoginClick} />{children}</div>
    : children)
  const goBack = () => setActiveTab?.('trips')

  if (data.tripLoading && !trip) {
    return shell(
      <div className={isPublicView ? '' : BLEED}>
        <span className="sr-only" role="status">Loading yatra…</span>
        <DetailSkeleton />
      </div>,
    )
  }
  if (!trip) return shell(<TripNotFound onBack={goBack} />)

  const { pricing, modes } = booking
  const status = (trip.status || 'upcoming').toLowerCase()
  const blockedReason = getBlockedReason(trip, data.seatsLeft)
  const registrationClosed = trip.registrationOpen === false && status !== 'completed' && status !== 'cancelled'
  const waHref = buildWhatsappHref(waNumber(trip.contactPhone), trip.title)
  const otherTrips = pickOtherTrips(data.allTrips, trip, data.isStaff)
  const startBooking = () => (user ? setModalOpen(true) : setLoginOpen(true))
  const showMobileBar = isPublicView && !blockedReason && !isLive(myRegistration)

  const summaryProps = {
    trip, payment: data.myPayment, isPaid: data.isPaid, isCashRegistration: data.isCashRegistration,
    isCashCollected: data.isCashCollected, isSettled: data.isSettled, onlineAvailable: modes.onlineAvailable,
    price: pricing.price, blockedReason,
    payingExisting: actions.payingExisting, onPayExisting: actions.payExisting,
    onBookMore: () => setModalOpen(true),
    cancelling: actions.cancelling, onCancel: actions.cancelRegistration,
  }

  const page = (
    <Page width="max-w-none" className={isPublicView ? '' : BLEED} revealKey={trip.id}>
      <YatraStyles />
      <TripHero
        trip={trip} status={status} pricing={pricing} placeCount={content.locations.length}
        registrationClosed={registrationClosed} onBack={goBack}
      />

      <div className="bg-paper">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
          <NoticeBanner notice={notice} onDismiss={() => setNotice(null)} />

          <div className="user-text-box grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-10">
            <aside data-reveal className="min-w-0 lg:order-2">
              <div className="lg:sticky lg:top-6">
                <BookingRail
                  trip={trip} pricing={pricing} modes={modes} capacity={data.capacity} seatsTaken={data.seatsTaken} seatsLeft={data.seatsLeft}
                  user={user} registration={myRegistration} blockedReason={blockedReason}
                  onBook={startBooking} summaryProps={summaryProps} waHref={waHref}
                />
              </div>
            </aside>

            <div className="min-w-0 space-y-6 sm:space-y-10 lg:order-1 lg:col-span-2">
              {hasNoContent(trip, content) && <ComingSoon />}
              {trip.description && <AboutSection description={trip.description} />}
              <PlacesSection locations={content.locations} tripTitle={trip.title} />
              {content.highlights.length > 0 && <HighlightsSection highlights={content.highlights} />}
              {content.itinerary.length > 0 && <ItinerarySection itinerary={content.itinerary} />}
              {(content.inclusions.length > 0 || content.exclusions.length > 0) && (
                <InclusionsSection inclusions={content.inclusions} exclusions={content.exclusions} />
              )}
              {content.gallery.length > 0 && <GallerySection trip={trip} images={content.gallery} onOpen={lightbox.open} />}
              {(trip.meetingPoint || trip.startDate) && <LogisticsSection trip={trip} />}
              <FaqSection items={buildFaq(trip, { pricing, modes })} />
              <ContactBand contactPhone={trip.contactPhone} waHref={waHref} />
              <OtherTrips trips={otherTrips} onOpen={openTrip} />
            </div>
          </div>
        </div>
      </div>

      {showMobileBar && <MobileBookBar user={user} pricing={pricing} modes={modes} onBook={startBooking} />}

      {user && (
        <BookingModal
          open={modalOpen} onClose={() => setModalOpen(false)} trip={trip}
          form={booking.form} onField={booking.setField} onAdjustSeats={booking.adjustSeats} seatsLeft={data.seatsLeft}
          pricing={pricing} modes={modes} razorpayReady={booking.razorpayReady}
          payMethod={booking.payMethod} onPayMethod={booking.setPayMethod}
          submitting={actions.submitting} formError={actions.formError} onSubmit={actions.register}
        />
      )}
      <Lightbox images={content.gallery} index={lightbox.index} title={trip.title} onClose={lightbox.close} onStep={lightbox.step} />
    </Page>
  )

  return shell(
    <>
      {page}
      <QuickPhoneLogin open={loginOpen} onClose={() => setLoginOpen(false)} onSignedIn={() => setModalOpen(true)} tripTitle={trip.title} />
    </>,
  )
}

export default TripDetailPage
