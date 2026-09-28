import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MapPin, Calendar, Clock, Users, ArrowLeft, ArrowRight, Check, X, Plus, Minus,
  Loader2, Compass, Ticket, Phone, MessageCircle, ShieldCheck, CreditCard,
  CheckCircle2, XCircle, AlertTriangle, Ban, Clock3, Sparkles, Info, Camera,
  Map as MapIcon, Bus
} from 'lucide-react'
import { collection, addDoc, updateDoc, doc, serverTimestamp, where } from 'firebase/firestore'
import { db, auth } from '../lib/firebase'
import { useFirestore } from '../hooks/useFirestore'
import { useAuth } from '../hooks/useAuth'
import { callApi } from '../lib/api'
import { initializeRazorpay } from '../lib/razorpay'
import { CONFIG } from '../config'

/* ------------------------------------------------------------------ *
 * Local helpers (kept in-file — Trips.jsx / TripDetail.jsx are the only
 * two files this feature owns).
 * ------------------------------------------------------------------ */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

const todayISO = () => {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

const parseISO = (iso) => {
  if (!iso || typeof iso !== 'string') return null
  const parts = iso.split('-')
  if (parts.length !== 3) return null
  const [y, m, d] = parts.map((p) => parseInt(p, 10))
  if (!y || !m || !d) return null
  return { y, m, d }
}

const formatLong = (iso) => {
  const p = parseISO(iso)
  return p ? `${p.d} ${MONTHS_LONG[p.m - 1]} ${p.y}` : '—'
}

const formatDateRange = (start, end) => {
  const s = parseISO(start)
  const e = parseISO(end)
  if (!s && !e) return 'Dates to be announced'
  if (!e) return `${s.d} ${MONTHS[s.m - 1]} ${s.y}`
  if (!s) return `${e.d} ${MONTHS[e.m - 1]} ${e.y}`
  if (s.y === e.y && s.m === e.m) return `${s.d} – ${e.d} ${MONTHS[e.m - 1]} ${e.y}`
  if (s.y === e.y) return `${s.d} ${MONTHS[s.m - 1]} – ${e.d} ${MONTHS[e.m - 1]} ${e.y}`
  return `${s.d} ${MONTHS[s.m - 1]} ${s.y} – ${e.d} ${MONTHS[e.m - 1]} ${e.y}`
}

const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`

const statusLabel = (status) => {
  switch ((status || '').toLowerCase()) {
    case 'ongoing': return 'Happening now'
    case 'completed': return 'Completed'
    case 'cancelled': return 'Cancelled'
    case 'draft': return 'Draft'
    default: return 'Upcoming'
  }
}

const STATUS_PILL = {
  upcoming: 'bg-saffron text-white',
  ongoing: 'bg-emerald-500 text-white',
  completed: 'bg-white/15 text-white border border-white/25',
  cancelled: 'bg-red-500 text-white',
  draft: 'bg-gray-500 text-white',
}

const REG_STATUS = {
  pending: { label: 'Pending confirmation', cls: 'text-saffron-dark bg-saffron/10 border-saffron/20', icon: <Clock3 size={13} /> },
  confirmed: { label: 'Confirmed', cls: 'text-green-600 bg-green-100 border-green-200', icon: <CheckCircle2 size={13} /> },
  waitlisted: { label: 'Waitlisted', cls: 'text-blue-600 bg-blue-100 border-blue-200', icon: <Users size={13} /> },
  cancelled: { label: 'Cancelled', cls: 'text-gray-500 bg-gray-100 border-gray-200', icon: <Ban size={13} /> },
}

/** +91 normalisation so a bare 10-digit number still opens WhatsApp. */
const waNumber = (phone) => {
  const digits = String(phone || '').replace(/\D/g, '')
  if (!digits) return null
  if (digits.length === 10) return `91${digits}`
  return digits.replace(/^0+/, '')
}

const razorpayConfigured = () => {
  const key = CONFIG.RAZORPAY_KEY
  return !!key && !key.includes('your_key_here') && key.trim().length > 8
}

/* ------------------------------------------------------------------ */

const PublicTopBar = ({ onLoginClick }) => (
  <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-xl border-b border-saffron/10">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="h-16 sm:h-[70px] flex items-center justify-between gap-3">
        <a href="/" className="shrink-0 flex items-center gap-3" aria-label="FOLK Vizag — home">
          <span className="w-11 h-11 rounded-2xl bg-white flex items-center justify-center shadow-premium ring-1 ring-black/5 overflow-hidden">
            <img src="/logo.png" alt="Folk Vizag logo" className="h-8 w-8 object-contain" />
          </span>
          <span className="leading-tight">
            <span className="block text-[14px] sm:text-[15px] font-black tracking-tight text-gray-900">FOLK Vizag</span>
            <span className="block text-[9px] font-bold uppercase tracking-[0.18em] text-gray-400">Hare Krishna Movement</span>
          </span>
        </a>
        <button
          type="button"
          onClick={() => onLoginClick && onLoginClick()}
          className="min-h-[44px] px-5 sm:px-7 rounded-full bg-gray-900 text-white text-sm font-bold hover:bg-saffron transition-colors whitespace-nowrap"
        >
          Sign in
        </button>
      </div>
    </div>
  </header>
)

const SectionHeading = ({ icon, eyebrow, title }) => (
  <div className="mb-6">
    <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-saffron-dark">
      {icon} {eyebrow}
    </span>
    <h2 className="mt-2 text-xl sm:text-2xl font-black text-gray-900 tracking-tight">{title}</h2>
  </div>
)

/* ------------------------------------------------------------------ */

const TripDetail = ({ slug, openTrip, setActiveTab, onLoginClick, isPublicView = false }) => {
  const { user } = useAuth()

  /* ---------------- Data ---------------- */
  const tripQuery = React.useMemo(() => [where('slug', '==', slug || '__none__')], [slug])
  const { data: tripMatches, loading: tripLoading } = useFirestore('trips', tripQuery)

  const allTripsQuery = React.useMemo(() => [], [])
  const { data: allTrips } = useFirestore('trips', allTripsQuery)

  const trip = (tripMatches || [])[0] || null
  const isStaff = user?.role === 'admin' || user?.role === 'folks_head'

  // Staff can read every registration for this trip (real seat counts);
  // everyone else is scoped to their own, mirroring Hostels.jsx.
  const registrationsQuery = React.useMemo(() => {
    if (isStaff && trip?.id) return [where('tripId', '==', trip.id)]
    return [where('userId', '==', user?.uid || 'guest')]
  }, [isStaff, trip?.id, user?.uid])
  const { data: registrations } = useFirestore('trip_registrations', registrationsQuery)

  // Payment truth lives in `payments`, written only by the server webhook.
  const paymentsQuery = React.useMemo(() => [where('userId', '==', user?.uid || 'guest')], [user?.uid])
  const { data: payments } = useFirestore('payments', paymentsQuery)

  /* ---------------- Derived ---------------- */
  const tripRegistrations = React.useMemo(
    () => (registrations || []).filter((r) => trip?.id && r.tripId === trip.id),
    [registrations, trip?.id]
  )

  const seatsTaken = React.useMemo(
    () => tripRegistrations
      .filter((r) => ['pending', 'confirmed'].includes((r.status || '').toLowerCase()))
      .reduce((sum, r) => sum + (parseInt(r.seats, 10) || 1), 0),
    [tripRegistrations]
  )

  const capacity = parseInt(trip?.capacity, 10) || 0
  const seatsLeft = capacity > 0 ? Math.max(0, capacity - seatsTaken) : null

  /** The signed-in user's live registration — a cancelled one never blocks re-registering. */
  const myRegistration = React.useMemo(() => {
    if (!user?.uid) return null
    const mine = tripRegistrations.filter((r) => r.userId === user.uid)
    return mine.find((r) => (r.status || '').toLowerCase() !== 'cancelled') || mine[0] || null
  }, [tripRegistrations, user?.uid])

  /**
   * Resolve whether money actually arrived: match the registration's
   * paymentOrderId against the payments collection (the doc is keyed by the
   * Razorpay order id). It counts as paid only when the webhook has marked it
   * completed AND verified — the client can never assert this itself.
   */
  const myPayment = React.useMemo(() => {
    const orderId = myRegistration?.paymentOrderId
    if (!orderId) return null
    return (payments || []).find(
      (p) => p.id === orderId || p.orderId === orderId || p.razorpayOrderId === orderId
    ) || null
  }, [payments, myRegistration?.paymentOrderId])

  const isPaid = !!myPayment
    && String(myPayment.status || '').toLowerCase() === 'completed'
    && myPayment.verified === true

  /* ---------------- Registration modal ---------------- */
  const emptyForm = { seats: 1, travellerNotes: '', emergencyContact: '', phone: '', email: '' }
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(null) // 'pay' | 'later' | null
  const [formError, setFormError] = useState('')
  const [notice, setNotice] = useState(null) // { tone, text }
  const [cancelling, setCancelling] = useState(false)
  const [lightbox, setLightbox] = useState(null)

  useEffect(() => {
    if (!modalOpen) return
    setForm({
      seats: 1,
      travellerNotes: '',
      emergencyContact: '',
      phone: user?.phone || user?.mobile || auth.currentUser?.phoneNumber || '',
      email: user?.email || auth.currentUser?.email || '',
    })
    setFormError('')
  }, [modalOpen, user?.phone, user?.mobile, user?.email])

  const price = Number(trip?.price) || 0
  const advance = Number(trip?.advanceAmount) || 0
  const seats = Math.min(20, Math.max(1, parseInt(form.seats, 10) || 1))
  const total = price * seats
  const payNow = advance > 0 ? Math.min(advance * seats, total || advance * seats) : total
  const balance = Math.max(0, total - payNow)

  const tripStatus = (trip?.status || 'upcoming').toLowerCase()

  const blockedReason = !trip
    ? null
    : tripStatus === 'cancelled'
      ? 'This yatra has been cancelled. Please get in touch for alternatives.'
      : tripStatus === 'completed'
        ? 'This yatra has already taken place. Browse the upcoming journeys instead.'
        : trip.registrationOpen === false
          ? 'Registrations are closed for this yatra right now. Contact the team to be told when they reopen.'
          : seatsLeft === 0
            ? 'Every seat is booked. Message the yatra team to be added to the waitlist.'
            : null

  const maxSelectableSeats = Math.min(20, seatsLeft && seatsLeft > 0 ? seatsLeft : 20)

  const adjustSeats = (delta) => {
    setForm((prev) => {
      const next = (parseInt(prev.seats, 10) || 1) + delta
      return { ...prev, seats: Math.min(maxSelectableSeats, Math.max(1, next)) }
    })
  }

  const createRegistration = async () => {
    // Shape matched to the deployed rules: userId === uid, status 'pending',
    // seats an int between 1 and 20.
    return addDoc(collection(db, 'trip_registrations'), {
      tripId: trip.id,
      tripSlug: trip.slug || slug || '',
      tripTitle: trip.title || '',
      userId: user.uid,
      userName: user.fullName || user.name || auth.currentUser?.displayName || 'Devotee',
      userPhone: (form.phone || '').trim(),
      userEmail: (form.email || '').trim(),
      seats,
      travellerNotes: (form.travellerNotes || '').trim(),
      emergencyContact: (form.emergencyContact || '').trim(),
      amountDue: total,
      paymentOrderId: null,
      status: 'pending',
      staffNotes: '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  }

  const handleRegister = async (mode) => {
    if (!user || !trip || submitting) return
    if (seats < 1 || seats > 20) {
      setFormError('You can book between 1 and 20 seats in one registration.')
      return
    }
    if (seatsLeft !== null && seats > seatsLeft) {
      setFormError(`Only ${seatsLeft} seat${seatsLeft === 1 ? '' : 's'} left on this yatra.`)
      return
    }
    setFormError('')
    setSubmitting(mode)

    let regRef = null
    try {
      regRef = await createRegistration()

      if (mode === 'later') {
        setModalOpen(false)
        setNotice({
          tone: 'success',
          text: 'Seat reserved. The yatra team will confirm and collect the payment — you can pay online any time from this page.',
        })
        return
      }

      // --- Online payment -------------------------------------------------
      const order = await callApi('createOrder', { amount: payNow, eventId: trip.id })
      if (!order || !order.id) throw new Error('The payment order could not be created. Please try again.')

      // Persist the pointer BEFORE checkout opens, so it survives the user
      // closing the modal. Rules allow only these two fields here.
      await updateDoc(regRef, { paymentOrderId: order.id, updatedAt: serverTimestamp() })

      const loaded = await initializeRazorpay()
      if (!loaded || !window.Razorpay) throw new Error('Razorpay checkout could not load. Check your connection and try again.')

      const rzp = new window.Razorpay({
        key: CONFIG.RAZORPAY_KEY,
        amount: order.amount,
        currency: order.currency,
        name: 'FOLK Vizag',
        description: `${trip.title || 'Yatra'} — ${seats} seat${seats === 1 ? '' : 's'}`,
        order_id: order.id,
        image: '/logo.png',
        handler: function () {
          // Nothing is written to Firestore here: the server webhook is the
          // single source of truth for whether the money actually arrived.
          setNotice({
            tone: 'success',
            text: 'Payment submitted. Once our server confirms it, this page will show your seat as paid.',
          })
        },
        prefill: {
          name: user.fullName || user.name || auth.currentUser?.displayName || '',
          email: (form.email || '').trim(),
          contact: (form.phone || '').trim(),
        },
        theme: { color: '#FF9933' },
        modal: {
          ondismiss: function () {
            setSubmitting(null)
          },
        },
      })

      setModalOpen(false)
      rzp.open()
    } catch (error) {
      console.error('Trip registration error:', error)
      if (regRef) {
        setModalOpen(false)
        setNotice({
          tone: 'warn',
          text: `Your seat is reserved, but the payment could not start: ${error.message} You can pay from this page later.`,
        })
      } else {
        setFormError(error.message || 'Something went wrong. Please try again.')
      }
    } finally {
      setSubmitting(null)
    }
  }

  const handleCancel = async () => {
    if (!myRegistration || cancelling) return
    setCancelling(true)
    try {
      // Rules allow exactly these two fields, and only from 'pending'.
      await updateDoc(doc(db, 'trip_registrations', myRegistration.id), {
        status: 'cancelled',
        updatedAt: serverTimestamp(),
      })
      setNotice({ tone: 'info', text: 'Your registration has been cancelled.' })
    } catch (error) {
      console.error('Error cancelling registration:', error)
      setNotice({ tone: 'warn', text: `Could not cancel: ${error.message}` })
    } finally {
      setCancelling(false)
    }
  }

  /* ---------------- Loading / not found ---------------- */
  const shell = (children) => {
    if (isPublicView) {
      return (
        <div className="min-h-screen bg-cream">
          <PublicTopBar onLoginClick={onLoginClick} />
          {children}
        </div>
      )
    }
    return children
  }

  if (tripLoading && !trip) {
    return shell(
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-saffron" size={40} />
        <p className="text-xs font-black uppercase tracking-[0.18em] text-gray-400">Loading yatra…</p>
      </div>
    )
  }

  if (!trip) {
    return shell(
      <div className="min-h-[60vh] flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full text-center bg-white rounded-[2rem] shadow-premium border border-saffron/10 p-8 sm:p-12">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-saffron/10 text-saffron flex items-center justify-center mb-6">
            <Compass size={28} />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">This yatra isn&apos;t here</h1>
          <p className="mt-3 text-sm text-gray-500 font-medium leading-relaxed">
            The trip you&apos;re looking for doesn&apos;t exist, or it may have been removed.
            Have a look at what&apos;s coming up instead.
          </p>
          <button
            type="button"
            onClick={() => setActiveTab && setActiveTab('trips')}
            className="mt-7 w-full min-h-[48px] rounded-2xl bg-gray-900 text-white font-black uppercase tracking-[0.16em] text-[11px] hover:bg-saffron transition-colors inline-flex items-center justify-center gap-2"
          >
            <ArrowLeft size={16} /> All trips &amp; yatras
          </button>
        </div>
      </div>
    )
  }

  /* ---------------- Content pieces ---------------- */
  const highlights = Array.isArray(trip.highlights) ? trip.highlights.filter(Boolean) : []
  const inclusions = Array.isArray(trip.inclusions) ? trip.inclusions.filter(Boolean) : []
  const exclusions = Array.isArray(trip.exclusions) ? trip.exclusions.filter(Boolean) : []
  const gallery = Array.isArray(trip.gallery) ? trip.gallery.filter(Boolean).slice(0, 3) : []
  const itinerary = (Array.isArray(trip.itinerary) ? trip.itinerary.filter(Boolean) : [])
    .slice()
    .sort((a, b) => (Number(a.day) || 0) - (Number(b.day) || 0))

  const wa = waNumber(trip.contactPhone)
  const waHref = wa
    ? `https://wa.me/${wa}?text=${encodeURIComponent(`Hare Krishna! I have a question about the ${trip.title || 'yatra'}.`)}`
    : null

  const today = todayISO()
  const otherTrips = (allTrips || [])
    .filter((t) => t.id !== trip.id)
    .filter((t) => (isStaff || (t.status || '').toLowerCase() !== 'draft'))
    .filter((t) => {
      const s = (t.status || '').toLowerCase()
      if (s === 'completed' || s === 'cancelled') return false
      return !t.endDate || t.endDate >= today
    })
    .sort((a, b) => (a.startDate || '9999-99-99').localeCompare(b.startDate || '9999-99-99'))
    .slice(0, 3)

  const regMeta = REG_STATUS[(myRegistration?.status || '').toLowerCase()] || REG_STATUS.pending

  /* ---------------- Booking panel (shared by desktop rail + mobile) --- */
  const bookingPanel = (
    <div className="bg-white rounded-[1.75rem] sm:rounded-[2rem] shadow-premium-xl border border-saffron/10 overflow-hidden">
      <div className="p-6 sm:p-7 space-y-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            {price > 0 ? (
              <>
                <p className="text-3xl font-black text-gray-900 tracking-tight leading-none">{inr(price)}</p>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.14em] mt-1.5">Per person</p>
              </>
            ) : (
              <>
                <p className="text-2xl font-black text-emerald-600 tracking-tight leading-none">By seva</p>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.14em] mt-1.5">No fixed fee</p>
              </>
            )}
          </div>
          {advance > 0 && (
            <div className="text-right">
              <p className="text-sm font-black text-saffron-dark tracking-tight">{inr(advance)}</p>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.14em] mt-1">Advance / person</p>
            </div>
          )}
        </div>

        <div className="space-y-2.5 pt-1">
          <div className="flex items-start gap-3">
            <span className="w-9 h-9 shrink-0 rounded-xl bg-cream/70 text-saffron flex items-center justify-center"><Calendar size={16} /></span>
            <div className="min-w-0">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.14em]">Dates</p>
              <p className="text-sm font-bold text-gray-800 truncate">{formatDateRange(trip.startDate, trip.endDate)}</p>
            </div>
          </div>
          {trip.durationLabel && (
            <div className="flex items-start gap-3">
              <span className="w-9 h-9 shrink-0 rounded-xl bg-cream/70 text-saffron flex items-center justify-center"><Clock size={16} /></span>
              <div className="min-w-0">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.14em]">Duration</p>
                <p className="text-sm font-bold text-gray-800 truncate">{trip.durationLabel}</p>
              </div>
            </div>
          )}
          {seatsLeft !== null && (
            <div className="flex items-start gap-3">
              <span className="w-9 h-9 shrink-0 rounded-xl bg-cream/70 text-saffron flex items-center justify-center"><Users size={16} /></span>
              <div className="min-w-0">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.14em]">Seats</p>
                <p className={`text-sm font-bold truncate ${seatsLeft === 0 ? 'text-red-500' : 'text-gray-800'}`}>
                  {seatsLeft === 0 ? 'Fully booked' : `${seatsLeft} of ${capacity} left`}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Capacity bar */}
        {capacity > 0 && (
          <div className="pt-1">
            <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-saffron to-gold-dark transition-all duration-500"
                style={{ width: `${Math.min(100, Math.round((seatsTaken / capacity) * 100))}%` }}
              />
            </div>
          </div>
        )}

        {/* --------- The CTA area --------- */}
        <div className="pt-1 space-y-3">
          {!user ? (
            <>
              <button
                type="button"
                onClick={() => onLoginClick && onLoginClick()}
                className="w-full min-h-[52px] rounded-2xl bg-gradient-to-r from-saffron to-gold-dark text-white font-black uppercase tracking-[0.14em] text-[11px] shadow-lg shadow-saffron/25 hover:brightness-105 transition-all inline-flex items-center justify-center gap-2"
              >
                <Ticket size={16} /> Sign in to register
              </button>
              <p className="text-[11px] text-gray-400 font-medium text-center leading-relaxed">
                A free FOLK account keeps your seat, receipts and trip updates in one place.
              </p>
            </>
          ) : myRegistration && (myRegistration.status || '').toLowerCase() !== 'cancelled' ? (
            <div className="space-y-3">
              <div className={`rounded-2xl border p-4 ${regMeta.cls}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.14em]">
                    {regMeta.icon} {regMeta.label}
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-[0.14em] opacity-80">
                    {myRegistration.seats || 1} seat{(myRegistration.seats || 1) === 1 ? '' : 's'}
                  </span>
                </div>
                <p className="mt-2 text-xs font-bold opacity-80">
                  {inr(myRegistration.amountDue)} due · registered under {myRegistration.userName || 'you'}
                </p>
              </div>

              {/* Payment truth, resolved from the payments collection */}
              <div className={`rounded-2xl border p-4 flex items-center gap-3 ${isPaid ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
                <span className={`w-9 h-9 shrink-0 rounded-xl flex items-center justify-center ${isPaid ? 'bg-green-500 text-white' : 'bg-amber-400 text-white'}`}>
                  {isPaid ? <ShieldCheck size={17} /> : <Clock3 size={17} />}
                </span>
                <div className="min-w-0">
                  <p className={`text-[11px] font-black uppercase tracking-[0.12em] ${isPaid ? 'text-green-700' : 'text-amber-700'}`}>
                    {isPaid ? 'Payment received' : 'Payment pending'}
                  </p>
                  <p className="text-[11px] font-medium text-gray-500 mt-0.5 leading-snug">
                    {isPaid
                      ? `${inr(myPayment.amount)} confirmed by our server.`
                      : myRegistration.paymentOrderId
                        ? 'We have not seen a confirmed payment for this booking yet.'
                        : 'No online payment started — staff will collect it, or you can pay online.'}
                  </p>
                </div>
              </div>

              {(myRegistration.status || '').toLowerCase() === 'pending' && (
                <>
                  {!isPaid && price > 0 && !blockedReason && (
                    <button
                      type="button"
                      onClick={() => setModalOpen(true)}
                      className="w-full min-h-[48px] rounded-2xl bg-gray-900 text-white font-black uppercase tracking-[0.14em] text-[11px] hover:bg-saffron transition-colors inline-flex items-center justify-center gap-2"
                    >
                      <CreditCard size={16} /> Book more seats
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={cancelling}
                    className="w-full min-h-[44px] rounded-2xl bg-red-50 text-red-500 font-black uppercase tracking-[0.14em] text-[10px] hover:bg-red-100 transition-colors disabled:opacity-60 inline-flex items-center justify-center gap-2"
                  >
                    {cancelling ? <Loader2 size={15} className="animate-spin" /> : <X size={15} />}
                    {cancelling ? 'Cancelling…' : 'Cancel registration'}
                  </button>
                </>
              )}

              {myRegistration.staffNotes && (
                <p className="text-xs text-gray-500 italic bg-cream/60 rounded-xl p-3 leading-relaxed">
                  &ldquo;{myRegistration.staffNotes}&rdquo;
                </p>
              )}
            </div>
          ) : blockedReason ? (
            <div className="rounded-2xl bg-gray-50 border border-gray-200 p-4 flex items-start gap-3">
              <AlertTriangle size={17} className="text-gray-400 shrink-0 mt-0.5" />
              <p className="text-xs font-semibold text-gray-500 leading-relaxed">{blockedReason}</p>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="w-full min-h-[52px] rounded-2xl bg-gradient-to-r from-saffron to-gold-dark text-white font-black uppercase tracking-[0.14em] text-[11px] shadow-lg shadow-saffron/25 hover:brightness-105 transition-all inline-flex items-center justify-center gap-2"
              >
                <Ticket size={16} /> Reserve my seat
              </button>
              <p className="text-[11px] text-gray-400 font-medium text-center leading-relaxed">
                {advance > 0
                  ? `Pay ${inr(advance)} per person now, the rest before departure.`
                  : 'Pay online, or reserve now and settle with the team.'}
              </p>
            </>
          )}
        </div>

        {waHref && (
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full min-h-[44px] rounded-2xl border border-saffron/20 text-saffron-dark font-black uppercase tracking-[0.14em] text-[10px] hover:bg-saffron/5 transition-colors inline-flex items-center justify-center gap-2"
          >
            <MessageCircle size={15} /> Ask a question
          </a>
        )}
      </div>
    </div>
  )

  /* ---------------- Page ---------------- */
  // In-app the shell adds p-4 sm:p-6 md:p-10 — cancel exactly that so the hero
  // can run full-bleed, without creating horizontal overflow.
  const page = (
    <div className={isPublicView ? '' : '-mx-4 -mt-4 sm:-mx-6 sm:-mt-6 md:-mx-10 md:-mt-10'}>
      {/* ============ HERO ============ */}
      <section className="relative isolate overflow-hidden bg-[#0B0A09] min-h-[62svh] sm:min-h-[68svh] flex flex-col justify-end">
        {trip.coverImage ? (
          <img
            src={trip.coverImage}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover opacity-70"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-saffron via-saffron-dark to-[#0B0A09]" aria-hidden="true" />
        )}

        {/* Scrims — guarantee contrast over any photo */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#070605] via-[#070605]/70 to-[#070605]/25" aria-hidden="true" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#070605]/85 via-[#070605]/40 to-transparent" aria-hidden="true" />

        <div className="relative z-10 w-full">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-8 sm:pb-12">
            <button
              type="button"
              onClick={() => setActiveTab && setActiveTab('trips')}
              className="inline-flex items-center gap-2 min-h-[44px] px-4 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white/85 text-[10px] font-black uppercase tracking-[0.16em] hover:bg-white/20 transition-colors"
            >
              <ArrowLeft size={15} /> All trips
            </button>

            <motion.div
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="mt-6 max-w-3xl"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className={`px-3.5 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.16em] ${STATUS_PILL[tripStatus] || STATUS_PILL.upcoming}`}>
                  {statusLabel(tripStatus)}
                </span>
                {trip.durationLabel && (
                  <span className="px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white/85 text-[9px] font-black uppercase tracking-[0.16em]">
                    {trip.durationLabel}
                  </span>
                )}
                {trip.registrationOpen === false && tripStatus !== 'completed' && tripStatus !== 'cancelled' && (
                  <span className="px-3.5 py-1.5 rounded-full bg-white/90 text-gray-800 text-[9px] font-black uppercase tracking-[0.16em]">
                    Registration closed
                  </span>
                )}
              </div>

              <h1
                className="mt-5 font-black tracking-[-0.03em] leading-[0.96] text-white"
                style={{ fontSize: 'clamp(2.1rem, 6.6vw, 4.25rem)' }}
              >
                {trip.title}
              </h1>

              {trip.subtitle && (
                <p className="mt-4 text-white/75 leading-[1.7] max-w-xl text-sm sm:text-lg">{trip.subtitle}</p>
              )}

              <div className="mt-7 flex flex-wrap gap-x-7 gap-y-4">
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                    <Calendar size={17} className="text-gold" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[9px] font-black text-white/45 uppercase tracking-[0.14em]">When</p>
                    <p className="text-sm font-black text-white tracking-tight">{formatDateRange(trip.startDate, trip.endDate)}</p>
                  </div>
                </div>
                {trip.location && (
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                      <MapPin size={17} className="text-saffron" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[9px] font-black text-white/45 uppercase tracking-[0.14em]">Where</p>
                      <p className="text-sm font-black text-white tracking-tight truncate">{trip.location}</p>
                    </div>
                  </div>
                )}
                {price > 0 && (
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                      <Ticket size={17} className="text-gold" />
                    </span>
                    <div>
                      <p className="text-[9px] font-black text-white/45 uppercase tracking-[0.14em]">From</p>
                      <p className="text-sm font-black text-white tracking-tight">{inr(price)} / person</p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ============ BODY ============ */}
      <div className="bg-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          {/* Notice banner */}
          <AnimatePresence>
            {notice && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className={`mb-6 rounded-2xl p-4 flex items-start gap-3 border ${
                  notice.tone === 'success'
                    ? 'bg-green-50 border-green-200 text-green-700'
                    : notice.tone === 'warn'
                      ? 'bg-amber-50 border-amber-200 text-amber-800'
                      : 'bg-white border-saffron/20 text-gray-600'
                }`}
              >
                {notice.tone === 'success' ? <CheckCircle2 size={18} className="shrink-0 mt-0.5" /> : <Info size={18} className="shrink-0 mt-0.5" />}
                <p className="text-xs sm:text-sm font-semibold leading-relaxed flex-1">{notice.text}</p>
                <button
                  type="button"
                  onClick={() => setNotice(null)}
                  aria-label="Dismiss message"
                  className="w-8 h-8 shrink-0 rounded-lg hover:bg-black/5 flex items-center justify-center"
                >
                  <X size={15} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-10">
            {/* ---------- Booking rail (first on mobile, right on desktop) ---------- */}
            <aside className="order-1 lg:order-2 lg:col-span-1">
              <div className="lg:sticky lg:top-6 space-y-5">{bookingPanel}</div>
            </aside>

            {/* ---------- Main content ---------- */}
            <div className="order-2 lg:order-1 lg:col-span-2 space-y-8 sm:space-y-10">
              {/* About */}
              {trip.description && (
                <section className="bg-white rounded-[1.75rem] sm:rounded-[2rem] shadow-premium border border-saffron/5 p-6 sm:p-9">
                  <SectionHeading icon={<Compass size={13} />} eyebrow="About this yatra" title="The journey" />
                  <p className="text-[15px] text-gray-600 leading-[1.85] font-medium whitespace-pre-line">
                    {trip.description}
                  </p>
                </section>
              )}

              {/* Highlights */}
              {highlights.length > 0 && (
                <section className="bg-white rounded-[1.75rem] sm:rounded-[2rem] shadow-premium border border-saffron/5 p-6 sm:p-9">
                  <SectionHeading icon={<Sparkles size={13} />} eyebrow="Highlights" title="What makes this special" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {highlights.map((h, i) => (
                      <div key={i} className="flex items-start gap-3 p-4 rounded-2xl bg-cream/60 border border-saffron/10">
                        <span className="w-7 h-7 shrink-0 rounded-lg bg-gradient-to-br from-saffron to-gold text-white flex items-center justify-center mt-0.5">
                          <Check size={14} />
                        </span>
                        <p className="text-sm font-semibold text-gray-700 leading-relaxed">{h}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Itinerary */}
              {itinerary.length > 0 && (
                <section className="bg-white rounded-[1.75rem] sm:rounded-[2rem] shadow-premium border border-saffron/5 p-6 sm:p-9">
                  <SectionHeading icon={<MapIcon size={13} />} eyebrow="Day by day" title="The itinerary" />
                  <ol className="relative space-y-6 sm:space-y-7">
                    {/* Timeline spine */}
                    <span className="absolute left-[19px] sm:left-[23px] top-3 bottom-3 w-px bg-gradient-to-b from-saffron/50 via-saffron/20 to-transparent" aria-hidden="true" />
                    {itinerary.map((item, i) => (
                      <li key={i} className="relative flex gap-4 sm:gap-5">
                        <span className="relative z-10 w-10 h-10 sm:w-12 sm:h-12 shrink-0 rounded-2xl bg-gradient-to-br from-saffron to-gold-dark text-white flex flex-col items-center justify-center shadow-lg shadow-saffron/20">
                          <span className="text-[7px] font-black uppercase tracking-[0.1em] leading-none opacity-80">Day</span>
                          <span className="text-sm sm:text-base font-black leading-none mt-0.5">{item.day ?? i + 1}</span>
                        </span>
                        <div className="min-w-0 pt-1 pb-1">
                          <h3 className="text-sm sm:text-base font-black text-gray-900 tracking-tight">{item.title || `Day ${item.day ?? i + 1}`}</h3>
                          {item.details && (
                            <p className="mt-1.5 text-sm text-gray-500 font-medium leading-[1.8] whitespace-pre-line">{item.details}</p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ol>
                </section>
              )}

              {/* Inclusions / exclusions */}
              {(inclusions.length > 0 || exclusions.length > 0) && (
                <section className="bg-white rounded-[1.75rem] sm:rounded-[2rem] shadow-premium border border-saffron/5 p-6 sm:p-9">
                  <SectionHeading icon={<Info size={13} />} eyebrow="The fine print" title="What's included" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-8">
                    <div>
                      <h3 className="text-[10px] font-black uppercase tracking-[0.16em] text-green-600 mb-4 flex items-center gap-2">
                        <CheckCircle2 size={14} /> Included
                      </h3>
                      {inclusions.length === 0 ? (
                        <p className="text-sm text-gray-400 italic">Details shared on confirmation.</p>
                      ) : (
                        <ul className="space-y-2.5">
                          {inclusions.map((item, i) => (
                            <li key={i} className="flex items-start gap-2.5 text-sm text-gray-600 font-medium leading-relaxed">
                              <Check size={16} className="text-green-500 shrink-0 mt-0.5" /> {item}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div className="sm:border-l sm:border-gray-100 sm:pl-8">
                      <h3 className="text-[10px] font-black uppercase tracking-[0.16em] text-red-500 mb-4 flex items-center gap-2">
                        <XCircle size={14} /> Not included
                      </h3>
                      {exclusions.length === 0 ? (
                        <p className="text-sm text-gray-400 italic">Nothing listed.</p>
                      ) : (
                        <ul className="space-y-2.5">
                          {exclusions.map((item, i) => (
                            <li key={i} className="flex items-start gap-2.5 text-sm text-gray-600 font-medium leading-relaxed">
                              <X size={16} className="text-red-400 shrink-0 mt-0.5" /> {item}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </section>
              )}

              {/* Gallery */}
              {gallery.length > 0 && (
                <section className="bg-white rounded-[1.75rem] sm:rounded-[2rem] shadow-premium border border-saffron/5 p-6 sm:p-9">
                  <SectionHeading icon={<Camera size={13} />} eyebrow="Gallery" title="A glimpse" />
                  <div className={`grid gap-3 ${gallery.length === 1 ? 'grid-cols-1' : 'grid-cols-2 sm:grid-cols-3'}`}>
                    {gallery.map((src, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setLightbox(src)}
                        aria-label={`Open gallery image ${i + 1}`}
                        className={`group relative overflow-hidden rounded-2xl bg-cream aspect-[4/3] ${gallery.length === 3 && i === 0 ? 'col-span-2 sm:col-span-1' : ''}`}
                      >
                        <img src={src} alt={`${trip.title} photo ${i + 1}`} loading="lazy" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                        <span className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" aria-hidden="true" />
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {/* Meeting point */}
              {(trip.meetingPoint || trip.startDate) && (
                <section className="bg-white rounded-[1.75rem] sm:rounded-[2rem] shadow-premium border border-saffron/5 p-6 sm:p-9">
                  <SectionHeading icon={<MapPin size={13} />} eyebrow="Logistics" title="Where we meet" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-5 rounded-2xl bg-cream/60 border border-saffron/10">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.14em]">Meeting point</p>
                      <p className="mt-2 text-sm font-bold text-gray-800 leading-relaxed">
                        {trip.meetingPoint || 'Shared with confirmed travellers.'}
                      </p>
                    </div>
                    <div className="p-5 rounded-2xl bg-cream/60 border border-saffron/10">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.14em]">Departure &amp; return</p>
                      <p className="mt-2 text-sm font-bold text-gray-800 leading-relaxed">
                        {formatLong(trip.startDate)} &rarr; {formatLong(trip.endDate)}
                      </p>
                    </div>
                  </div>
                </section>
              )}

              {/* Contact — dark anchor band */}
              <section className="relative overflow-hidden rounded-[1.75rem] sm:rounded-[2rem] bg-[#0B0A09] text-white">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(255,153,51,0.32),transparent_60%)]" aria-hidden="true" />
                <div className="relative z-10 p-6 sm:p-10 flex flex-col sm:flex-row sm:items-center gap-6 justify-between">
                  <div className="min-w-0">
                    <h3 className="text-lg sm:text-xl font-black tracking-tight">Questions before you book?</h3>
                    <p className="mt-2 text-sm text-white/60 font-medium leading-relaxed max-w-md">
                      The yatra team can help with travel, rooms, dietary needs and group bookings.
                      {trip.contactPhone ? ` Call or WhatsApp ${trip.contactPhone}.` : ''}
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                    {waHref && (
                      <a
                        href={waHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="min-h-[48px] px-6 rounded-2xl bg-saffron text-white font-black uppercase tracking-[0.14em] text-[10px] hover:brightness-110 transition-all inline-flex items-center justify-center gap-2"
                      >
                        <MessageCircle size={15} /> WhatsApp us
                      </a>
                    )}
                    {trip.contactPhone && (
                      <a
                        href={`tel:${String(trip.contactPhone).replace(/\s/g, '')}`}
                        className="min-h-[48px] px-6 rounded-2xl border border-white/25 bg-white/5 text-white font-black uppercase tracking-[0.14em] text-[10px] hover:bg-white hover:text-gray-900 transition-all inline-flex items-center justify-center gap-2"
                      >
                        <Phone size={15} /> Call
                      </a>
                    )}
                  </div>
                </div>
              </section>

              {/* Other trips */}
              {otherTrips.length > 0 && (
                <section>
                  <SectionHeading icon={<Bus size={13} />} eyebrow="Also coming up" title="Other yatras" />
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {otherTrips.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => openTrip && openTrip(t.slug)}
                        className="group text-left bg-white rounded-2xl overflow-hidden shadow-premium border border-saffron/5 hover:shadow-premium-xl hover:-translate-y-1 transition-all"
                      >
                        <div className="h-24 overflow-hidden bg-gradient-to-br from-saffron to-gold-dark">
                          {t.coverImage && (
                            <img src={t.coverImage} alt="" loading="lazy" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                          )}
                        </div>
                        <div className="p-4">
                          <p className="text-sm font-black text-gray-900 tracking-tight line-clamp-2">{t.title}</p>
                          <p className="mt-1.5 text-[10px] font-black text-gray-400 uppercase tracking-[0.12em] flex items-center gap-1.5">
                            <Calendar size={11} className="text-saffron shrink-0" />
                            <span className="truncate">{formatDateRange(t.startDate, t.endDate)}</span>
                          </p>
                          <span className="mt-3 inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.14em] text-saffron-dark">
                            View <ArrowRight size={12} />
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ============ Mobile sticky CTA (public view only — the app shell
           already owns the bottom edge with its nav) ============ */}
      {isPublicView && !blockedReason && !(myRegistration && (myRegistration.status || '').toLowerCase() !== 'cancelled') && (
        <>
          <div className="h-24 lg:hidden" aria-hidden="true" />
          <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-xl border-t border-saffron/10 px-4 py-3 flex items-center gap-4">
            <div className="min-w-0">
              <p className="text-lg font-black text-gray-900 leading-none tracking-tight">
                {price > 0 ? inr(price) : 'By seva'}
              </p>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.12em] mt-1">
                {price > 0 ? 'Per person' : 'No fixed fee'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => (user ? setModalOpen(true) : onLoginClick && onLoginClick())}
              className="flex-1 min-h-[48px] rounded-2xl bg-gradient-to-r from-saffron to-gold-dark text-white font-black uppercase tracking-[0.14em] text-[11px] shadow-lg shadow-saffron/25 inline-flex items-center justify-center gap-2"
            >
              <Ticket size={16} /> {user ? 'Reserve seat' : 'Sign in to register'}
            </button>
          </div>
        </>
      )}

      {/* ============ Registration modal ============ */}
      <AnimatePresence>
        {modalOpen && user && trip && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => !submitting && setModalOpen(false)}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-xl"
            />
            <motion.div
              initial={{ scale: 0.94, y: 28, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.94, y: 28, opacity: 0 }}
              className="relative w-full max-w-lg bg-white rounded-[1.75rem] sm:rounded-[2.5rem] shadow-premium-xl border border-saffron/10 overflow-y-auto max-h-[90vh] p-6 sm:p-9"
            >
              <button
                type="button"
                onClick={() => !submitting && setModalOpen(false)}
                aria-label="Close registration form"
                className="absolute top-4 right-4 w-11 h-11 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-colors"
              >
                <X size={21} />
              </button>

              <div className="mb-7 pr-12">
                <div className="w-[52px] h-[52px] bg-gradient-to-br from-saffron to-gold rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                  <Ticket className="text-white" size={24} />
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">Reserve your seat</h2>
                <p className="text-gray-400 text-sm font-medium mt-1.5">{trip.title}</p>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  handleRegister('pay')
                }}
                className="space-y-5"
              >
                {/* Seats */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.16em] ml-1">Travellers</label>
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      aria-label="Decrease number of travellers"
                      onClick={() => adjustSeats(-1)}
                      className="w-12 h-12 shrink-0 rounded-2xl bg-cream/70 border border-saffron/10 flex items-center justify-center text-saffron hover:bg-saffron/10 transition-colors"
                    >
                      <Minus size={18} />
                    </button>
                    <span className="flex-1 text-center text-2xl font-black text-gray-900 tracking-tight">{seats}</span>
                    <button
                      type="button"
                      aria-label="Increase number of travellers"
                      onClick={() => adjustSeats(1)}
                      className="w-12 h-12 shrink-0 rounded-2xl bg-cream/70 border border-saffron/10 flex items-center justify-center text-saffron hover:bg-saffron/10 transition-colors"
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                  {seatsLeft !== null && (
                    <p className="text-[11px] text-gray-400 font-semibold ml-1">{seatsLeft} seat{seatsLeft === 1 ? '' : 's'} left · up to 20 per registration</p>
                  )}
                </div>

                {/* Contact */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="trip-phone" className="text-[10px] font-black text-gray-400 uppercase tracking-[0.16em] ml-1">Phone</label>
                    <input
                      id="trip-phone"
                      type="tel"
                      required
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="10-digit mobile"
                      className="w-full min-h-[48px] px-4 py-3 bg-cream/30 border border-saffron/10 rounded-xl outline-none focus:bg-white focus:border-saffron/40 transition-all font-medium"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="trip-email" className="text-[10px] font-black text-gray-400 uppercase tracking-[0.16em] ml-1">Email</label>
                    <input
                      id="trip-email"
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="you@example.com"
                      className="w-full min-h-[48px] px-4 py-3 bg-cream/30 border border-saffron/10 rounded-xl outline-none focus:bg-white focus:border-saffron/40 transition-all font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="trip-emergency" className="text-[10px] font-black text-gray-400 uppercase tracking-[0.16em] ml-1">Emergency contact</label>
                  <input
                    id="trip-emergency"
                    type="text"
                    required
                    value={form.emergencyContact}
                    onChange={(e) => setForm({ ...form, emergencyContact: e.target.value })}
                    placeholder="Name & number of someone at home"
                    className="w-full min-h-[48px] px-4 py-3 bg-cream/30 border border-saffron/10 rounded-xl outline-none focus:bg-white focus:border-saffron/40 transition-all font-medium"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="trip-notes" className="text-[10px] font-black text-gray-400 uppercase tracking-[0.16em] ml-1">Traveller notes (optional)</label>
                  <textarea
                    id="trip-notes"
                    rows={3}
                    value={form.travellerNotes}
                    onChange={(e) => setForm({ ...form, travellerNotes: e.target.value })}
                    placeholder="Names of co-travellers, dietary needs, boarding point…"
                    className="w-full bg-cream/30 border border-saffron/10 rounded-2xl px-4 py-3 outline-none focus:bg-white focus:border-saffron/40 transition-all font-medium resize-none"
                  />
                </div>

                {/* Price breakdown */}
                <div className="rounded-2xl bg-cream/60 border border-saffron/10 p-5 space-y-2.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 font-semibold">{inr(price)} × {seats} traveller{seats === 1 ? '' : 's'}</span>
                    <span className="font-black text-gray-800">{inr(total)}</span>
                  </div>
                  {advance > 0 && (
                    <>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500 font-semibold">Advance now ({inr(advance)} / person)</span>
                        <span className="font-black text-saffron-dark">{inr(payNow)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm pt-2.5 border-t border-saffron/10">
                        <span className="text-gray-500 font-semibold">Balance before departure</span>
                        <span className="font-black text-gray-800">{inr(balance)}</span>
                      </div>
                    </>
                  )}
                  {advance === 0 && (
                    <div className="flex items-center justify-between text-sm pt-2.5 border-t border-saffron/10">
                      <span className="text-gray-600 font-black uppercase tracking-[0.1em] text-[10px]">Payable now</span>
                      <span className="font-black text-saffron-dark text-base">{inr(total)}</span>
                    </div>
                  )}
                </div>

                {!razorpayConfigured() && (
                  <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 flex items-start gap-3">
                    <AlertTriangle size={17} className="text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-xs font-semibold text-amber-800 leading-relaxed">
                      Online payment isn&apos;t switched on for this site yet. You can still reserve your
                      seat — the yatra team will collect the amount directly.
                    </p>
                  </div>
                )}

                {formError && (
                  <div className="rounded-2xl bg-red-50 border border-red-200 p-4 flex items-start gap-3">
                    <XCircle size={17} className="text-red-500 shrink-0 mt-0.5" />
                    <p className="text-xs font-semibold text-red-600 leading-relaxed">{formError}</p>
                  </div>
                )}

                <div className="space-y-3 pt-1">
                  {razorpayConfigured() && total > 0 && (
                    <button
                      type="submit"
                      disabled={!!submitting}
                      className="w-full min-h-[52px] rounded-2xl bg-gradient-to-r from-saffron to-gold-dark text-white font-black uppercase tracking-[0.14em] text-[11px] shadow-lg shadow-saffron/25 hover:brightness-105 transition-all disabled:opacity-50 inline-flex items-center justify-center gap-2"
                    >
                      {submitting === 'pay' ? <Loader2 size={17} className="animate-spin" /> : <CreditCard size={17} />}
                      {submitting === 'pay' ? 'Opening checkout…' : `Register & pay ${inr(payNow)}`}
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={!!submitting}
                    onClick={() => handleRegister('later')}
                    className="w-full min-h-[48px] rounded-2xl bg-gray-900 text-white font-black uppercase tracking-[0.14em] text-[10px] hover:bg-gray-800 transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2"
                  >
                    {submitting === 'later' ? <Loader2 size={16} className="animate-spin" /> : <Clock3 size={16} />}
                    {submitting === 'later' ? 'Reserving…' : 'Register, pay later'}
                  </button>
                  <p className="text-[11px] text-gray-400 font-medium text-center leading-relaxed">
                    Your seat stays <span className="font-bold">pending</span> until the team confirms it.
                    Payments are verified by our server, never by this page.
                  </p>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ============ Gallery lightbox ============ */}
      <AnimatePresence>
        {lightbox && (
          <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setLightbox(null)}
              className="absolute inset-0 bg-gray-900/85 backdrop-blur-xl"
            />
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-[1.5rem] sm:rounded-[2rem] bg-black"
            >
              <button
                type="button"
                onClick={() => setLightbox(null)}
                aria-label="Close image"
                className="absolute top-3 right-3 z-10 w-11 h-11 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
              >
                <X size={21} />
              </button>
              <img src={lightbox} alt={`${trip.title} photo`} className="w-full h-auto object-contain" />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )

  if (isPublicView) {
    return (
      <div className="min-h-screen bg-cream">
        <PublicTopBar onLoginClick={onLoginClick} />
        {page}
      </div>
    )
  }

  return page
}

export default TripDetail
