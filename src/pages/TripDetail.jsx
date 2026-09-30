import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MapPin, Calendar, Clock, Users, ArrowLeft, ArrowRight, Check, X, Plus, Minus,
  Loader2, Compass, Ticket, Phone, MessageCircle, ShieldCheck, CreditCard,
  CheckCircle2, XCircle, AlertTriangle, Ban, Clock3, Sparkles, Info, Camera,
  Map as MapIcon, Bus, Banknote, Building2
} from 'lucide-react'
import { collection, addDoc, updateDoc, doc, serverTimestamp, where } from '../lib/pgstore'
import { db, auth } from '../lib/firebase'
import { useFirestore } from '../hooks/useFirestore'
import { useAuth } from '../hooks/useAuth'
import { callApi } from '../lib/api'
import { getPaymentConfig, openCheckout } from '../lib/razorpay'

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
  draft: 'bg-ink-muted text-white',
}

const REG_STATUS = {
  pending: { label: 'Pending confirmation', cls: 'text-saffron-dark bg-saffron/10 border-saffron/20', icon: <Clock3 size={13} /> },
  confirmed: { label: 'Confirmed', cls: 'text-green-600 bg-green-100 border-green-200', icon: <CheckCircle2 size={13} /> },
  waitlisted: { label: 'Waitlisted', cls: 'text-blue-600 bg-blue-100 border-blue-200', icon: <Users size={13} /> },
  cancelled: { label: 'Cancelled', cls: 'text-ink-muted bg-paper-dark border-line', icon: <Ban size={13} /> },
}

/** +91 normalisation so a bare 10-digit number still opens WhatsApp. */
const waNumber = (phone) => {
  const digits = String(phone || '').replace(/\D/g, '')
  if (!digits) return null
  if (digits.length === 10) return `91${digits}`
  return digits.replace(/^0+/, '')
}

// Remembers "this person tapped Register, then had to sign in" so the form
// opens again by itself once they're back.
const RESUME_KEY = 'folk_resume_trip'
const markResume = (slug) => { try { sessionStorage.setItem(RESUME_KEY, slug || '') } catch { /* private mode */ } }
const takeResume = (slug) => {
  try {
    if (slug && sessionStorage.getItem(RESUME_KEY) === slug) { sessionStorage.removeItem(RESUME_KEY); return true }
  } catch { /* private mode */ }
  return false
}

const GENDERS = ['Male', 'Female']
const blankTraveller = () => ({ name: '', age: '', gender: '' })
const friendlyError = (error) => {
  const msg = String(error?.message || '')
  if (!msg || /failed to fetch|networkerror|load failed/i.test(msg)) return 'We could not reach the payment server. Check your connection and try again.'
  return msg
}

/* ------------------------------------------------------------------ */

const PublicTopBar = ({ onLoginClick }) => (
  <header className="sticky top-0 z-40 bg-white/85 border-b border-saffron/10">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="h-16 sm:h-[70px] flex items-center justify-between gap-3">
        <a href="/" className="min-w-0 flex items-center shrink-0" aria-label="FOLK Vizag — home">
          <img src="/folk_logo_blue.png" alt="Folk Vizag logo" className="h-12 sm:h-14 w-auto max-w-full object-contain shrink-0" />
        </a>
        <button
          type="button"
          onClick={() => onLoginClick && onLoginClick()}
          className="min-h-[44px] px-5 sm:px-7 rounded-full bg-ink text-white text-sm font-bold hover:bg-saffron transition-colors whitespace-nowrap"
        >
          Sign in
        </button>
      </div>
    </div>
  </header>
)

const SectionHeading = ({ icon, eyebrow, title }) => (
  <div className="mb-5 sm:mb-6 user-text-box">
    <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-label sm:tracking-label text-saffron-dark">
      <span className="shrink-0">{icon}</span> {eyebrow}
    </span>
    <h2 className="mt-2 text-lg sm:text-2xl font-bold text-ink tracking-tight leading-tight">{title}</h2>
  </div>
)

/* ------------------------------------------------------------------ *
 * Payment availability. Both flags are staff-managed on the trip doc.
 * `onlinePaymentEnabled` defaults to TRUE when absent so every trip that
 * existed before the field was introduced keeps its Razorpay checkout.
 * `cashPaymentEnabled` defaults to FALSE — cash is opt-in per trip.
 * ------------------------------------------------------------------ */
const isOnlineEnabled = (trip) => trip?.onlinePaymentEnabled !== false
const isCashEnabled = (trip) => trip?.cashPaymentEnabled === true

/** Skeleton for the detail page — closer to the finished layout than a spinner. */
const DetailSkeleton = () => (
  <div className="animate-pulse" aria-hidden="true">
    <div className="h-[46svh] sm:h-[56svh] bg-gradient-to-br from-[#1a1614] to-[#0B0A09]" />
    <div className="bg-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-10">
          <div className="order-1 lg:order-2 lg:col-span-1">
            <div className="bg-white rounded-xl sm:rounded-xl shadow-premium border border-saffron/10 p-6 space-y-4">
              <div className="h-8 w-32 rounded-full bg-cream-dark/70" />
              <div className="h-3 w-24 rounded-full bg-cream-dark/50" />
              <div className="space-y-3 pt-2">
                <div className="h-9 w-full rounded-xl bg-cream-dark/40" />
                <div className="h-9 w-full rounded-xl bg-cream-dark/40" />
              </div>
              <div className="h-[52px] w-full rounded-2xl bg-cream-dark/70" />
            </div>
          </div>
          <div className="order-2 lg:order-1 lg:col-span-2 space-y-6">
            {[0, 1].map((i) => (
              <div key={i} className="bg-white rounded-xl sm:rounded-xl shadow-premium border border-saffron/5 p-6 sm:p-9 space-y-3">
                <div className="h-3 w-28 rounded-full bg-cream-dark/50" />
                <div className="h-6 w-2/5 rounded-full bg-cream-dark/70" />
                <div className="h-3 w-full rounded-full bg-cream-dark/40 mt-4" />
                <div className="h-3 w-11/12 rounded-full bg-cream-dark/40" />
                <div className="h-3 w-4/5 rounded-full bg-cream-dark/40" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
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

  // A payment created for a specific registration must be for THIS one: the
  // pointer is devotee-writable, so it could otherwise name another order.
  const isPaid = !!myPayment
    && String(myPayment.status || '').toLowerCase() === 'completed'
    && myPayment.verified === true
    && (!myPayment.tripRegistrationId || myPayment.tripRegistrationId === myRegistration?.id)

  /**
   * Cash truth is `cashCollected` on the registration, which the rules let
   * ONLY staff write. The devotee's own `paymentMode` choice says how they
   * intend to pay; it never means the money arrived.
   */
  const isCashRegistration = String(myRegistration?.paymentMode || '').toLowerCase() === 'cash'
  const isCashCollected = myRegistration?.cashCollected === true
  /** One flag for "this booking is settled", whichever route was used. */
  const isSettled = isCashRegistration ? isCashCollected : isPaid

  /* ---------------- Registration modal ---------------- */
  const emptyForm = { seats: 1, travellers: [blankTraveller()], pickup: '', travellerNotes: '', emergencyContact: '', phone: '', email: '' }
  const [payCfg, setPayCfg] = useState(null)
  useEffect(() => { let alive = true; getPaymentConfig().then((c) => alive && setPayCfg(c)); return () => { alive = false } }, [])
  const razorpayReady = !!payCfg?.enabled
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(null) // 'pay' | 'cash' | 'later' | null
  const [formError, setFormError] = useState('')
  const [notice, setNotice] = useState(null) // { tone, text }
  const [cancelling, setCancelling] = useState(false)
  const [lightbox, setLightbox] = useState(null)
  const [payMethod, setPayMethod] = useState('online') // 'online' | 'cash'

  const price = Number(trip?.price) || 0
  const advance = Number(trip?.advanceAmount) || 0
  const seats = Math.min(20, Math.max(1, parseInt(form.seats, 10) || 1))
  const total = price * seats
  // Same formula as the server's createOrder, so the button and the charge agree.
  const payNowFor = (n) => { const t = price * n; return advance > 0 ? Math.min(advance * n, t || advance * n) : t }
  const payNow = payNowFor(seats)
  const balance = Math.max(0, total - payNow)

  /* ---------------- Payment methods offered for this trip ---------------- */
  // Online additionally needs a real Razorpay key and something to charge:
  // a ₹0 "by seva" yatra has no checkout to open.
  const onlineAvailable = isOnlineEnabled(trip) && razorpayReady && total > 0
  // A ₹0 "by seva" yatra has nothing to collect either way, so cash is not
  // offered there — the trip falls through to a plain pending request.
  const cashAvailable = isCashEnabled(trip) && total > 0
  const bothAvailable = onlineAvailable && cashAvailable
  const noPaymentAvailable = !onlineAvailable && !cashAvailable
  /** The method the submit button will actually use. */
  const effectiveMethod = bothAvailable ? payMethod : (cashAvailable ? 'cash' : 'online')
  /**
   * With no payment method on offer the primary action still creates the
   * pending registration — it just never touches Razorpay.
   */
  const submitMode = noPaymentAvailable ? 'later' : (effectiveMethod === 'cash' ? 'cash' : 'pay')

  useEffect(() => {
    if (!modalOpen) return
    setForm({
      seats: 1,
      travellers: [{ name: user?.fullName || user?.name || auth.currentUser?.displayName || '', age: '', gender: user?.gender || '' }],
      pickup: '',
      travellerNotes: '',
      emergencyContact: '',
      phone: user?.phone || user?.mobile || auth.currentUser?.phoneNumber || '',
      email: user?.email || auth.currentUser?.email || '',
    })
    setFormError('')
    // Default to online when it is on offer; otherwise cash carries the flow.
    setPayMethod(onlineAvailable ? 'online' : (cashAvailable ? 'cash' : 'online'))
  }, [modalOpen, user?.phone, user?.mobile, user?.email, onlineAvailable, cashAvailable])

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
      const next = Math.min(maxSelectableSeats, Math.max(1, (parseInt(prev.seats, 10) || 1) + delta))
      const travellers = [...(prev.travellers || [])].slice(0, next)
      while (travellers.length < next) travellers.push(blankTraveller())
      return { ...prev, seats: next, travellers }
    })
  }

  const createRegistration = async (paymentMode) => {
    // Shape matched to the deployed rules: userId === uid, status 'pending',
    // seats an int between 1 and 20.
    //
    // NOTE: no `cashCollected` / paid flag is written here, deliberately. The
    // rules let staff write those fields, so a client that set them at create
    // time would be forging a payment. Cash is confirmed by staff only.
    return addDoc(collection(db, 'trip_registrations'), {
      tripId: trip.id,
      tripSlug: trip.slug || slug || '',
      tripTitle: trip.title || '',
      userId: user.uid,
      userName: user.fullName || user.name || auth.currentUser?.displayName || 'Devotee',
      userPhone: (form.phone || '').trim(),
      userEmail: (form.email || '').trim(),
      seats,
      travellers: (form.travellers || []).slice(0, seats).map((t) => ({
        name: String(t.name || '').trim().slice(0, 80),
        age: parseInt(t.age, 10) || null,
        gender: t.gender || '',
      })),
      pickup: (form.pickup || '').trim().slice(0, 120),
      travellerNotes: (form.travellerNotes || '').trim(),
      emergencyContact: (form.emergencyContact || '').trim(),
      amountDue: total,
      paymentMode: paymentMode === 'cash' ? 'cash' : 'online',
      paymentOrderId: null,
      status: 'pending',
      staffNotes: '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  }

  /** mode: 'pay' (Razorpay now) | 'cash' (pay at the office) | 'later' */
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
    const travellers = (form.travellers || []).slice(0, seats)
    const missing = travellers.findIndex((t) => !String(t.name || '').trim() || !(parseInt(t.age, 10) > 0 && parseInt(t.age, 10) < 110))
    if (travellers.length < seats || missing !== -1) {
      setFormError(`Please add the name and age of traveller ${missing === -1 ? travellers.length + 1 : missing + 1}.`)
      return
    }
    if (!/\d{10}/.test(String(form.phone || '').replace(/\D/g, ''))) {
      setFormError('Please enter a valid mobile number so the yatra team can reach you.')
      return
    }
    if (!String(form.emergencyContact || '').trim()) {
      setFormError('Please add an emergency contact (name and phone).')
      return
    }
    setFormError('')
    setSubmitting(mode)

    let regRef = null
    try {
      regRef = await createRegistration(mode === 'cash' ? 'cash' : 'online')

      if (mode === 'cash') {
        // No Razorpay call at all. The seat sits pending until staff mark the
        // cash as collected — this page can never assert that itself.
        setModalOpen(false)
        setNotice({
          tone: 'success',
          text: `Seat reserved for ${seats} traveller${seats === 1 ? '' : 's'}. Please pay ${inr(payNow)} in cash at the FOLK office — your seat is confirmed by the yatra team once the cash is received.${trip.contactPhone ? ` Questions? Call or WhatsApp ${trip.contactPhone}.` : ''}`,
        })
        return
      }

      if (mode === 'later') {
        setModalOpen(false)
        setNotice({
          tone: 'success',
          text: onlineAvailable
            ? 'Seat reserved. The yatra team will confirm and collect the payment — you can pay online any time from this page.'
            : `Seat reserved. Your registration is pending — the yatra team will confirm it and arrange payment with you.${trip.contactPhone ? ` Call or WhatsApp ${trip.contactPhone}.` : ''}`,
        })
        return
      }

      // --- Online payment -------------------------------------------------
      // The server prices the order from the trip and this registration's
      // seats; `amount` is only a fallback for a backend that predates that.
      const order = await callApi('createOrder', { amount: payNow, eventId: trip.id, tripRegistrationId: regRef.id })
      if (!order || !order.id) throw new Error('The payment order could not be created. Please try again.')

      // Persist the pointer BEFORE checkout opens, so it survives the user
      // closing the modal. Rules allow only these two fields here. (The
      // current server also sets it itself; writing it again is harmless.)
      await updateDoc(regRef, { paymentOrderId: order.id, updatedAt: serverTimestamp() })

      setModalOpen(false)
      await runCheckout(order, seats)
    } catch (error) {
      console.error('Trip registration error:', error)
      if (regRef) {
        setModalOpen(false)
        setNotice({
          tone: 'warn',
          text: `Your seat is reserved, but the payment could not start. ${friendlyError(error)} You can tap "Pay now" on this page any time.`,
        })
      } else {
        setFormError(error.message || 'Something went wrong. Please try again.')
      }
    } finally {
      setSubmitting(null)
    }
  }

  /** Opens Razorpay; the server confirms the payment and the seat. */
  const runCheckout = async (order, seatCount) => {
    const outcome = await openCheckout({
      order,
      description: `${trip.title || 'Yatra'} · ${seatCount} seat${seatCount === 1 ? '' : 's'}`,
      prefill: {
        name: user.fullName || user.name || auth.currentUser?.displayName || '',
        email: (form.email || user.email || '').trim(),
        contact: (form.phone || user.phone || '').trim(),
      },
      onVerifying: () => setNotice({ tone: 'info', text: 'Confirming your payment…' }),
    })
    if (outcome === 'paid') {
      setNotice({ tone: 'success', text: 'Payment received and your seat is confirmed. Hare Krishna! You will get trip updates from the yatra team.' })
    } else {
      setNotice({ tone: 'warn', text: 'Payment not completed. Your seat is held as pending; tap "Pay now" to finish.' })
    }
  }

  const [payingExisting, setPayingExisting] = useState(false)
  const payExisting = async () => {
    if (!myRegistration || payingExisting) return
    setPayingExisting(true)
    setNotice(null)
    try {
      const order = await callApi('createOrder', { tripRegistrationId: myRegistration.id })
      if (!order?.id) throw new Error('The payment order could not be created. Please try again.')
      await runCheckout(order, parseInt(myRegistration.seats, 10) || 1)
    } catch (error) {
      setNotice({ tone: 'warn', text: friendlyError(error) })
    } finally {
      setPayingExisting(false)
    }
  }

  // Back from sign-in after tapping Register: open the form straight away.
  useEffect(() => {
    if (user && trip && !blockedReason && !myRegistration && takeResume(trip.slug || slug)) setModalOpen(true)
  }, [user, trip, blockedReason, myRegistration, slug])

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
      <div className={isPublicView ? '' : '-mx-4 -mt-4 sm:-mx-6 sm:-mt-6 md:-mx-10 md:-mt-10'}>
        <span className="sr-only" role="status">Loading yatra…</span>
        <DetailSkeleton />
      </div>
    )
  }

  if (!trip) {
    return shell(
      <div className="min-h-[60vh] flex items-center justify-center px-4 py-12 sm:py-16">
        <div className="max-w-md w-full text-center bg-white rounded-xl sm:rounded-xl shadow-premium border border-saffron/10 p-6 sm:p-12">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-saffron/10 text-saffron flex items-center justify-center mb-6">
            <Compass size={28} />
          </div>
          <h1 className="text-lg sm:text-2xl font-bold text-ink tracking-tight">This yatra isn&apos;t here</h1>
          <p className="mt-3 text-[13px] sm:text-sm text-ink-muted font-medium leading-relaxed">
            The trip you&apos;re looking for doesn&apos;t exist, or it may have been removed.
            Have a look at what&apos;s coming up instead.
          </p>
          <button
            type="button"
            onClick={() => setActiveTab && setActiveTab('trips')}
            className="mt-7 w-full min-h-[48px] rounded-2xl bg-ink text-white font-bold uppercase tracking-label text-[11px] hover:bg-saffron transition-colors inline-flex items-center justify-center gap-2"
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
    <div className="bg-white rounded-xl sm:rounded-xl shadow-premium-xl border border-saffron/10 overflow-hidden user-text-box">
      {/* Price header — the single loudest piece of information on the page */}
      <div className="relative bg-gradient-to-br from-cream to-white border-b border-saffron/10 px-5 sm:px-7 py-5 sm:py-6">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            {price > 0 ? (
              <>
                <p className="font-display text-3xl sm:text-4xl font-bold text-navy leading-none">{inr(price)}</p>
                <p className="text-[10px] font-bold text-ink-muted uppercase tracking-[0.14em] mt-1.5">Per person</p>
              </>
            ) : (
              <>
                <p className="text-xl sm:text-2xl font-bold text-emerald-600 tracking-tight leading-none">By seva</p>
                <p className="text-[10px] font-bold text-ink-muted uppercase tracking-[0.14em] mt-1.5">No fixed fee</p>
              </>
            )}
          </div>
          {advance > 0 && (
            <div className="text-right shrink-0">
              <p className="text-sm font-bold text-saffron-dark tracking-tight">{inr(advance)}</p>
              <p className="text-[9px] font-bold text-ink-muted uppercase tracking-[0.14em] mt-1">Advance / person</p>
            </div>
          )}
        </div>

        {/* How you can pay — set by the yatra team on the trip */}
        {(onlineAvailable || cashAvailable) && (
          <div className="mt-4 flex flex-wrap gap-2">
            {onlineAvailable && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-saffron/15 text-[9px] font-bold uppercase tracking-[0.12em] text-ink-muted">
                <CreditCard size={11} className="text-saffron shrink-0" /> Pay online
              </span>
            )}
            {cashAvailable && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-emerald-200 text-[9px] font-bold uppercase tracking-[0.12em] text-emerald-700">
                <Banknote size={11} className="shrink-0" /> Cash at office
              </span>
            )}
          </div>
        )}
      </div>

      <div className="p-5 sm:p-7 space-y-5">
        <div className="space-y-2.5">
          <div className="flex items-start gap-3 user-text-box">
            <span className="w-9 h-9 shrink-0 rounded-xl bg-cream/70 text-saffron flex items-center justify-center"><Calendar size={16} /></span>
            <div className="min-w-0">
              <p className="text-[9px] font-bold text-ink-muted uppercase tracking-[0.14em]">Dates</p>
              <p className="text-[13px] sm:text-sm font-bold text-ink user-text">{formatDateRange(trip.startDate, trip.endDate)}</p>
            </div>
          </div>
          {trip.durationLabel && (
            <div className="flex items-start gap-3 user-text-box">
              <span className="w-9 h-9 shrink-0 rounded-xl bg-cream/70 text-saffron flex items-center justify-center"><Clock size={16} /></span>
              <div className="min-w-0">
                <p className="text-[9px] font-bold text-ink-muted uppercase tracking-[0.14em]">Duration</p>
                <p className="text-[13px] sm:text-sm font-bold text-ink user-text">{trip.durationLabel}</p>
              </div>
            </div>
          )}
          {trip.location && (
            <div className="flex items-start gap-3 user-text-box">
              <span className="w-9 h-9 shrink-0 rounded-xl bg-cream/70 text-saffron flex items-center justify-center"><MapPin size={16} /></span>
              <div className="min-w-0">
                <p className="text-[9px] font-bold text-ink-muted uppercase tracking-[0.14em]">Destination</p>
                <p className="text-[13px] sm:text-sm font-bold text-ink user-text">{trip.location}</p>
              </div>
            </div>
          )}
          {seatsLeft !== null && (
            <div className="flex items-start gap-3 user-text-box">
              <span className="w-9 h-9 shrink-0 rounded-xl bg-cream/70 text-saffron flex items-center justify-center"><Users size={16} /></span>
              <div className="min-w-0">
                <p className="text-[9px] font-bold text-ink-muted uppercase tracking-[0.14em]">Seats</p>
                <p className={`text-[13px] sm:text-sm font-bold user-text ${seatsLeft === 0 ? 'text-red-500' : 'text-ink'}`}>
                  {seatsLeft === 0 ? 'Fully booked' : `${seatsLeft} of ${capacity} left`}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Capacity bar */}
        {capacity > 0 && (
          <div className="pt-1 space-y-1.5">
            <div
              className="h-2 w-full rounded-full bg-paper-dark overflow-hidden"
              role="progressbar"
              aria-valuenow={Math.min(100, Math.round((seatsTaken / capacity) * 100))}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Seats booked"
            >
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  seatsLeft === 0 ? 'bg-red-400' : 'bg-saffron'
                }`}
                style={{ width: `${Math.min(100, Math.round((seatsTaken / capacity) * 100))}%` }}
              />
            </div>
            <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-ink-muted">
              {seatsTaken} of {capacity} booked
            </p>
          </div>
        )}

        {/* --------- The CTA area --------- */}
        <div className="pt-1 space-y-3">
          {!user ? (
            <>
              <button
                type="button"
                onClick={() => { markResume(trip?.slug || slug); onLoginClick && onLoginClick() }}
                className="w-full min-h-[52px] rounded-2xl bg-saffron text-white font-bold uppercase tracking-[0.14em] text-[11px] shadow-lg hover:brightness-105 transition-all inline-flex items-center justify-center gap-2"
              >
                <Ticket size={16} /> Sign in to register
              </button>
              <p className="text-[11px] text-ink-muted font-medium text-center leading-relaxed">
                A free FOLK account keeps your seat, receipts and trip updates in one place.
              </p>
            </>
          ) : myRegistration && (myRegistration.status || '').toLowerCase() !== 'cancelled' ? (
            <div className="space-y-3">
              <div className={`rounded-2xl border p-4 user-text-box ${regMeta.cls}`}>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em]">
                    <span className="shrink-0">{regMeta.icon}</span> {regMeta.label}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-[0.14em] opacity-80 shrink-0">
                    {myRegistration.seats || 1} seat{(myRegistration.seats || 1) === 1 ? '' : 's'}
                  </span>
                </div>
                <p className="mt-2 text-xs font-bold opacity-80 user-text">
                  {inr(myRegistration.amountDue)} due · registered under {myRegistration.userName || 'you'}
                </p>
              </div>

              {/* Payment truth. Online = a verified, completed `payments` doc.
                  Cash  = `cashCollected` on the registration, written by staff
                  only. Neither can be asserted from this page. */}
              <div className={`rounded-2xl border p-4 flex items-start gap-3 user-text-box ${
                isSettled
                  ? 'bg-green-50 border-green-200'
                  : isCashRegistration
                    ? 'bg-emerald-50/70 border-emerald-200'
                    : 'bg-amber-50 border-amber-200'
              }`}>
                <span className={`w-9 h-9 shrink-0 rounded-xl flex items-center justify-center text-white ${
                  isSettled ? 'bg-green-500' : isCashRegistration ? 'bg-emerald-500' : 'bg-amber-400'
                }`}>
                  {isSettled ? <ShieldCheck size={17} /> : isCashRegistration ? <Banknote size={17} /> : <Clock3 size={17} />}
                </span>
                <div className="min-w-0">
                  <p className={`text-[11px] font-bold uppercase tracking-[0.12em] user-text ${
                    isSettled ? 'text-green-700' : isCashRegistration ? 'text-emerald-800' : 'text-amber-700'
                  }`}>
                    {isCashRegistration
                      ? (isCashCollected ? 'Cash received' : 'Cash — pending collection')
                      : (isPaid ? 'Payment received' : 'Payment pending')}
                  </p>
                  <p className="text-[11px] font-medium text-ink-muted mt-0.5 leading-snug user-text">
                    {isCashRegistration
                      ? (isCashCollected
                        ? 'The yatra team has recorded your cash payment.'
                        : `Pay ${inr(myRegistration.amountDue)} at the FOLK office — staff confirm your seat once the cash is received.`)
                      : (isPaid
                        ? `${inr(myPayment.amount)} confirmed by our server.`
                        : myRegistration.paymentOrderId
                          ? 'We have not seen a confirmed payment for this booking yet.'
                          : onlineAvailable
                            ? 'Pay online now to confirm your seat.'
                            : 'The yatra team will confirm your seat and arrange payment with you.')}
                  </p>
                  {isCashRegistration && !isCashCollected && trip.contactPhone && (
                    <a
                      href={`tel:${String(trip.contactPhone).replace(/\s/g, '')}`}
                      className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 hover:underline user-text"
                    >
                      <Phone size={12} className="shrink-0" /> {trip.contactPhone}
                    </a>
                  )}
                </div>
              </div>

              {(myRegistration.status || '').toLowerCase() === 'pending' && (
                <>
                  {/* Unpaid online booking: finish paying for THIS registration
                      (the old button only offered to book more seats). */}
                  {!isSettled && !isCashRegistration && onlineAvailable && (
                    <button
                      type="button"
                      onClick={payExisting}
                      disabled={payingExisting}
                      className="btn-primary w-full"
                    >
                      {payingExisting ? <Loader2 size={16} className="animate-spin shrink-0" /> : <CreditCard size={16} className="shrink-0" />}
                      {payingExisting ? 'Opening payment…' : `Pay ${inr(payNowFor(parseInt(myRegistration.seats, 10) || 1))} now`}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={cancelling}
                    className="w-full min-h-[44px] rounded-2xl bg-red-50 text-red-500 font-bold uppercase tracking-[0.14em] text-[10px] hover:bg-red-100 transition-colors disabled:opacity-60 inline-flex items-center justify-center gap-2"
                  >
                    {cancelling ? <Loader2 size={15} className="animate-spin shrink-0" /> : <X size={15} className="shrink-0" />}
                    {cancelling ? 'Cancelling…' : 'Cancel registration'}
                  </button>
                </>
              )}

              {myRegistration.staffNotes && (
                <p className="text-xs text-ink-muted bg-cream/60 rounded-xl p-3 leading-relaxed user-text">
                  &ldquo;{myRegistration.staffNotes}&rdquo;
                </p>
              )}
            </div>
          ) : blockedReason ? (
            <div className="rounded-2xl bg-paper border border-line p-4 flex items-start gap-3 user-text-box">
              <AlertTriangle size={17} className="text-ink-muted shrink-0 mt-0.5" />
              <p className="text-xs font-semibold text-ink-muted leading-relaxed user-text">{blockedReason}</p>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="w-full min-h-[52px] rounded-2xl bg-saffron text-white font-bold uppercase tracking-[0.14em] text-[11px] shadow-lg hover:brightness-105 transition-all inline-flex items-center justify-center gap-2"
              >
                <Ticket size={16} className="shrink-0" />
                {noPaymentAvailable ? 'Request a seat' : cashAvailable && !onlineAvailable ? 'Register & pay cash' : 'Book & pay online'}
              </button>
              <p className="text-[11px] text-ink-muted font-medium text-center leading-relaxed">
                {noPaymentAvailable
                  ? 'Your request goes to the yatra team, who confirm your seat and arrange payment with you.'
                  : advance > 0
                    ? `Pay ${inr(advance)} per person now, the rest before departure.`
                    : bothAvailable
                      ? 'Pay online now, or in cash at the FOLK office.'
                      : cashAvailable
                        ? 'Reserve now and pay in cash at the FOLK office.'
                        : 'Add traveller details and pay by UPI, card or net-banking.'}
              </p>
            </>
          )}
        </div>

        {waHref && (
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full min-h-[44px] rounded-2xl border border-saffron/20 text-saffron-dark font-bold uppercase tracking-[0.14em] text-[10px] hover:bg-saffron/5 transition-colors inline-flex items-center justify-center gap-2"
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
            className="absolute inset-0 w-full max-w-full h-full object-cover opacity-70"
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
              className="inline-flex items-center gap-2 min-h-[44px] px-4 rounded-full bg-white/10 border border-white/20 text-white/85 text-[10px] font-bold uppercase tracking-label hover:bg-white/20 transition-colors"
            >
              <ArrowLeft size={15} /> All trips
            </button>

            <motion.div
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="mt-5 sm:mt-6 max-w-3xl min-w-0"
            >
              <div className="flex flex-wrap items-center gap-2 user-text-box">
                <span className={`px-3.5 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-label ${STATUS_PILL[tripStatus] || STATUS_PILL.upcoming}`}>
                  {statusLabel(tripStatus)}
                </span>
                {trip.durationLabel && (
                  <span className="max-w-full px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/85 text-[9px] font-bold uppercase tracking-label user-text">
                    {trip.durationLabel}
                  </span>
                )}
                {trip.registrationOpen === false && tripStatus !== 'completed' && tripStatus !== 'cancelled' && (
                  <span className="px-3.5 py-1.5 rounded-full bg-white text-ink text-[9px] font-bold uppercase tracking-label">
                    Registration closed
                  </span>
                )}
              </div>

              <h1
                className="mt-4 sm:mt-5 font-display font-semibold tracking-[-0.01em] leading-[1.06] sm:leading-[1.02] text-white user-text"
                style={{ fontSize: 'clamp(1.75rem, 6.6vw, 4.25rem)' }}
              >
                {trip.title}
              </h1>

              {trip.subtitle && (
                <p className="mt-3 sm:mt-4 text-white/75 leading-[1.65] sm:leading-[1.7] max-w-xl text-[14px] sm:text-lg user-text">{trip.subtitle}</p>
              )}

              <div className="mt-6 sm:mt-7 flex flex-wrap gap-x-6 sm:gap-x-7 gap-y-4 user-text-box">
                <div className="flex items-center gap-3 min-w-0 max-w-full">
                  <span className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                    <Calendar size={17} className="text-gold" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[9px] font-bold text-white/45 uppercase tracking-[0.14em]">When</p>
                    <p className="text-[13px] sm:text-sm font-bold text-white tracking-tight user-text">{formatDateRange(trip.startDate, trip.endDate)}</p>
                  </div>
                </div>
                {trip.location && (
                  <div className="flex items-center gap-3 min-w-0 max-w-full">
                    <span className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                      <MapPin size={17} className="text-saffron" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[9px] font-bold text-white/45 uppercase tracking-[0.14em]">Where</p>
                      <p className="text-[13px] sm:text-sm font-bold text-white tracking-tight truncate user-text">{trip.location}</p>
                    </div>
                  </div>
                )}
                {price > 0 && (
                  <div className="flex items-center gap-3 min-w-0 max-w-full">
                    <span className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                      <Ticket size={17} className="text-gold" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[9px] font-bold text-white/45 uppercase tracking-[0.14em]">From</p>
                      <p className="text-[13px] sm:text-sm font-bold text-white tracking-tight user-text">{inr(price)} / person</p>
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
                      : 'bg-white border-saffron/20 text-ink-muted'
                }`}
              >
                {notice.tone === 'success' ? <CheckCircle2 size={18} className="shrink-0 mt-0.5" /> : <Info size={18} className="shrink-0 mt-0.5" />}
                <p className="text-xs sm:text-sm font-semibold leading-relaxed flex-1 min-w-0 user-text">{notice.text}</p>
                <button
                  type="button"
                  onClick={() => setNotice(null)}
                  aria-label="Dismiss message"
                  className="w-11 h-11 -m-1.5 shrink-0 rounded-lg hover:bg-black/5 flex items-center justify-center"
                >
                  <X size={15} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-10 user-text-box">
            {/* ---------- Booking rail (first on mobile, right on desktop) ---------- */}
            <aside className="order-1 lg:order-2 lg:col-span-1 min-w-0">
              <div className="lg:sticky lg:top-6 space-y-5">{bookingPanel}</div>
            </aside>

            {/* ---------- Main content ---------- */}
            <div className="order-2 lg:order-1 lg:col-span-2 min-w-0 space-y-6 sm:space-y-10">
              {/* Nothing written up yet — say so gracefully rather than
                  dropping the reader straight onto the contact band. */}
              {!trip.description && highlights.length === 0 && itinerary.length === 0
                && inclusions.length === 0 && exclusions.length === 0 && gallery.length === 0 && (
                <section className="bg-white rounded-xl sm:rounded-xl shadow-premium border border-dashed border-saffron/25 p-6 sm:p-10 text-center user-text-box">
                  <div className="relative w-16 h-16 mx-auto mb-5">
                    <span className="absolute inset-0 rounded-3xl bg-saffron/10 blur-xl" aria-hidden="true" />
                    <span className="relative w-16 h-16 rounded-3xl bg-saffron text-saffron flex items-center justify-center ring-1 ring-saffron/15">
                      <Compass size={26} />
                    </span>
                  </div>
                  <h2 className="text-[15px] sm:text-lg font-bold text-ink tracking-tight">Full details coming soon</h2>
                  <p className="mt-2 text-[13px] sm:text-sm text-ink-muted font-medium leading-relaxed max-w-sm mx-auto">
                    The itinerary and inclusions for this yatra are still being written up.
                    The dates and price beside this are confirmed — reserve your seat, or ask the team anything.
                  </p>
                </section>
              )}

              {/* About */}
              {trip.description && (
                <section className="bg-white rounded-xl sm:rounded-xl shadow-premium border border-saffron/5 p-5 sm:p-9 user-text-box">
                  <SectionHeading icon={<Compass size={13} />} eyebrow="About this yatra" title="The journey" />
                  <p className="text-[14px] sm:text-[15px] text-ink-muted leading-[1.8] sm:leading-[1.85] font-medium whitespace-pre-line user-text">
                    {trip.description}
                  </p>
                </section>
              )}

              {/* Highlights */}
              {highlights.length > 0 && (
                <section className="bg-white rounded-xl sm:rounded-xl shadow-premium border border-saffron/5 p-5 sm:p-9 user-text-box">
                  <SectionHeading icon={<Sparkles size={13} />} eyebrow="Highlights" title="What makes this special" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {highlights.map((h, i) => (
                      <div key={i} className="flex items-start gap-3 p-4 rounded-2xl bg-cream/60 border border-saffron/10 min-w-0">
                        <span className="w-7 h-7 shrink-0 rounded-lg bg-saffron text-white flex items-center justify-center mt-0.5">
                          <Check size={14} />
                        </span>
                        <p className="text-[13px] sm:text-sm font-semibold text-ink-soft leading-relaxed min-w-0 user-text">{h}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Itinerary */}
              {itinerary.length > 0 && (
                <section className="bg-white rounded-xl sm:rounded-xl shadow-premium border border-saffron/5 p-5 sm:p-9 user-text-box">
                  <SectionHeading icon={<MapIcon size={13} />} eyebrow="Day by day" title="The itinerary" />
                  <ol className="relative space-y-6 sm:space-y-7">
                    {/* Timeline spine */}
                    <span className="absolute left-[19px] sm:left-[23px] top-3 bottom-3 w-px bg-gradient-to-b from-saffron/50 via-saffron/20 to-transparent" aria-hidden="true" />
                    {itinerary.map((item, i) => (
                      <li key={i} className="relative flex gap-4 sm:gap-5 min-w-0">
                        <span className="relative z-10 w-10 h-10 sm:w-12 sm:h-12 shrink-0 rounded-2xl bg-saffron text-white flex flex-col items-center justify-center shadow-lg">
                          <span className="text-[7px] font-bold uppercase tracking-[0.1em] leading-none opacity-80">Day</span>
                          <span className="max-w-full px-1 text-sm sm:text-base font-bold leading-none mt-0.5 truncate">{item.day ?? i + 1}</span>
                        </span>
                        <div className="min-w-0 max-w-full pt-1 pb-1">
                          <h3 className="text-[14px] sm:text-base font-bold text-ink tracking-tight leading-snug user-text">{item.title || `Day ${item.day ?? i + 1}`}</h3>
                          {item.details && (
                            <p className="mt-1.5 text-[13px] sm:text-sm text-ink-muted font-medium leading-[1.75] sm:leading-[1.8] whitespace-pre-line user-text">{item.details}</p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ol>
                </section>
              )}

              {/* Inclusions / exclusions */}
              {(inclusions.length > 0 || exclusions.length > 0) && (
                <section className="bg-white rounded-xl sm:rounded-xl shadow-premium border border-saffron/5 p-5 sm:p-9 user-text-box">
                  <SectionHeading icon={<Info size={13} />} eyebrow="The fine print" title="What's included" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-8">
                    <div className="min-w-0">
                      <h3 className="text-[10px] font-bold uppercase tracking-label text-green-600 mb-4 flex items-center gap-2">
                        <CheckCircle2 size={14} className="shrink-0" /> Included
                      </h3>
                      {inclusions.length === 0 ? (
                        <p className="text-[13px] sm:text-sm text-ink-muted">Details shared on confirmation.</p>
                      ) : (
                        <ul className="space-y-2.5">
                          {inclusions.map((item, i) => (
                            <li key={i} className="flex items-start gap-2.5 text-[13px] sm:text-sm text-ink-muted font-medium leading-relaxed min-w-0">
                              <Check size={16} className="text-green-500 shrink-0 mt-0.5" />
                              <span className="min-w-0 user-text">{item}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div className="min-w-0 pt-5 border-t border-line sm:pt-0 sm:border-t-0 sm:border-l sm:border-line sm:pl-8">
                      <h3 className="text-[10px] font-bold uppercase tracking-label text-red-500 mb-4 flex items-center gap-2">
                        <XCircle size={14} className="shrink-0" /> Not included
                      </h3>
                      {exclusions.length === 0 ? (
                        <p className="text-[13px] sm:text-sm text-ink-muted">Nothing listed.</p>
                      ) : (
                        <ul className="space-y-2.5">
                          {exclusions.map((item, i) => (
                            <li key={i} className="flex items-start gap-2.5 text-[13px] sm:text-sm text-ink-muted font-medium leading-relaxed min-w-0">
                              <X size={16} className="text-red-400 shrink-0 mt-0.5" />
                              <span className="min-w-0 user-text">{item}</span>
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
                <section className="bg-white rounded-xl sm:rounded-xl shadow-premium border border-saffron/5 p-5 sm:p-9 user-text-box">
                  <SectionHeading icon={<Camera size={13} />} eyebrow="Gallery" title="A glimpse" />
                  <div className={`grid gap-3 ${gallery.length === 1 ? 'grid-cols-1' : 'grid-cols-2 sm:grid-cols-3'}`}>
                    {gallery.map((src, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setLightbox(src)}
                        aria-label={`Open gallery image ${i + 1}`}
                        className={`group relative overflow-hidden rounded-2xl bg-cream aspect-[4/3] min-w-0 ${gallery.length === 3 && i === 0 ? 'col-span-2 sm:col-span-1' : ''}`}
                      >
                        <img src={src} alt={`${trip.title} photo ${i + 1}`} loading="lazy" className="w-full max-w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                        <span className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" aria-hidden="true" />
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {/* Meeting point */}
              {(trip.meetingPoint || trip.startDate) && (
                <section className="bg-white rounded-xl sm:rounded-xl shadow-premium border border-saffron/5 p-5 sm:p-9 user-text-box">
                  <SectionHeading icon={<MapPin size={13} />} eyebrow="Logistics" title="Where we meet" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 sm:p-5 rounded-2xl bg-cream/60 border border-saffron/10 min-w-0">
                      <p className="text-[9px] font-bold text-ink-muted uppercase tracking-[0.14em]">Meeting point</p>
                      <p className="mt-2 text-[13px] sm:text-sm font-bold text-ink leading-relaxed user-text">
                        {trip.meetingPoint || 'Shared with confirmed travellers.'}
                      </p>
                    </div>
                    <div className="p-4 sm:p-5 rounded-2xl bg-cream/60 border border-saffron/10 min-w-0">
                      <p className="text-[9px] font-bold text-ink-muted uppercase tracking-[0.14em]">Departure &amp; return</p>
                      <p className="mt-2 text-[13px] sm:text-sm font-bold text-ink leading-relaxed user-text">
                        {formatLong(trip.startDate)} &rarr; {formatLong(trip.endDate)}
                      </p>
                    </div>
                  </div>
                </section>
              )}

              {/* Contact — dark anchor band */}
              <section className="relative overflow-hidden rounded-xl sm:rounded-xl bg-[#0B0A09] text-white">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(255,153,51,0.32),transparent_60%)]" aria-hidden="true" />
                <div className="relative z-10 p-5 sm:p-10 flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-6 justify-between">
                  <div className="min-w-0">
                    <h3 className="text-base sm:text-xl font-bold tracking-tight">Questions before you book?</h3>
                    <p className="mt-2 text-[13px] sm:text-sm text-white/60 font-medium leading-relaxed max-w-md user-text">
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
                        className="min-h-[48px] px-6 rounded-2xl bg-saffron text-white font-bold uppercase tracking-[0.14em] text-[10px] hover:brightness-110 transition-all inline-flex items-center justify-center gap-2"
                      >
                        <MessageCircle size={15} /> WhatsApp us
                      </a>
                    )}
                    {trip.contactPhone && (
                      <a
                        href={`tel:${String(trip.contactPhone).replace(/\s/g, '')}`}
                        className="min-h-[48px] px-6 rounded-2xl border border-white/25 bg-white/5 text-white font-bold uppercase tracking-[0.14em] text-[10px] hover:bg-white hover:text-ink transition-all inline-flex items-center justify-center gap-2"
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
                  <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-4">
                    {otherTrips.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => openTrip && openTrip(t.slug)}
                        aria-label={`${t.title || 'Trip'} — view details`}
                        className="group text-left bg-white rounded-2xl overflow-hidden shadow-premium border border-saffron/5 hover:shadow-premium-xl hover:-translate-y-1 transition-all min-w-0"
                      >
                        <div className="h-24 overflow-hidden bg-saffron">
                          {t.coverImage && (
                            <img src={t.coverImage} alt="" loading="lazy" className="w-full max-w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                          )}
                        </div>
                        <div className="p-4 min-w-0">
                          <p className="text-[13px] sm:text-sm font-bold text-ink tracking-tight line-clamp-2 user-text">{t.title}</p>
                          <p className="mt-1.5 text-[10px] font-bold text-ink-muted uppercase tracking-[0.12em] flex items-center gap-1.5 min-w-0">
                            <Calendar size={11} className="text-saffron shrink-0" />
                            <span className="truncate min-w-0">{formatDateRange(t.startDate, t.endDate)}</span>
                          </p>
                          <span className="mt-3 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.14em] text-saffron-dark">
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
          <div className="h-28 lg:hidden" aria-hidden="true" />
          <div
            className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-saffron/10 px-4 pt-3 flex items-center gap-3 sm:gap-4"
            style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
          >
            <div className="min-w-0 shrink">
              <p className="text-base sm:text-lg font-bold text-ink leading-none tracking-tight truncate">
                {price > 0 ? inr(price) : 'By seva'}
              </p>
              <p className="text-[9px] font-bold text-ink-muted uppercase tracking-[0.12em] mt-1 truncate">
                {price > 0 ? 'Per person' : 'No fixed fee'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => (user ? setModalOpen(true) : (markResume(trip?.slug || slug), onLoginClick && onLoginClick()))}
              className="flex-1 min-w-0 min-h-[48px] px-3 rounded-2xl bg-saffron text-white font-bold uppercase tracking-[0.12em] text-[10px] xs:text-[11px] shadow-lg inline-flex items-center justify-center gap-2"
            >
              <Ticket size={16} className="shrink-0" />
              <span className="truncate">
                {!user
                  ? 'Sign in to register'
                  : noPaymentAvailable
                    ? 'Request a seat'
                    : cashAvailable && !onlineAvailable
                      ? 'Register & pay cash'
                      : 'Book & pay'}
              </span>
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
              className="absolute inset-0 bg-ink/60"
            />
            <motion.div
              initial={{ scale: 0.94, y: 28, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.94, y: 28, opacity: 0 }}
              className="relative w-full max-w-lg bg-white rounded-xl sm:rounded-xl shadow-premium-xl border border-saffron/10 overflow-y-auto overscroll-contain max-h-[90vh] p-5 sm:p-9 user-text-box"
            >
              <button
                type="button"
                onClick={() => !submitting && setModalOpen(false)}
                aria-label="Close registration form"
                className="absolute top-3 right-3 sm:top-4 sm:right-4 w-11 h-11 rounded-full hover:bg-paper flex items-center justify-center text-ink-muted transition-colors"
              >
                <X size={21} />
              </button>

              <div className="mb-6 sm:mb-7 pr-12 user-text-box">
                <div className="w-12 h-12 sm:w-[52px] sm:h-[52px] bg-saffron rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                  <Ticket className="text-white" size={24} />
                </div>
                <h2 className="text-lg sm:text-2xl font-bold text-ink tracking-tight">
                  {noPaymentAvailable ? 'Request a seat' : onlineAvailable ? 'Book your seat' : 'Reserve your seat'}
                </h2>
                <p className="text-ink-muted text-[13px] sm:text-sm font-medium mt-1.5 user-text">{trip.title}</p>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  // The submit button carries whichever method is in force.
                  handleRegister(submitMode)
                }}
                className="space-y-5"
              >
                {/* Seats */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-ink-muted uppercase tracking-label ml-1">Travellers</label>
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      aria-label="Decrease number of travellers"
                      onClick={() => adjustSeats(-1)}
                      className="w-12 h-12 shrink-0 rounded-2xl bg-cream/70 border border-saffron/10 flex items-center justify-center text-saffron hover:bg-saffron/10 transition-colors"
                    >
                      <Minus size={18} />
                    </button>
                    <span className="flex-1 text-center text-2xl font-bold text-ink tracking-tight">{seats}</span>
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
                    <p className="text-[11px] text-ink-muted font-semibold ml-1">{seatsLeft} seat{seatsLeft === 1 ? '' : 's'} left · up to 20 per registration</p>
                  )}
                </div>

                {/* One row per traveller: the yatra team needs names and ages for tickets and rooms. */}
                <fieldset className="space-y-3">
                  <legend className="text-[13px] font-semibold text-ink mb-1">Traveller details</legend>
                  {(form.travellers || []).slice(0, seats).map((t, i) => (
                    <div key={i} className="rounded-xl border border-line bg-paper/60 p-3 grid grid-cols-[1fr_5rem] sm:grid-cols-[1fr_5rem_8rem] gap-2">
                      <label className="col-span-2 sm:col-span-1 min-w-0">
                        <span className="block text-[12px] text-ink-muted mb-1">{i === 0 ? 'Traveller 1 (you)' : `Traveller ${i + 1}`} · full name</span>
                        <input
                          type="text"
                          required
                          value={t.name}
                          onChange={(e) => setForm((f) => ({ ...f, travellers: f.travellers.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)) }))}
                          placeholder="As on ID card"
                          className="w-full min-h-[44px] px-3 rounded-lg border border-line bg-white outline-none focus:border-saffron text-[15px]"
                        />
                      </label>
                      <label className="min-w-0">
                        <span className="block text-[12px] text-ink-muted mb-1">Age</span>
                        <input
                          type="number"
                          inputMode="numeric"
                          min={1}
                          max={109}
                          required
                          value={t.age}
                          onChange={(e) => setForm((f) => ({ ...f, travellers: f.travellers.map((x, j) => (j === i ? { ...x, age: e.target.value } : x)) }))}
                          className="w-full min-h-[44px] px-3 rounded-lg border border-line bg-white outline-none focus:border-saffron text-[15px]"
                        />
                      </label>
                      <label className="min-w-0">
                        <span className="block text-[12px] text-ink-muted mb-1">Gender</span>
                        <select
                          value={t.gender}
                          onChange={(e) => setForm((f) => ({ ...f, travellers: f.travellers.map((x, j) => (j === i ? { ...x, gender: e.target.value } : x)) }))}
                          className="w-full min-h-[44px] px-2 rounded-lg border border-line bg-white outline-none focus:border-saffron text-[15px]"
                        >
                          <option value="">—</option>
                          {GENDERS.map((g) => <option key={g}>{g}</option>)}
                        </select>
                      </label>
                    </div>
                  ))}
                </fieldset>

                {trip.meetingPoint ? (
                  <p className="text-[14px] text-ink-muted">Meeting point: <span className="font-semibold text-ink">{trip.meetingPoint}</span></p>
                ) : (
                  <label className="block">
                    <span className="block text-[13px] font-semibold text-ink mb-1">Boarding / pick-up point (optional)</span>
                    <input
                      type="text"
                      value={form.pickup}
                      onChange={(e) => setForm((f) => ({ ...f, pickup: e.target.value }))}
                      placeholder="e.g. RTC Complex, MVP Colony"
                      className="w-full min-h-[48px] px-4 rounded-xl border border-line bg-white outline-none focus:border-saffron text-[15px]"
                    />
                  </label>
                )}

                {/* ---- Payment method: only a real choice gets a chooser ---- */}
                {bothAvailable && (
                  <fieldset className="space-y-2">
                    <legend className="text-[10px] font-bold text-ink-muted uppercase tracking-label ml-1 mb-2">How would you like to pay?</legend>
                    <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
                      {[
                        {
                          id: 'online',
                          icon: <CreditCard size={18} />,
                          title: 'Pay online now',
                          body: `${inr(payNow)} by UPI, card or netbanking. Your seat is marked paid as soon as our server confirms it.`,
                        },
                        {
                          id: 'cash',
                          icon: <Banknote size={18} />,
                          title: 'Pay cash at the office',
                          body: `Reserve now and hand over ${inr(payNow)} at the FOLK office. Staff confirm the seat when they receive it.`,
                        },
                      ].map((opt) => {
                        const active = payMethod === opt.id
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setPayMethod(opt.id)}
                            aria-pressed={active}
                            className={`text-left min-h-[44px] p-4 rounded-2xl border-2 transition-all min-w-0 ${
                              active
                                ? 'border-saffron bg-saffron/5 shadow-md'
                                : 'border-line bg-white hover:border-saffron/40'
                            }`}
                          >
                            <span className="flex items-center gap-2.5">
                              <span className={`w-9 h-9 shrink-0 rounded-xl flex items-center justify-center ${
                                active ? 'bg-saffron text-white' : 'bg-cream text-saffron'
                              }`}>
                                {opt.icon}
                              </span>
                              <span className="text-[12px] font-bold text-ink tracking-tight leading-tight min-w-0 user-text">{opt.title}</span>
                              {active && <Check size={16} className="ml-auto shrink-0 text-saffron" />}
                            </span>
                            <span className="block mt-2 text-[11px] font-medium text-ink-muted leading-snug user-text">{opt.body}</span>
                          </button>
                        )
                      })}
                    </div>
                  </fieldset>
                )}

                {/* Contact */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2 min-w-0">
                    <label htmlFor="trip-phone" className="block text-[10px] font-bold text-ink-muted uppercase tracking-label ml-1">Phone</label>
                    <input
                      id="trip-phone"
                      type="tel"
                      required
                      size={1}
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="10-digit mobile"
                      className="w-full min-w-0 min-h-[48px] px-4 py-3 bg-cream/30 border border-saffron/10 rounded-xl outline-none focus:bg-white focus:border-saffron/40 transition-all font-medium text-[15px]"
                    />
                  </div>
                  <div className="space-y-2 min-w-0">
                    <label htmlFor="trip-email" className="block text-[10px] font-bold text-ink-muted uppercase tracking-label ml-1">Email</label>
                    <input
                      id="trip-email"
                      type="email"
                      size={1}
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="you@example.com"
                      className="w-full min-w-0 min-h-[48px] px-4 py-3 bg-cream/30 border border-saffron/10 rounded-xl outline-none focus:bg-white focus:border-saffron/40 transition-all font-medium text-[15px]"
                    />
                  </div>
                </div>

                <div className="space-y-2 min-w-0">
                  <label htmlFor="trip-emergency" className="block text-[10px] font-bold text-ink-muted uppercase tracking-label ml-1">Emergency contact</label>
                  <input
                    id="trip-emergency"
                    type="text"
                    required
                    size={1}
                    value={form.emergencyContact}
                    onChange={(e) => setForm({ ...form, emergencyContact: e.target.value })}
                    placeholder="Name & number of someone at home"
                    className="w-full min-w-0 min-h-[48px] px-4 py-3 bg-cream/30 border border-saffron/10 rounded-xl outline-none focus:bg-white focus:border-saffron/40 transition-all font-medium text-[15px]"
                  />
                </div>

                <div className="space-y-2 min-w-0">
                  <label htmlFor="trip-notes" className="block text-[10px] font-bold text-ink-muted uppercase tracking-label ml-1">Traveller notes (optional)</label>
                  <textarea
                    id="trip-notes"
                    rows={3}
                    value={form.travellerNotes}
                    onChange={(e) => setForm({ ...form, travellerNotes: e.target.value })}
                    placeholder="Dietary needs, health notes, anything the team should know…"
                    className="w-full min-w-0 bg-cream/30 border border-saffron/10 rounded-2xl px-4 py-3 outline-none focus:bg-white focus:border-saffron/40 transition-all font-medium text-[15px] resize-none"
                  />
                </div>

                {/* Price breakdown */}
                <div className="rounded-2xl bg-cream/60 border border-saffron/10 p-4 sm:p-5 space-y-2.5 user-text-box">
                  <div className="flex items-center justify-between gap-3 text-[13px] sm:text-sm">
                    <span className="text-ink-muted font-semibold min-w-0">{inr(price)} × {seats} traveller{seats === 1 ? '' : 's'}</span>
                    <span className="font-bold text-ink shrink-0">{inr(total)}</span>
                  </div>
                  {advance > 0 && (
                    <>
                      <div className="flex items-center justify-between gap-3 text-[13px] sm:text-sm">
                        <span className="text-ink-muted font-semibold min-w-0">Advance now ({inr(advance)} / person)</span>
                        <span className="font-bold text-saffron-dark shrink-0">{inr(payNow)}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3 text-[13px] sm:text-sm pt-2.5 border-t border-saffron/10">
                        <span className="text-ink-muted font-semibold min-w-0">Balance before departure</span>
                        <span className="font-bold text-ink shrink-0">{inr(balance)}</span>
                      </div>
                    </>
                  )}
                  {advance === 0 && (
                    <div className="flex items-center justify-between gap-3 text-sm pt-2.5 border-t border-saffron/10">
                      <span className="text-ink-muted font-bold uppercase tracking-[0.1em] text-[10px] min-w-0">
                        {noPaymentAvailable ? 'Total' : effectiveMethod === 'cash' ? 'Payable at the office' : 'Payable now'}
                      </span>
                      <span className="font-bold text-saffron-dark text-base shrink-0">{inr(total)}</span>
                    </div>
                  )}
                </div>

                {/* Cash: say exactly what happens next, before they commit. */}
                {effectiveMethod === 'cash' && !noPaymentAvailable && (
                  <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 flex items-start gap-3 user-text-box">
                    <Building2 size={17} className="text-emerald-600 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-emerald-900 uppercase tracking-[0.1em]">Paying in cash</p>
                      <p className="mt-1 text-xs font-semibold text-emerald-800 leading-relaxed user-text">
                        Your seat is held as <span className="font-bold">pending</span> the moment you register.
                        Hand {inr(payNow)} to the yatra team at the FOLK office — they confirm the seat once the cash is received.
                        {trip.contactPhone ? ` Call ${trip.contactPhone} if you need directions.` : ''}
                      </p>
                    </div>
                  </div>
                )}

                {/* No method on offer at all */}
                {noPaymentAvailable && (
                  <div className={`rounded-2xl p-4 flex items-start gap-3 user-text-box ${
                    total > 0 ? 'bg-amber-50 border border-amber-200' : 'bg-cream/70 border border-saffron/15'
                  }`}>
                    {total > 0
                      ? <AlertTriangle size={17} className="text-amber-500 shrink-0 mt-0.5" />
                      : <Info size={17} className="text-saffron shrink-0 mt-0.5" />}
                    <p className={`text-xs font-semibold leading-relaxed user-text ${total > 0 ? 'text-amber-800' : 'text-ink-muted'}`}>
                      {total === 0
                        ? 'There is nothing to pay for this yatra. '
                        : isOnlineEnabled(trip) && !razorpayReady
                          ? 'Online payment isn’t switched on for this site yet. '
                          : 'No payment method is open for this yatra right now. '}
                      Your registration is saved as
                      <span className="font-bold"> pending</span> and the yatra team will confirm your
                      seat{total > 0 ? ' and arrange payment with you directly' : ''}.
                      {trip.contactPhone ? ` Call or WhatsApp ${trip.contactPhone}.` : ''}
                    </p>
                  </div>
                )}

                {formError && (
                  <div className="rounded-2xl bg-red-50 border border-red-200 p-4 flex items-start gap-3 user-text-box" role="alert">
                    <XCircle size={17} className="text-red-500 shrink-0 mt-0.5" />
                    <p className="text-xs font-semibold text-red-600 leading-relaxed user-text">{formError}</p>
                  </div>
                )}

                <div className="space-y-3 pt-1">
                  <button
                    type="submit"
                    disabled={!!submitting}
                    className="w-full min-h-[52px] px-4 rounded-2xl bg-saffron text-white font-bold uppercase tracking-[0.13em] text-[11px] shadow-lg hover:brightness-105 transition-all disabled:opacity-50 inline-flex items-center justify-center gap-2"
                  >
                    {submitting
                      ? <Loader2 size={17} className="animate-spin shrink-0" />
                      : submitMode === 'cash'
                        ? <Banknote size={17} className="shrink-0" />
                        : submitMode === 'later'
                          ? <Clock3 size={17} className="shrink-0" />
                          : <CreditCard size={17} className="shrink-0" />}
                    <span className="min-w-0 user-text">
                      {submitting === 'pay'
                        ? 'Opening checkout…'
                        : submitting
                          ? 'Reserving…'
                          : submitMode === 'cash'
                            ? 'Register & pay cash'
                            : submitMode === 'later'
                              ? 'Send my request'
                              : `Register & pay ${inr(payNow)}`}
                    </span>
                  </button>

                  <p className="text-[13px] text-ink-muted text-center leading-relaxed">
                    {submitMode === 'pay'
                      ? 'Pay by UPI, card or net-banking. Your seat is confirmed as soon as the payment goes through.'
                      : effectiveMethod === 'cash' && !noPaymentAvailable
                        ? 'Your seat is held as pending and confirmed by the yatra team when they receive the cash.'
                        : 'Your request goes to the yatra team, who confirm your seat and arrange payment with you.'}
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
              className="absolute inset-0 bg-ink/85"
            />
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl sm:rounded-xl bg-black"
            >
              <button
                type="button"
                onClick={() => setLightbox(null)}
                aria-label="Close image"
                className="absolute top-3 right-3 z-10 w-11 h-11 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
              >
                <X size={21} />
              </button>
              <img src={lightbox} alt={`${trip.title} photo`} className="w-full max-w-full h-auto object-contain" />
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
