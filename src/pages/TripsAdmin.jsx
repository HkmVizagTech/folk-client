import React, { useState, useMemo, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bus, Plus, X, Loader2, Edit3, Copy, Trash2, ExternalLink, Search, Download,
  Image as ImageIcon, Calendar, MapPin, IndianRupee, Users, CheckCircle2, XCircle,
  Clock, Ban, AlertTriangle, ChevronUp, ChevronDown, ChevronLeft, ListOrdered,
  Sparkles, ShieldCheck, ToggleLeft, ToggleRight, Wallet, FileText, MessageSquare,
  Hourglass, Layers, Phone, Mail, Banknote, CreditCard, Undo2, HandCoins
} from 'lucide-react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { useFirestore } from '../hooks/useFirestore'
import { useAuth } from '../hooks/useAuth'
import { auth, db } from '../lib/firebase'
import {
  collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp
} from '../lib/pgstore'
import {
  uploadImage, deleteUploadedImage, getUploadConfig, isUploadedUrl
} from '../lib/uploads'

/* ------------------------------------------------------------------ *
 *  Constants & small helpers
 * ------------------------------------------------------------------ */

const TRIP_STATUSES = ['draft', 'upcoming', 'ongoing', 'completed', 'cancelled']
const REG_STATUSES = ['pending', 'confirmed', 'waitlisted', 'cancelled']

// Images now live in the R2 bucket and the trip document only ever holds their
// URLs, so there is no document-size ceiling to police here any more.
const GALLERY_MAX = 3

const MODAL_SECTIONS = [
  { key: 'basics', label: 'Basics', icon: FileText },
  { key: 'dates', label: 'Dates & Pricing', icon: Calendar },
  { key: 'media', label: 'Media', icon: ImageIcon },
  { key: 'itinerary', label: 'Itinerary', icon: ListOrdered },
  { key: 'locations', label: 'Locations', icon: MapPin },
  { key: 'inclusions', label: 'Inclusions', icon: Layers },
]

// What the upload helper's onProgress phases are called in the UI.
const UPLOAD_PHASE_LABEL = {
  compressing: 'Compressing…',
  requesting: 'Preparing…',
  uploading: 'Uploading…',
}

// Stable key for a location row — React keys and reordering both depend on it.
const newLocationId = () => {
  const uuid = globalThis.crypto?.randomUUID?.()
  if (uuid) return uuid
  return `loc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

const EMPTY_FORM = {
  slug: '',
  title: '',
  subtitle: '',
  location: '',
  description: '',
  coverImage: '',
  gallery: [],
  startDate: '',
  endDate: '',
  durationLabel: '',
  price: '',
  // What the yatra really costs, when the temple is subsidising it. Shown
  // struck through beside the price so devotees can see the gift.
  originalPrice: '',
  advanceAmount: '',
  capacity: '',
  // 'Boys only', 'Girls only', or blank when everybody is welcome.
  eligibility: '',
  status: 'draft',
  registrationOpen: false,
  // Payment rails the devotee is offered. Online defaults ON so an existing
  // trip that predates these fields keeps behaving exactly as before.
  onlinePaymentEnabled: true,
  cashPaymentEnabled: false,
  highlights: [],
  itinerary: [],
  // The places this yatra visits — each with its own photo and a line or two.
  locations: [],
  inclusions: [],
  exclusions: [],
  meetingPoint: '',
  contactPhone: '',
}

const slugify = (value) =>
  String(value || '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)

const toNumber = (value) => {
  const n = parseFloat(value)
  return Number.isFinite(n) ? n : 0
}

/** Travellers as one readable cell: "Ravi | 21 | Male | aadhaar 1234…" each on its own line. */
const travellerSummary = (reg) => (reg.travellers || [])
  .map((t) => [t.name, t.age, t.gender, [t.idType, t.idNumber].filter(Boolean).join(' ')]
    .filter((x) => x !== undefined && x !== null && x !== '')
    .join(' | '))
  .filter(Boolean)
  .join('\n');

/** Where each traveller studies or works, one per line. */
const studentSummary = (reg) => (reg.travellers || [])
  .map((t) => [t.name, t.college, t.course, t.year].filter(Boolean).join(' | '))
  .filter(Boolean)
  .join('\n');

/** Has everything a ticket needs, for every seat. */
const detailsComplete = (reg) => {
  const seats = parseInt(reg?.seats, 10) || 0;
  const list = reg?.travellers || [];
  if (!seats || list.length < seats) return false;
  return list.slice(0, seats).every((t) => String(t?.name || '').trim() && Number(t?.age) > 0 && t?.gender);
};

const toInt = (value) => {
  const n = parseInt(value, 10)
  return Number.isFinite(n) ? n : 0
}

const formatINR = (value) => {
  const n = toNumber(value)
  try {
    return `₹${n.toLocaleString('en-IN')}`
  } catch {
    return `₹${n}`
  }
}

const formatDate = (iso) => {
  if (!iso) return '—'
  const d = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

const tsToDate = (ts) => {
  if (!ts) return null
  if (typeof ts.toDate === 'function') return ts.toDate()
  const d = new Date(ts)
  return Number.isNaN(d.getTime()) ? null : d
}

const formatStamp = (ts) => {
  const d = tsToDate(ts)
  if (!d) return '—'
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

const downloadCsv =(headers, rows, filename) => {
  const csv = [headers, ...rows]
    .map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const tripStatusClass = (status) => {
  switch ((status || '').toLowerCase()) {
    case 'upcoming': return 'text-saffron-dark bg-saffron/10 border-saffron/20'
    case 'ongoing': return 'text-emerald-600 bg-emerald-50 border-emerald-200'
    case 'completed': return 'text-blue-600 bg-blue-50 border-blue-200'
    case 'cancelled': return 'text-red-500 bg-red-50 border-red-200'
    default: return 'text-ink-muted bg-paper-dark border-line'
  }
}

const regStatusClass = (status) => {
  switch ((status || '').toLowerCase()) {
    case 'confirmed': return 'text-green-600 bg-green-100 border-green-200'
    case 'waitlisted': return 'text-amber-600 bg-amber-50 border-amber-200'
    case 'cancelled': return 'text-ink-muted bg-paper-dark border-line'
    default: return 'text-saffron bg-saffron/10 border-saffron/20'
  }
}

const regStatusIcon = (status) => {
  switch ((status || '').toLowerCase()) {
    case 'confirmed': return <CheckCircle2 size={12} />
    case 'waitlisted': return <Hourglass size={12} />
    case 'cancelled': return <Ban size={12} />
    default: return <Clock size={12} />
  }
}

/* ---------------- payment state vocabulary ----------------
 * Five resolved states plus a transient "checking". Online and cash are
 * deliberately different hues AND different icons so a staff member
 * reconciling a cash box can tell them apart without reading the label.
 * `settled` means money is genuinely in hand — it is what the Collected
 * total sums, and it is only ever set from a verified payments doc (online)
 * or the staff-written cashCollected attestation (cash). */
const PAY_STATES = {
  online_paid: {
    label: 'Online paid', short: 'Online', rail: 'online', settled: true,
    chip: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    dot: 'bg-emerald-500', icon: CreditCard,
  },
  online_pending: {
    label: 'Online pending', short: 'Online', rail: 'online', settled: false,
    chip: 'text-amber-700 bg-amber-50 border-amber-200',
    dot: 'bg-amber-400', icon: Clock,
  },
  cash_collected: {
    label: 'Cash collected', short: 'Cash', rail: 'cash', settled: true,
    chip: 'text-teal-700 bg-teal-50 border-teal-200',
    dot: 'bg-teal-500', icon: Banknote,
  },
  cash_pending: {
    label: 'Cash pending', short: 'Cash', rail: 'cash', settled: false,
    chip: 'text-orange-700 bg-orange-50 border-orange-200',
    dot: 'bg-orange-400', icon: HandCoins,
  },
  unpaid: {
    label: 'Unpaid', short: '—', rail: 'none', settled: false,
    chip: 'text-rose-600 bg-rose-50 border-rose-200',
    dot: 'bg-rose-400', icon: XCircle,
  },
  checking: {
    label: 'Checking…', short: '—', rail: 'none', settled: false,
    chip: 'text-ink-muted bg-paper border-line',
    dot: 'bg-line', icon: Loader2,
  },
}

const payMeta = (state) => PAY_STATES[state] || PAY_STATES.unpaid

// `min-w-0` matters: an <input> carries an intrinsic min-content width of
// roughly 170px, so inside any flex row (the slug row, every StringListEditor
// row) it refuses to shrink and pushes the row's buttons out of the modal.
const inputClass =
  'w-full min-w-0 px-4 py-3 bg-cream/30 border border-saffron/10 rounded-xl outline-none focus:bg-white focus:border-saffron/40 transition-all font-medium text-sm min-h-[44px]'
const labelClass = 'text-[10px] font-bold text-ink-muted uppercase tracking-label ml-1'

/* ------------------------------------------------------------------ *
 * ScrollRow — a horizontally scrolling strip that SAYS it scrolls.
 *
 * `overflow-x-auto scrollbar-hide` scrolls correctly but removes every hint
 * that it does, so the modal's six-tab section strip read as simply cut off
 * at 360px. This wraps the scroller and fades whichever edge still has
 * content behind it, with a chevron on the trailing edge. Both fades follow
 * the real scroll position, so nothing is drawn when the strip fits.
 * ------------------------------------------------------------------ */
const ScrollRow = ({ children, className = '', outerClassName = '', fadeClass = 'from-white' }) => {
  const ref = React.useRef(null)
  const [edge, setEdge] = useState({ start: false, end: false })

  const measure = useCallback(() => {
    const el = ref.current
    if (!el) return
    const max = el.scrollWidth - el.clientWidth
    setEdge({ start: el.scrollLeft > 4, end: max > 4 && el.scrollLeft < max - 4 })
  }, [])

  useEffect(() => {
    measure()
    const el = ref.current
    if (!el || typeof ResizeObserver === 'undefined') return undefined
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    Array.from(el.children).forEach((child) => ro.observe(child))
    return () => ro.disconnect()
  }, [measure, children])

  return (
    <div className={`relative min-w-0 ${outerClassName}`}>
      <div ref={ref} onScroll={measure} className={`overflow-x-auto scrollbar-hide ${className}`}>
        {children}
      </div>
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute inset-y-0 left-0 w-7 bg-gradient-to-r ${fadeClass} to-transparent transition-opacity duration-200 ${edge.start ? 'opacity-100' : 'opacity-0'}`}
      />
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l ${fadeClass} to-transparent flex items-center justify-end transition-opacity duration-200 ${edge.end ? 'opacity-100' : 'opacity-0'}`}
      >
        <ChevronLeft size={15} className="rotate-180 text-saffron" />
      </span>
    </div>
  )
}

/* ------------------------------------------------------------------ *
 *  Module-level sub components (kept outside so typing never remounts)
 * ------------------------------------------------------------------ */

const Field = ({ label, error, hint, children, className = '' }) => (
  <div className={`space-y-2 user-text-box ${className}`}>
    <div className="flex items-baseline justify-between gap-2 user-text-box">
      <label className={`${labelClass} shrink-0`}>{label}</label>
      {hint && <span className="text-[10px] text-ink-muted font-medium text-right user-text min-w-0">{hint}</span>}
    </div>
    {children}
    {error && (
      <p className="text-[11px] font-bold text-red-500 ml-1 flex items-start gap-1.5 user-text-box">
        <AlertTriangle size={12} className="shrink-0 mt-0.5" /> <span className="user-text">{error}</span>
      </p>
    )}
  </div>
)

/* Per-image upload state. One component so the cover, the gallery and every
 * location row report progress and failure in exactly the same words. */
const UploadStatus = ({ phase, error, className = '' }) => {
  if (!phase && !error) return null
  return (
    <div className={`user-text-box ${className}`}>
      {phase && (
        <p className="text-[10px] font-bold uppercase tracking-label text-saffron-dark flex items-center gap-1.5">
          <Loader2 size={12} className="animate-spin shrink-0" /> {UPLOAD_PHASE_LABEL[phase] || 'Working…'}
        </p>
      )}
      {!phase && error && (
        <p className="text-[11px] font-bold text-red-500 flex items-start gap-1.5 user-text-box">
          <AlertTriangle size={12} className="shrink-0 mt-0.5" /> <span className="user-text">{error}</span>
        </p>
      )}
    </div>
  )
}

const StringListEditor = ({ label, hint, items, onChange, placeholder }) => {
  const [draft, setDraft] = useState('')

  const commitDraft = () => {
    const parts = draft.split(',').map((s) => s.trim()).filter(Boolean)
    if (parts.length === 0) return
    onChange([...(items || []), ...parts])
    setDraft('')
  }

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between gap-2">
        <label className={labelClass}>{label}</label>
        <span className="text-[10px] text-ink-muted font-medium">{hint || 'Enter to add · commas split'}</span>
      </div>

      {(items || []).length > 0 && (
        <div className="space-y-2">
          {items.map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="text"
                value={item}
                onChange={(e) => {
                  const next = [...items]
                  next[i] = e.target.value
                  onChange(next)
                }}
                className={inputClass}
              />
              <button
                type="button"
                aria-label={`Remove ${label} item ${i + 1}`}
                onClick={() => onChange(items.filter((_, idx) => idx !== i))}
                className="w-11 h-11 shrink-0 rounded-xl bg-red-50 text-red-400 hover:bg-red-100 flex items-center justify-center transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2">
        <input
          type="text"
          value={draft}
          placeholder={placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              commitDraft()
            }
          }}
          onBlur={commitDraft}
          className={inputClass}
        />
        <button
          type="button"
          aria-label={`Add ${label}`}
          onClick={commitDraft}
          className="w-11 h-11 shrink-0 rounded-xl bg-saffron/10 text-saffron hover:bg-saffron hover:text-white flex items-center justify-center transition-colors"
        >
          <Plus size={18} />
        </button>
      </div>
    </div>
  )
}

const SummaryTile = ({ label, value, sub, icon: Icon, tone = 'saffron' }) => {
  const tones = {
    saffron: 'from-saffron/10 to-gold/10 text-saffron-dark',
    green: 'from-emerald-50 to-green-50 text-emerald-600',
    amber: 'from-amber-50 to-yellow-50 text-amber-600',
    slate: 'from-paper to-paper-dark text-ink-muted',
  }
  return (
    <div className={`rounded-2xl p-3.5 sm:p-4 bg-gradient-to-br ${tones[tone]} border border-white/60 shadow-premium user-text-box`}>
      <div className="flex items-center gap-2 mb-1 user-text-box">
        {Icon && <Icon size={14} className="shrink-0" />}
        <p className="text-[9px] font-bold uppercase tracking-label opacity-80 truncate min-w-0">{label}</p>
      </div>
      <p className="text-lg sm:text-xl font-bold leading-tight user-text">{value}</p>
      {sub && <p className="text-[10px] font-bold opacity-60 mt-0.5 user-text">{sub}</p>}
    </div>
  )
}

/* A resolved payment state, rendered identically in the table and the mobile
 * card list so the two views can never drift apart. */
const PayChip = ({ pay, size = 'sm' }) => {
  const meta = payMeta(pay.state)
  const Icon = meta.icon
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-bold rounded-lg uppercase tracking-label border whitespace-nowrap ${meta.chip} ${
        size === 'md' ? 'text-[10px] px-2.5 py-1.5' : 'text-[9px] px-2 py-1'
      }`}
    >
      <Icon size={size === 'md' ? 12 : 11} className={`shrink-0 ${pay.state === 'checking' ? 'animate-spin' : ''}`} />
      {meta.label}
    </span>
  )
}

/* Payment-rail toggle used in the modal. Big tap target, explicit on/off
 * wording, and a sentence saying what it means for the devotee. */
const RailToggle = ({ on, onToggle, icon: Icon, title, onCopy, offCopy }) => (
  <button
    type="button"
    role="switch"
    aria-checked={on}
    aria-label={`${title}: ${on ? 'enabled' : 'disabled'}`}
    onClick={onToggle}
    className={`w-full text-left p-4 rounded-2xl border-2 transition-all user-text-box ${
      on ? 'bg-emerald-50/70 border-emerald-200' : 'bg-paper border-line'
    }`}
  >
    <div className="flex items-start gap-3">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
        on ? 'bg-emerald-500 text-white' : 'bg-white text-ink-muted/50 border border-line'
      }`}>
        <Icon size={17} />
      </div>
      <div className="flex-1 min-w-0 user-text-box">
        <div className="flex items-center justify-between gap-2">
          <p className={`text-xs font-bold uppercase tracking-label ${on ? 'text-emerald-700' : 'text-ink-muted'}`}>
            {title}
          </p>
          {on ? <ToggleRight size={24} className="text-emerald-500 shrink-0" /> : <ToggleLeft size={24} className="text-ink-muted/50 shrink-0" />}
        </div>
        <p className="text-[11px] text-ink-muted font-medium leading-relaxed mt-1 user-text">
          {on ? onCopy : offCopy}
        </p>
      </div>
    </div>
  </button>
)

/* ------------------------------------------------------------------ *
 *  TripsAdmin
 * ------------------------------------------------------------------ */

const TripsAdmin = ({ setActiveTab, openTrip }) => {
  const { user } = useAuth()
  // The router already gates this page to staff; only a real admin may delete
  // (firestore.rules reject a delete from folks_head), so the UI matches.
  const isAdmin = user?.role === 'admin'

  const tripsQuery = useMemo(() => [], [])
  const registrationsQuery = useMemo(() => [], [])
  const paymentsQuery = useMemo(() => [], [])

  const { data: trips, loading: tripsLoading } = useFirestore('trips', tripsQuery)
  const { data: registrations, loading: regsLoading } = useFirestore('trip_registrations', registrationsQuery)
  const { data: payments, loading: paymentsLoading } = useFirestore('payments', paymentsQuery)

  const [view, setView] = useState('trips')

  /* ---------------- payments: read-only resolution ---------------- */
  // Payments are written exclusively by the Razorpay webhook on the server.
  // Nothing here ever writes a "paid" flag — we resolve the truth every render
  // from payments/{orderId}: paid ONLY when completed AND verified.
  const paymentsById = useMemo(() => {
    const map = new Map()
    ;(payments || []).forEach((p) => {
      if (p.id) map.set(String(p.id), p)
      if (p.orderId) map.set(String(p.orderId), p)
    })
    return map
  }, [payments])

  /* Resolve one registration into a single payment state.
   *
   * Trust model — the whole point of this function:
   *   ONLINE money is true only when payments/{orderId} says
   *   status === 'completed' AND verified === true. That document is written
   *   exclusively by the Razorpay webhook on the server. `paymentOrderId` on
   *   the registration is a devotee-writable POINTER and proves nothing.
   *   CASH money is true only when `cashCollected === true`, which
   *   firestore.rules lets staff write and the devotee never can.
   *   `paymentMode` is the devotee's declared intent at signup. It is used to
   *   decide which ACTION to offer and how to label a not-yet-paid row — never
   *   to call anything paid.
   * Nothing a devotee can write is allowed to produce a settled state. */
  const resolvePayment = useCallback((reg) => {
    const orderId = reg?.paymentOrderId || null
    const due = toNumber(reg?.amountDue)
    const declared = String(reg?.paymentMode || '').toLowerCase() === 'cash' ? 'cash' : (orderId ? 'online' : '')
    const cashDone = reg?.cashCollected === true
    const cashAmount = Number.isFinite(Number(reg?.cashAmount)) ? Number(reg.cashAmount) : 0

    const base = {
      orderId, declared, cashDone,
      cashAmount: cashDone ? (cashAmount > 0 ? cashAmount : due) : 0,
      cashAt: reg?.cashCollectedAt || null,
      cashBy: reg?.cashCollectedBy || '',
      onlineAmount: 0,
    }

    // 1. Verified online payment outranks everything — real money, webhook-proven.
    if (orderId) {
      const p = paymentsById.get(String(orderId))
      // An order made for a specific registration only settles that one.
      const forThisReg = !p?.tripRegistrationId || p.tripRegistrationId === reg?.id
      if (p && p.status === 'completed' && p.verified === true && forThisReg) {
        const amt = Number.isFinite(Number(p.amount)) ? Number(p.amount) : 0
        return { ...base, state: 'online_paid', onlineAmount: amt > 0 ? amt : due, amount: amt > 0 ? amt : due }
      }
      // 2. Staff may still have taken cash for a half-finished online attempt.
      if (cashDone) return { ...base, state: 'cash_collected', amount: base.cashAmount }
      // 3. An order exists but is not verified — still out there.
      if (!p && paymentsLoading) return { ...base, state: 'checking', amount: 0 }
      return { ...base, state: 'online_pending', amount: 0 }
    }

    if (cashDone) return { ...base, state: 'cash_collected', amount: base.cashAmount }
    if (declared === 'cash') return { ...base, state: 'cash_pending', amount: 0 }
    return { ...base, state: 'unpaid', amount: 0 }
  }, [paymentsById, paymentsLoading])

  /* ---------------- derived trip data ---------------- */
  const regStatsByTrip = useMemo(() => {
    const map = new Map()
    ;(registrations || []).forEach((r) => {
      const key = r.tripId || '—'
      const entry = map.get(key) || { count: 0, seats: 0, confirmed: 0 }
      entry.count += 1
      if ((r.status || '').toLowerCase() === 'confirmed') {
        entry.confirmed += 1
        entry.seats += toInt(r.seats) || 1
      }
      map.set(key, entry)
    })
    return map
  }, [registrations])

  const sortedTrips = useMemo(() => {
    return (trips || []).slice().sort((a, b) => {
      const av = a.startDate || ''
      const bv = b.startDate || ''
      if (av === bv) return (a.title || '').localeCompare(b.title || '')
      return bv.localeCompare(av)
    })
  }, [trips])

  /* ---------------- create / edit modal ---------------- */
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [slugTouched, setSlugTouched] = useState(false)
  const [section, setSection] = useState('basics')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [showErrors, setShowErrors] = useState(false)

  /* ---------------- image uploads (R2, via src/lib/uploads.js) ---------------- *
   * Every slot that can hold an image has a key: 'cover', 'gallery', or
   * `loc:<row id>`. Both maps are keyed by it, so two slots can be uploading at
   * once without their progress or their error message bleeding together. */
  const [uploads, setUploads] = useState({})            // key -> phase string
  const [uploadErrors, setUploadErrors] = useState({})  // key -> message
  const [galleryQueue, setGalleryQueue] = useState(null) // { index, total }
  const [uploadConfig, setUploadConfig] = useState(null)

  // Ask the server once whether R2 is wired up, so the UI can say so up front
  // rather than letting staff pick a file and fail at the last step.
  // Re-asks whenever the signed-in user changes, so a check that happened to
  // run before Firebase restored the session doesn't leave a permanent "not
  // configured" banner. `reachable: false` means we never got an answer, which
  // is retried; a genuine `configured: false` is a real answer and stands.
  useEffect(() => {
    let alive = true
    if (!user?.uid) return () => { alive = false }
    getUploadConfig()
      .then((cfg) => { if (alive) setUploadConfig(cfg || { configured: false, reachable: false }) })
      .catch(() => { if (alive) setUploadConfig({ configured: false, reachable: false }) })
    return () => { alive = false }
  }, [user?.uid])

  // Treat "not answered yet" as fine — only a definite `false` disables the
  // pickers, so a slow config call never blocks a staff member mid-edit.
  const uploadsConfigured = uploadConfig ? uploadConfig.configured !== false : true
  // A multi-file gallery pick uploads one image at a time, so the `gallery`
  // phase briefly clears between files — the queue keeps "busy" honest across
  // that gap rather than letting Save flicker back on mid-batch.
  const uploadsBusy = Object.keys(uploads).length > 0 || !!galleryQueue
  const galleryBusy = !!uploads.gallery || !!galleryQueue

  const setUploadPhase = useCallback((key, phase) => {
    setUploads((prev) => {
      if (!phase) {
        if (!(key in prev)) return prev
        const next = { ...prev }
        delete next[key]
        return next
      }
      return { ...prev, [key]: phase }
    })
  }, [])

  // Compress → presign → PUT. Resolves with the stored URL, or null once the
  // failure has been recorded against this slot.
  const runUpload = useCallback(async (key, file, opts) => {
    setUploadErrors((prev) => ({ ...prev, [key]: '' }))
    try {
      const url = await uploadImage(file, {
        ...opts,
        onProgress: (phase) => setUploadPhase(key, phase === 'done' ? null : phase),
      })
      return url
    } catch (err) {
      console.error('Image upload failed:', err)
      setUploadErrors((prev) => ({ ...prev, [key]: err?.message || 'That image could not be uploaded' }))
      return null
    } finally {
      setUploadPhase(key, null)
    }
  }, [setUploadPhase])

  /* Best-effort bucket cleanup when staff remove or replace an image.
   * Two guards: a legacy inline `data:` URI has no bucket object behind it, and
   * a duplicated trip shares its image URLs with the original — deleting the
   * object would blank the picture on a trip nobody was editing. */
  const discardImage = useCallback((value) => {
    if (!value || !isUploadedUrl(value)) return
    const usedElsewhere = (trips || []).some((t) => {
      if (t.id === editingId) return false
      if (t.coverImage === value) return true
      if (Array.isArray(t.gallery) && t.gallery.includes(value)) return true
      if (Array.isArray(t.locations) && t.locations.some((l) => l?.image === value)) return true
      return false
    })
    if (!usedElsewhere) deleteUploadedImage(value)
  }, [trips, editingId])

  const setField = useCallback((key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }, [])

  const openCreate = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setSlugTouched(false)
    setSection('basics')
    setSaveError('')
    setUploadErrors({})
    setGalleryQueue(null)
    setOpenLocation(null)
    setShowErrors(false)
    setModalOpen(true)
  }

  const formFromTrip = (trip) => ({
    slug: trip.slug || '',
    title: trip.title || '',
    subtitle: trip.subtitle || '',
    location: trip.location || '',
    description: trip.description || '',
    // Either an https URL (uploaded to R2) or a legacy inline data: URI. Both
    // are valid <img src> values, so whatever is stored is simply rendered.
    coverImage: trip.coverImage || '',
    gallery: Array.isArray(trip.gallery) ? trip.gallery.slice(0, GALLERY_MAX) : [],
    startDate: trip.startDate || '',
    endDate: trip.endDate || '',
    durationLabel: trip.durationLabel || '',
    price: trip.price ?? '',
    originalPrice: trip.originalPrice ?? '',
    advanceAmount: trip.advanceAmount ?? '',
    capacity: trip.capacity ?? '',
    eligibility: trip.eligibility ?? '',
    status: TRIP_STATUSES.includes(trip.status) ? trip.status : 'draft',
    registrationOpen: !!trip.registrationOpen,
    // A trip saved before these fields existed has no `onlinePaymentEnabled`.
    // Treat that absence as TRUE so Razorpay keeps working on every live trip.
    onlinePaymentEnabled: trip.onlinePaymentEnabled !== false,
    cashPaymentEnabled: trip.cashPaymentEnabled === true,
    highlights: Array.isArray(trip.highlights) ? trip.highlights : [],
    itinerary: Array.isArray(trip.itinerary)
      ? trip.itinerary.map((d, i) => ({
          day: toInt(d?.day) || i + 1,
          title: d?.title || '',
          details: d?.details || '',
        }))
      : [],
    // A trip saved before locations existed simply has none. Rows keep the id
    // they were stored with; anything missing one gets a fresh stable id.
    locations: Array.isArray(trip.locations)
      ? trip.locations.map((l) => ({
          id: String(l?.id || '') || newLocationId(),
          name: l?.name || '',
          description: l?.description || '',
          image: l?.image || '',
        }))
      : [],
    inclusions: Array.isArray(trip.inclusions) ? trip.inclusions : [],
    exclusions: Array.isArray(trip.exclusions) ? trip.exclusions : [],
    meetingPoint: trip.meetingPoint || '',
    contactPhone: trip.contactPhone || '',
  })

  const openEdit = (trip) => {
    setEditingId(trip.id)
    setForm(formFromTrip(trip))
    setSlugTouched(true)
    setSection('basics')
    setSaveError('')
    setUploadErrors({})
    setGalleryQueue(null)
    setOpenLocation(null)
    setShowErrors(false)
    setModalOpen(true)
  }

  // Duplicate opens a pre-filled CREATE form (an annual yatra rarely keeps its
  // old dates), with a guaranteed-unique slug and reset publishing flags.
  const openDuplicate = (trip) => {
    const base = formFromTrip(trip)
    const taken = new Set((trips || []).map((t) => (t.slug || '').toLowerCase()))
    let candidate = slugify(`${base.slug || base.title}-copy`) || 'trip-copy'
    let n = 2
    while (taken.has(candidate)) {
      candidate = slugify(`${base.slug || base.title}-copy-${n}`)
      n += 1
    }
    setEditingId(null)
    setForm({
      ...base,
      title: `${base.title} (Copy)`,
      slug: candidate,
      status: 'draft',
      registrationOpen: false,
    })
    setSlugTouched(true)
    setSection('basics')
    setSaveError('')
    setUploadErrors({})
    setGalleryQueue(null)
    setOpenLocation(null)
    setShowErrors(false)
    setModalOpen(true)
  }

  const closeModal = () => {
    if (saving || uploadsBusy) return
    setModalOpen(false)
  }

  const handleTitleChange = (value) => {
    setForm((prev) => ({
      ...prev,
      title: value,
      slug: slugTouched ? prev.slug : slugify(value),
    }))
  }

  /* ---------------- images ---------------- *
   * The file never reaches our API: uploadImage() compresses it, gets a
   * presigned URL and PUTs the bytes straight to R2. Only the returned public
   * URL goes into the form, so the saved document stays tiny. */

  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const previous = form.coverImage
    const url = await runUpload('cover', file, { folder: 'covers', maxWidth: 1600, quality: 0.82 })
    if (!url) return
    setField('coverImage', url)
    // Only once the replacement is safely stored is the old one let go.
    if (previous && previous !== url) discardImage(previous)
  }

  const removeCover = () => {
    const previous = form.coverImage
    setField('coverImage', '')
    setUploadErrors((prev) => ({ ...prev, cover: '' }))
    discardImage(previous)
  }

  const handleGalleryUpload = async (e) => {
    const files = Array.from(e.target.files || [])
    e.target.value = ''
    if (files.length === 0) return
    const room = GALLERY_MAX - (form.gallery || []).length
    if (room <= 0) {
      setUploadErrors((prev) => ({ ...prev, gallery: `The gallery already holds the maximum of ${GALLERY_MAX} images` }))
      return
    }
    const picked = files.slice(0, room)
    setUploadErrors((prev) => ({ ...prev, gallery: '' }))
    // One at a time so a slow connection shows honest progress rather than
    // three silent parallel uploads.
    for (let i = 0; i < picked.length; i += 1) {
      setGalleryQueue({ index: i + 1, total: picked.length })
      // eslint-disable-next-line no-await-in-loop
      const url = await runUpload('gallery', picked[i], { folder: 'gallery', maxWidth: 1200, quality: 0.8 })
      if (!url) { setGalleryQueue(null); return }   // runUpload already recorded why
      setForm((prev) => ({ ...prev, gallery: [...(prev.gallery || []), url].slice(0, GALLERY_MAX) }))
    }
    setGalleryQueue(null)
    if (files.length > room) {
      setUploadErrors((prev) => ({
        ...prev,
        gallery: `Only ${room} more image${room === 1 ? '' : 's'} could be added (max ${GALLERY_MAX})`,
      }))
    }
  }

  const removeGalleryImage = (index) => {
    const previous = (form.gallery || [])[index]
    setForm((prev) => ({ ...prev, gallery: (prev.gallery || []).filter((_, i) => i !== index) }))
    setUploadErrors((prev) => ({ ...prev, gallery: '' }))
    discardImage(previous)
  }

  /* ---------------- itinerary builder ---------------- */
  const addDay = () => {
    setForm((prev) => ({
      ...prev,
      itinerary: [...(prev.itinerary || []), { day: (prev.itinerary?.length || 0) + 1, title: '', details: '' }],
    }))
  }

  const updateDay = (index, key, value) => {
    setForm((prev) => {
      const next = [...(prev.itinerary || [])]
      next[index] = { ...next[index], [key]: key === 'day' ? toInt(value) : value }
      return { ...prev, itinerary: next }
    })
  }

  const removeDay = (index) => {
    setForm((prev) => ({ ...prev, itinerary: (prev.itinerary || []).filter((_, i) => i !== index) }))
  }

  const moveDay = (index, delta) => {
    setForm((prev) => {
      const next = [...(prev.itinerary || [])]
      const target = index + delta
      if (target < 0 || target >= next.length) return prev
      const tmp = next[index]
      next[index] = next[target]
      next[target] = tmp
      return { ...prev, itinerary: next }
    })
  }

  /* ---------------- locations builder ---------------- *
   * The places a yatra visits — Govardhan Hill, Radha Kund, Keshi Ghat — each
   * with a photo and a line or two. Rows carry a generated id so React keys
   * and reordering survive every edit; the editor shows one row open at a
   * time so a twenty-stop yatra is still navigable. */
  const [openLocation, setOpenLocation] = useState(null)

  const addLocation = () => {
    const row = { id: newLocationId(), name: '', description: '', image: '' }
    setForm((prev) => ({ ...prev, locations: [...(prev.locations || []), row] }))
    setOpenLocation(row.id)
  }

  const updateLocation = (index, key, value) => {
    setForm((prev) => {
      const next = [...(prev.locations || [])]
      if (!next[index]) return prev
      next[index] = { ...next[index], [key]: value }
      return { ...prev, locations: next }
    })
  }

  const removeLocation = (index) => {
    const row = (form.locations || [])[index]
    setForm((prev) => ({ ...prev, locations: (prev.locations || []).filter((_, i) => i !== index) }))
    if (row?.id) {
      setOpenLocation((cur) => (cur === row.id ? null : cur))
      setUploadErrors((prev) => {
        const next = { ...prev }
        delete next[`loc:${row.id}`]
        return next
      })
    }
    discardImage(row?.image)
  }

  const moveLocation = (index, delta) => {
    setForm((prev) => {
      const next = [...(prev.locations || [])]
      const target = index + delta
      if (target < 0 || target >= next.length) return prev
      const tmp = next[index]
      next[index] = next[target]
      next[target] = tmp
      return { ...prev, locations: next }
    })
  }

  const handleLocationUpload = async (index, e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const row = (form.locations || [])[index]
    if (!row) return
    const previous = row.image
    const url = await runUpload(`loc:${row.id}`, file, { folder: 'locations', maxWidth: 1000, quality: 0.8 })
    if (!url) return
    // Find the row by id, not by index — it may have been reordered mid-upload.
    setForm((prev) => ({
      ...prev,
      locations: (prev.locations || []).map((l) => (l.id === row.id ? { ...l, image: url } : l)),
    }))
    if (previous && previous !== url) discardImage(previous)
  }

  const removeLocationImage = (index) => {
    const row = (form.locations || [])[index]
    if (!row) return
    setForm((prev) => ({
      ...prev,
      locations: (prev.locations || []).map((l) => (l.id === row.id ? { ...l, image: '' } : l)),
    }))
    setUploadErrors((prev) => ({ ...prev, [`loc:${row.id}`]: '' }))
    discardImage(row.image)
  }

  /* ---------------- validation ---------------- */
  const buildPayload = useCallback((f) => ({
    slug: (f.slug || '').trim(),
    title: (f.title || '').trim(),
    subtitle: (f.subtitle || '').trim(),
    location: (f.location || '').trim(),
    description: f.description || '',
    coverImage: f.coverImage || '',
    gallery: (f.gallery || []).slice(0, GALLERY_MAX),
    startDate: f.startDate || '',
    endDate: f.endDate || '',
    durationLabel: (f.durationLabel || '').trim(),
    price: toNumber(f.price),
    originalPrice: toNumber(f.originalPrice),
    advanceAmount: toNumber(f.advanceAmount),
    capacity: toInt(f.capacity),
    eligibility: String(f.eligibility || '').trim(),
    status: TRIP_STATUSES.includes(f.status) ? f.status : 'draft',
    registrationOpen: !!f.registrationOpen,
    onlinePaymentEnabled: !!f.onlinePaymentEnabled,
    cashPaymentEnabled: !!f.cashPaymentEnabled,
    highlights: (f.highlights || []).map((s) => String(s).trim()).filter(Boolean),
    itinerary: (f.itinerary || [])
      .map((d, i) => ({ day: toInt(d.day) || i + 1, title: String(d.title || '').trim(), details: String(d.details || '').trim() }))
      .filter((d) => d.title || d.details),
    // A row that is completely blank is dropped; anything with a name, a line
    // of description or a photo is kept, id and all.
    locations: (f.locations || [])
      .map((l, i) => ({
        id: String(l?.id || '') || `loc-${i + 1}`,
        name: String(l?.name || '').trim(),
        description: String(l?.description || '').trim(),
        image: String(l?.image || ''),
      }))
      .filter((l) => l.name || l.description || l.image),
    inclusions: (f.inclusions || []).map((s) => String(s).trim()).filter(Boolean),
    exclusions: (f.exclusions || []).map((s) => String(s).trim()).filter(Boolean),
    meetingPoint: (f.meetingPoint || '').trim(),
    contactPhone: (f.contactPhone || '').trim(),
  }), [])

  const errors = useMemo(() => {
    const e = {}
    if (!form.title.trim()) e.title = 'Title is required'
    const slug = (form.slug || '').trim()
    if (!slug) {
      e.slug = 'Slug is required — it is the /trip/<slug> address'
    } else if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) {
      e.slug = 'Use lowercase letters, numbers and hyphens only'
    } else {
      const clash = (trips || []).some(
        (t) => t.id !== editingId && String(t.slug || '').toLowerCase() === slug.toLowerCase()
      )
      if (clash) e.slug = `"${slug}" is already used by another trip — pick a different one`
    }
    if (!form.startDate) e.startDate = 'Start date is required'
    if (!form.endDate) e.endDate = 'End date is required'
    if (form.startDate && form.endDate && form.endDate < form.startDate) {
      e.endDate = 'End date cannot be before the start date'
    }
    if (form.price !== '' && toNumber(form.price) < 0) e.price = 'Price cannot be negative'
    if (form.advanceAmount !== '' && toNumber(form.advanceAmount) < 0) e.advanceAmount = 'Advance cannot be negative'
    if (form.advanceAmount !== '' && form.price !== '' && toNumber(form.advanceAmount) > toNumber(form.price)) {
      e.advanceAmount = 'Advance cannot exceed the full price'
    }
    if (form.capacity !== '' && toInt(form.capacity) < 0) e.capacity = 'Capacity cannot be negative'
    return e
  }, [form, trips, editingId])

  const sectionErrors = useMemo(() => ({
    basics: !!(errors.title || errors.slug),
    dates: !!(errors.startDate || errors.endDate || errors.price || errors.advanceAmount || errors.capacity),
    media: false,
    itinerary: false,
    locations: false,
    inclusions: false,
  }), [errors])

  const hasErrors = Object.keys(errors).length > 0

  const handleSubmit = async (e) => {
    e.preventDefault()
    setShowErrors(true)
    setSaveError('')
    // Saving mid-upload would store a trip missing the picture that is still
    // on its way to the bucket.
    if (uploadsBusy) {
      setSaveError('An image is still uploading — give it a moment, then save.')
      return
    }
    if (hasErrors) {
      const firstBad = MODAL_SECTIONS.find((s) => sectionErrors[s.key])
      if (firstBad) setSection(firstBad.key)
      return
    }
    setSaving(true)
    try {
      const payload = buildPayload(form)
      if (editingId) {
        await updateDoc(doc(db, 'trips', editingId), { ...payload, updatedAt: serverTimestamp() })
      } else {
        await addDoc(collection(db, 'trips'), {
          ...payload,
          createdAt: serverTimestamp(),
          createdBy: auth.currentUser?.uid || 'system',
          updatedAt: serverTimestamp(),
        })
      }
      setModalOpen(false)
      setForm(EMPTY_FORM)
      setEditingId(null)
    } catch (err) {
      console.error('Error saving trip:', err)
      setSaveError(err?.message || 'Failed to save this trip')
    } finally {
      setSaving(false)
    }
  }

  /* ---------------- per-trip quick actions ---------------- */
  const [tripBusy, setTripBusy] = useState(null)
  const [tripError, setTripError] = useState('')

  const handleTripStatus = async (trip, status) => {
    setTripBusy(trip.id)
    setTripError('')
    try {
      await updateDoc(doc(db, 'trips', trip.id), { status, updatedAt: serverTimestamp() })
    } catch (err) {
      console.error('Error updating trip status:', err)
      setTripError(err?.message || 'Failed to update the trip status')
    } finally {
      setTripBusy(null)
    }
  }

  const handleToggleRegistration = async (trip) => {
    setTripBusy(trip.id)
    setTripError('')
    try {
      await updateDoc(doc(db, 'trips', trip.id), {
        registrationOpen: !trip.registrationOpen,
        updatedAt: serverTimestamp(),
      })
    } catch (err) {
      console.error('Error toggling registration:', err)
      setTripError(err?.message || 'Failed to update registrations')
    } finally {
      setTripBusy(null)
    }
  }

  /* ---------------- delete (admin only, typed confirm) ---------------- */
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteText, setDeleteText] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const askDelete = (trip) => {
    setDeleteTarget(trip)
    setDeleteText('')
    setDeleteError('')
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    if (deleteText.trim() !== (deleteTarget.slug || '')) return
    setDeleting(true)
    setDeleteError('')
    try {
      await deleteDoc(doc(db, 'trips', deleteTarget.id))
      setDeleteTarget(null)
      setDeleteText('')
    } catch (err) {
      console.error('Error deleting trip:', err)
      setDeleteError(err?.message || 'Failed to delete this trip')
    } finally {
      setDeleting(false)
    }
  }

  /* ---------------- registrations view ---------------- */
  const [filterTrip, setFilterTrip] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterMethod, setFilterMethod] = useState('all')
  const [search, setSearch] = useState('')
  const [regBusy, setRegBusy] = useState(null)
  const [regError, setRegError] = useState('')
  const [noteOpen, setNoteOpen] = useState(null)
  const [noteDrafts, setNoteDrafts] = useState({})

  const filteredRegs = useMemo(() => {
    const term = search.trim().toLowerCase()
    return (registrations || [])
      .filter((r) => (filterTrip === 'all' ? true : r.tripId === filterTrip))
      .filter((r) => (filterStatus === 'all' ? true : (r.status || 'pending').toLowerCase() === filterStatus))
      .filter((r) => {
        if (filterMethod === 'all') return true
        return payMeta(resolvePayment(r).state).rail === filterMethod
      })
      .filter((r) => {
        if (!term) return true
        return (
          String(r.userName || '').toLowerCase().includes(term) ||
          String(r.userPhone || '').toLowerCase().includes(term) ||
          String(r.userEmail || '').toLowerCase().includes(term) ||
          String(r.tripTitle || '').toLowerCase().includes(term)
        )
      })
      .sort((a, b) => {
        const ad = tsToDate(a.createdAt)?.getTime() || 0
        const bd = tsToDate(b.createdAt)?.getTime() || 0
        return bd - ad
      })
  }, [registrations, filterTrip, filterStatus, filterMethod, search, resolvePayment])

  // "Collected" is money genuinely in hand: webhook-verified online payments
  // plus cash a staff member has attested to. Both halves are reported so the
  // cash box can be counted against the online statement.
  const regSummary = useMemo(() => {
    let confirmed = 0
    let seats = 0
    let online = 0
    let cash = 0
    let pending = 0
    let cashToCollect = 0
    filteredRegs.forEach((r) => {
      const status = (r.status || 'pending').toLowerCase()
      const due = toNumber(r.amountDue)
      const pay = resolvePayment(r)
      if (status === 'confirmed') {
        confirmed += 1
        seats += toInt(r.seats) || 1
      }
      if (pay.state === 'online_paid') {
        online += pay.amount > 0 ? pay.amount : due
      } else if (pay.state === 'cash_collected') {
        cash += pay.amount > 0 ? pay.amount : due
      } else if (status !== 'cancelled' && pay.state !== 'checking') {
        pending += due
        if (pay.state === 'cash_pending') cashToCollect += 1
      }
    })
    return {
      total: filteredRegs.length, confirmed, seats,
      collected: online + cash, online, cash, pending, cashToCollect,
    }
  }, [filteredRegs, resolvePayment])

  // Staff writes touch ONLY status / staffNotes / updatedAt — firestore.rules
  // reject anything else on trip_registrations.
  const updateRegistration = async (reg, status) => {
    setRegBusy(reg.id)
    setRegError('')
    try {
      const note = noteDrafts[reg.id]
      await updateDoc(doc(db, 'trip_registrations', reg.id), {
        status,
        staffNotes: note === undefined ? (reg.staffNotes || '') : note,
        updatedAt: serverTimestamp(),
      })
      setNoteOpen(null)
    } catch (err) {
      console.error('Error updating registration:', err)
      setRegError(err?.message || 'Failed to update this registration')
    } finally {
      setRegBusy(null)
    }
  }

  const saveNoteOnly = async (reg) => {
    setRegBusy(reg.id)
    setRegError('')
    try {
      await updateDoc(doc(db, 'trip_registrations', reg.id), {
        status: reg.status || 'pending',
        staffNotes: noteDrafts[reg.id] ?? (reg.staffNotes || ''),
        updatedAt: serverTimestamp(),
      })
      setNoteOpen(null)
    } catch (err) {
      console.error('Error saving staff note:', err)
      setRegError(err?.message || 'Failed to save the note')
    } finally {
      setRegBusy(null)
    }
  }

  /* ---------------- cash collection (staff attestation) ---------------- *
   * firestore.rules allow a staff update on trip_registrations to touch ONLY
   *   status, staffNotes, updatedAt, cashCollected, cashAmount,
   *   cashCollectedAt, cashCollectedBy
   * Any extra key rejects the whole write, so both writes below stay inside
   * that list exactly. */
  const [cashTarget, setCashTarget] = useState(null)   // reg pending "Record cash"
  const [cashDraft, setCashDraft] = useState('')
  const [cashSaving, setCashSaving] = useState(false)
  const [cashError, setCashError] = useState('')
  const [undoTarget, setUndoTarget] = useState(null)   // reg pending undo confirm

  const askRecordCash = (reg) => {
    setCashTarget(reg)
    setCashDraft(String(toNumber(reg.amountDue) || ''))
    setCashError('')
  }

  const confirmRecordCash = async () => {
    if (!cashTarget) return
    const amount = toNumber(cashDraft)
    if (!(amount > 0)) {
      setCashError('Enter the amount actually received')
      return
    }
    setCashSaving(true)
    setCashError('')
    try {
      await updateDoc(doc(db, 'trip_registrations', cashTarget.id), {
        cashCollected: true,
        cashAmount: amount,
        cashCollectedAt: serverTimestamp(),
        cashCollectedBy: user?.uid || user?.name || auth.currentUser?.uid || 'staff',
        updatedAt: serverTimestamp(),
      })
      setCashTarget(null)
      setCashDraft('')
    } catch (err) {
      console.error('Error recording cash:', err)
      setCashError(err?.message || 'Failed to record this cash payment')
    } finally {
      setCashSaving(false)
    }
  }

  const confirmUndoCash = async () => {
    if (!undoTarget) return
    setCashSaving(true)
    setCashError('')
    try {
      await updateDoc(doc(db, 'trip_registrations', undoTarget.id), {
        cashCollected: false,
        updatedAt: serverTimestamp(),
      })
      setUndoTarget(null)
    } catch (err) {
      console.error('Error undoing cash record:', err)
      setCashError(err?.message || 'Failed to undo this cash record')
    } finally {
      setCashSaving(false)
    }
  }

  // The travel manifest staff actually carry — mirrors generateGrowthAudit.
  // Payment-method and cash columns are here because this export is what the
  // office reconciles the cash box against at the end of a yatra.
  const exportRegistrations = () => {
    const headers = [
      'Name', 'Phone', 'Email', 'Trip', 'Trip Slug', 'Seats',
      'Amount Due (INR)', 'Payment Method', 'Payment State',
      'Online Verified (INR)', 'Order ID',
      'Cash Collected', 'Cash Amount (INR)', 'Cash Collected On', 'Cash Collected By',
      'Status', 'Registered On', 'Travellers (name | age | gender | ID)', 'College / Course / Year', 'Boarding Point',
      'Traveller Notes', 'Emergency Contact', 'Staff Notes',
    ]
    const rows = filteredRegs.map((r) => {
      const pay = resolvePayment(r)
      const meta = payMeta(pay.state)
      return [
        r.userName || '',
        r.userPhone || '',
        r.userEmail || '',
        r.tripTitle || '',
        r.tripSlug || '',
        toInt(r.seats) || 1,
        toNumber(r.amountDue),
        meta.rail === 'none' ? '' : meta.rail,
        meta.label,
        pay.state === 'online_paid' ? pay.onlineAmount : '',
        pay.orderId || '',
        pay.cashDone ? 'yes' : 'no',
        pay.cashDone ? pay.cashAmount : '',
        pay.cashDone ? formatStamp(pay.cashAt) : '',
        pay.cashDone ? (pay.cashBy || '') : '',
        r.status || 'pending',
        formatStamp(r.createdAt),
        travellerSummary(r),
        studentSummary(r),
        r.pickup || '',
        r.travellerNotes || '',
        r.emergencyContact || '',
        r.staffNotes || '',
      ]
    })
    downloadCsv(headers, rows, `trip_registrations_${new Date().toISOString().slice(0, 10)}.csv`)
  }

  /* Shared row bits. Plain functions, not components, so React never remounts
   * the note textarea (and loses the caret) while someone is typing. */
  const toggleNote = (reg, expanded) => {
    setNoteDrafts((prev) => ({ ...prev, [reg.id]: prev[reg.id] ?? (reg.staffNotes || '') }))
    setNoteOpen(expanded ? null : reg.id)
  }

  const regActions = (reg, pay, busy, status, expanded) => (
    <>
      {/* Cash actions only appear for a declared-cash seat, or to undo one
          a staff member has already recorded. */}
      {pay.declared === 'cash' && !pay.cashDone && pay.state !== 'online_paid' && (
        <button
          disabled={busy}
          onClick={() => askRecordCash(reg)}
          aria-label={`Record cash received from ${reg.userName || 'this devotee'}`}
          className="min-h-[44px] px-3 bg-teal-600 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-40 flex items-center gap-1.5"
        >
          <Banknote size={13} /> Record cash
        </button>
      )}
      {pay.cashDone && (
        <button
          disabled={busy}
          onClick={() => { setUndoTarget(reg); setCashError('') }}
          aria-label={`Undo the cash record for ${reg.userName || 'this devotee'}`}
          className="min-h-[44px] px-3 bg-teal-50 text-teal-700 text-[10px] font-bold uppercase tracking-wider rounded-lg hover:bg-teal-100 transition-colors disabled:opacity-40 flex items-center gap-1.5"
        >
          <Undo2 size={13} /> Undo cash
        </button>
      )}
      <button
        disabled={busy || status === 'confirmed'}
        onClick={() => updateRegistration(reg, 'confirmed')}
        aria-label={`Confirm ${reg.userName || 'registration'}`}
        className="min-h-[44px] px-3 bg-green-500 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg hover:bg-green-600 transition-colors disabled:opacity-40 flex items-center gap-1.5"
      >
        {busy ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />} Confirm
      </button>
      <button
        disabled={busy || status === 'waitlisted'}
        onClick={() => updateRegistration(reg, 'waitlisted')}
        aria-label={`Waitlist ${reg.userName || 'registration'}`}
        className="min-h-[44px] px-3 bg-amber-50 text-amber-600 text-[10px] font-bold uppercase tracking-wider rounded-lg hover:bg-amber-100 transition-colors disabled:opacity-40 flex items-center gap-1.5"
      >
        {busy ? <Loader2 size={12} className="animate-spin" /> : <Hourglass size={12} />} Wait
      </button>
      <button
        disabled={busy || status === 'cancelled'}
        onClick={() => updateRegistration(reg, 'cancelled')}
        aria-label={`Cancel ${reg.userName || 'registration'}`}
        className="min-h-[44px] px-3 bg-red-50 text-red-500 text-[10px] font-bold uppercase tracking-wider rounded-lg hover:bg-red-100 transition-colors disabled:opacity-40 flex items-center gap-1.5"
      >
        {busy ? <Loader2 size={12} className="animate-spin" /> : <Ban size={12} />} Cancel
      </button>
      <button
        onClick={() => toggleNote(reg, expanded)}
        aria-label={`Staff note for ${reg.userName || 'registration'}`}
        className={`w-11 h-11 shrink-0 rounded-lg flex items-center justify-center transition-colors ${
          reg.staffNotes ? 'bg-saffron/10 text-saffron' : 'bg-paper-dark text-ink-muted hover:bg-paper-dark'
        }`}
      >
        <MessageSquare size={15} />
      </button>
    </>
  )

  const regDetailPanel = (reg, pay, busy, expanded) => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 user-text-box">
      <div className="text-[11px] text-ink-muted space-y-2 user-text-box">
        {pay.cashDone && (
          <p className="user-text">
            <span className="font-bold uppercase tracking-label text-[9px] text-teal-600">Cash recorded</span><br />
            {formatINR(pay.cashAmount)} · {formatStamp(pay.cashAt)}
            {pay.cashBy ? <> · by <span className="font-mono">{pay.cashBy}</span></> : null}
          </p>
        )}
        {pay.orderId && (
          <p className="user-text">
            <span className="font-bold uppercase tracking-label text-[9px] text-ink-muted">Razorpay order</span><br />
            <span className="font-mono">{pay.orderId}</span>
          </p>
        )}
        {reg.travellerNotes && (
          <p className="user-text"><span className="font-bold uppercase tracking-label text-[9px] text-ink-muted">Traveller note</span><br />{reg.travellerNotes}</p>
        )}
        {reg.emergencyContact && (
          <p className="user-text"><span className="font-bold uppercase tracking-label text-[9px] text-ink-muted">Emergency contact</span><br />{reg.emergencyContact}</p>
        )}
        {!expanded && reg.staffNotes && (
          <p className="user-text"><span className="font-bold uppercase tracking-label text-[9px] text-ink-muted">Staff note</span><br />{reg.staffNotes}</p>
        )}
      </div>
      {expanded && (
        <div className="space-y-2 user-text-box">
          <label className={labelClass}>Staff note</label>
          <textarea
            rows={2}
            value={noteDrafts[reg.id] ?? (reg.staffNotes || '')}
            onChange={(e) => setNoteDrafts((prev) => ({ ...prev, [reg.id]: e.target.value }))}
            placeholder="Seat allotted in bus 2, balance due on departure…"
            className="w-full bg-white border border-saffron/10 rounded-xl px-4 py-3 outline-none focus:border-saffron/40 transition-all text-sm font-medium resize-none user-text"
          />
          <div className="flex flex-wrap gap-2">
            <button
              disabled={busy}
              onClick={() => saveNoteOnly(reg)}
              className="min-h-[44px] px-4 bg-saffron text-white text-[10px] font-bold uppercase tracking-wider rounded-lg hover:bg-saffron-dark transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {busy ? <Loader2 size={13} className="animate-spin" /> : null} Save note
            </button>
            <button
              onClick={() => setNoteOpen(null)}
              className="min-h-[44px] px-4 bg-paper-dark text-ink-muted text-[10px] font-bold uppercase tracking-wider rounded-lg hover:bg-paper-dark transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )

  /* Said up front, in both image sections, so nobody picks a file only to be
   * told at the last step that there is nowhere to put it. */
  const uploadsNotice = uploadConfig && uploadConfig.configured === false ? (
    <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 flex items-start gap-3 user-text-box">
      <AlertTriangle size={16} className="shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0 text-[11px] font-medium leading-relaxed user-text-box">
        {uploadConfig.reachable === false ? (
          <>
            <p className="font-bold uppercase tracking-label text-[10px] mb-1">Could not check image storage</p>
            <p className="user-text">
              The server did not answer the storage check{uploadConfig.error ? `: ${uploadConfig.error}` : '.'} This is a
              connection or deployment problem rather than a missing setting. Everything else on this trip saves as
              normal.
            </p>
          </>
        ) : (
          <>
            <p className="font-bold uppercase tracking-label text-[10px] mb-1">Image uploads are not configured yet</p>
            <p>
              The server has no image storage set up, so new pictures cannot be added. Everything else on this trip
              saves as normal, and any image already on it keeps showing.
            </p>
            {Array.isArray(uploadConfig.missing) && uploadConfig.missing.length > 0 && (
              <p className="mt-2 user-text">
                Missing on the server:{' '}
                <span className="font-mono font-bold">{uploadConfig.missing.join(', ')}</span>
                {' '}— add {uploadConfig.missing.length === 1 ? 'it' : 'them'} to the backend environment variables and redeploy.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  ) : null

  /* ---------------- loading ---------------- */
  if (tripsLoading && (trips || []).length === 0) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-saffron" size={40} />
          <p className="text-ink-muted font-bold uppercase tracking-label text-[10px]">Loading Yatras…</p>
        </div>
      </div>
    )
  }

  const totalTrips = (trips || []).length
  const openTrips = (trips || []).filter((t) => t.registrationOpen).length
  const upcomingTrips = (trips || []).filter((t) => t.status === 'upcoming').length

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="pb-10 space-y-8">

      {/* ---------------- Header ---------------- */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="min-w-0">
          <button
            onClick={() => setActiveTab && setActiveTab('admin')}
            className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-label text-ink-muted hover:text-saffron transition-colors min-h-[44px]"
          >
            <ChevronLeft size={14} /> Command Center
          </button>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-bold font-poppins text-saffron-dark">Trips & Yatras</h1>
            <Bus className="text-saffron shrink-0" size={24} />
            {isAdmin && (
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-saffron/10 text-saffron text-[9px] font-bold uppercase tracking-label">
                <ShieldCheck size={11} /> Admin
              </span>
            )}
          </div>
          <p className="text-sm text-ink-muted mt-1">
            Create pilgrimages, publish them, and manage every registration and payment.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 shrink-0">
          <Button
            onClick={openCreate}
            className="w-full sm:w-auto min-h-[44px] px-6 bg-saffron shadow-lg font-bold rounded-2xl flex items-center justify-center gap-2"
          >
            <Plus size={18} /> New Trip
          </Button>
        </div>
      </div>

      {/* ---------------- View switcher ---------------- */}
      <ScrollRow
        className="flex items-center gap-2"
        outerClassName="p-1.5 bg-white rounded-2xl shadow-premium border border-saffron/10 w-full sm:w-fit"
      >
        {[
          { key: 'trips', label: 'Trips', icon: Bus, count: totalTrips },
          { key: 'registrations', label: 'Registrations', icon: Users, count: (registrations || []).length },
        ].map((tab) => {
          const Icon = tab.icon
          const active = view === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => setView(tab.key)}
              className={`flex-1 sm:flex-none min-h-[44px] px-5 rounded-xl text-xs font-bold uppercase tracking-label transition-all flex items-center justify-center gap-2 whitespace-nowrap ${
                active ? 'bg-saffron text-white shadow-md' : 'text-ink-muted hover:text-saffron'
              }`}
            >
              <Icon size={15} /> {tab.label}
              <span className={`px-1.5 py-0.5 rounded-md text-[9px] ${active ? 'bg-white/25' : 'bg-paper-dark text-ink-muted'}`}>
                {tab.count}
              </span>
            </button>
          )
        })}
      </ScrollRow>

      {/* ================= TRIPS VIEW ================= */}
      {view === 'trips' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <SummaryTile label="Total Trips" value={totalTrips} icon={Bus} />
            <SummaryTile label="Upcoming" value={upcomingTrips} icon={Calendar} tone="green" />
            <SummaryTile label="Open for Registration" value={openTrips} icon={ToggleRight} tone="amber" />
            <SummaryTile label="Registrations" value={(registrations || []).length} icon={Users} tone="slate" />
          </div>

          {tripError && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-bold flex items-start gap-2 user-text-box">
              <AlertTriangle size={14} className="shrink-0" /> <span className="user-text">{tripError}</span>
            </div>
          )}

          {sortedTrips.length === 0 ? (
            <Card className="p-10 text-center border-none shadow-sm bg-white">
              <Bus className="mx-auto text-saffron/30 mb-4" size={44} />
              <p className="text-ink-muted text-sm mb-5">No trips yet — create the first yatra.</p>
              <Button onClick={openCreate} className="mx-auto px-8 rounded-2xl font-bold">
                <Plus size={18} /> New Trip
              </Button>
            </Card>
          ) : (
            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {sortedTrips.map((trip) => {
                  const stats = regStatsByTrip.get(trip.id) || { count: 0, seats: 0 }
                  const busy = tripBusy === trip.id
                  // Places this yatra visits — blank rows never reach the doc,
                  // but an older trip has no `locations` field at all.
                  const locationCount = Array.isArray(trip.locations) ? trip.locations.length : 0
                  return (
                    <motion.div key={trip.id} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }}>
                      <Card hover={false} className="p-4 sm:p-5 border-none shadow-premium bg-white rounded-xl sm:rounded-xl overflow-hidden">
                        {/* Side-by-side only from xl. The app shell is
                            `lg:pl-64` inside max-w-[1400px], so at 1024px this
                            card is ~704px wide — the thumb (112) plus the
                            control column (290) plus gaps is 434px of fixed
                            furniture, leaving the meta column 270px. Below xl
                            the card stacks and every part gets full width. */}
                        <div className="flex flex-col xl:flex-row xl:items-center gap-4">

                          {/* thumb */}
                          <div className="w-full h-36 xl:w-28 xl:h-20 shrink-0 rounded-2xl overflow-hidden bg-saffron flex items-center justify-center">
                            {trip.coverImage ? (
                              <img src={trip.coverImage} alt={trip.title} className="w-full h-full object-cover" />
                            ) : (
                              <Bus size={26} className="text-saffron/30" />
                            )}
                          </div>

                          {/* meta */}
                          <div className="flex-1 min-w-0 user-text-box">
                            <h3 className="font-bold text-ink text-sm sm:text-base user-text">{trip.title || 'Untitled trip'}</h3>
                            <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                              <span className={`text-[9px] font-bold px-2 py-1 rounded-lg uppercase tracking-label border whitespace-nowrap ${tripStatusClass(trip.status)}`}>
                                {trip.status || 'draft'}
                              </span>
                              <span className={`text-[9px] font-bold px-2 py-1 rounded-lg uppercase tracking-label border whitespace-nowrap ${
                                trip.registrationOpen ? 'text-green-600 bg-green-50 border-green-200' : 'text-ink-muted bg-paper border-line'
                              }`}>
                                {trip.registrationOpen ? 'Registrations open' : 'Registrations closed'}
                              </span>
                              {/* payment rails at a glance — absent field means online is on */}
                              {trip.onlinePaymentEnabled !== false && (
                                <span className="text-[9px] font-bold px-2 py-1 rounded-lg uppercase tracking-label border text-emerald-700 bg-emerald-50 border-emerald-200 inline-flex items-center gap-1 whitespace-nowrap">
                                  <CreditCard size={10} /> Online
                                </span>
                              )}
                              {trip.cashPaymentEnabled === true && (
                                <span className="text-[9px] font-bold px-2 py-1 rounded-lg uppercase tracking-label border text-teal-700 bg-teal-50 border-teal-200 inline-flex items-center gap-1 whitespace-nowrap">
                                  <Banknote size={10} /> Cash
                                </span>
                              )}
                              {trip.onlinePaymentEnabled === false && trip.cashPaymentEnabled !== true && (
                                <span className="text-[9px] font-bold px-2 py-1 rounded-lg uppercase tracking-label border text-amber-700 bg-amber-50 border-amber-200 inline-flex items-center gap-1 whitespace-nowrap">
                                  <AlertTriangle size={10} /> No payment
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-ink-muted font-mono mt-1.5 user-text">/trip/{trip.slug || '—'}</p>
                            <div className="flex items-center gap-x-4 gap-y-1 flex-wrap mt-2 text-[11px] text-ink-muted font-semibold user-text-box">
                              <span className="flex items-center gap-1.5 whitespace-nowrap"><Calendar size={12} className="text-gold shrink-0" /> {formatDate(trip.startDate)} → {formatDate(trip.endDate)}</span>
                              {trip.location && <span className="flex items-center gap-1.5 min-w-0 max-w-full user-text-box"><MapPin size={12} className="text-saffron shrink-0" /> <span className="user-text">{trip.location}</span></span>}
                              <span className="flex items-center gap-1.5 whitespace-nowrap"><IndianRupee size={12} className="text-emerald-500 shrink-0" /> {formatINR(trip.price)}</span>
                              <span className="flex items-center gap-1.5"><Users size={12} className="text-celestial-dark shrink-0" /> {stats.count} registration{stats.count === 1 ? '' : 's'}{trip.capacity ? ` · ${stats.seats}/${trip.capacity} seats` : ''}</span>
                              {locationCount > 0 && (
                                <span className="flex items-center gap-1.5 whitespace-nowrap">
                                  <MapPin size={12} className="text-gold shrink-0" /> {locationCount} place{locationCount === 1 ? '' : 's'}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* controls */}
                          <div className="flex flex-col gap-2 shrink-0 w-full xl:w-[290px]">
                            <div className="flex items-center gap-2">
                              <select
                                value={TRIP_STATUSES.includes(trip.status) ? trip.status : 'draft'}
                                disabled={busy}
                                aria-label={`Status for ${trip.title}`}
                                onChange={(e) => handleTripStatus(trip, e.target.value)}
                                className="flex-1 min-w-0 min-h-[44px] px-3 bg-cream/40 border border-saffron/10 rounded-xl text-xs font-bold text-ink-muted outline-none focus:border-saffron/40 disabled:opacity-60"
                              >
                                {TRIP_STATUSES.map((s) => (
                                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                                ))}
                              </select>
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => handleToggleRegistration(trip)}
                                aria-label={trip.registrationOpen ? `Close registrations for ${trip.title}` : `Open registrations for ${trip.title}`}
                                className={`min-h-[44px] px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-60 ${
                                  trip.registrationOpen ? 'bg-green-50 text-green-600 hover:bg-green-100' : 'bg-paper-dark text-ink-muted hover:bg-paper-dark'
                                }`}
                              >
                                {busy ? <Loader2 size={15} className="animate-spin shrink-0" /> : trip.registrationOpen ? <ToggleRight size={16} className="shrink-0" /> : <ToggleLeft size={16} className="shrink-0" />}
                                <span className="hidden sm:inline">{trip.registrationOpen ? 'Open' : 'Closed'}</span>
                              </button>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-2 gap-2">
                              <button
                                onClick={() => openEdit(trip)}
                                aria-label={`Edit ${trip.title}`}
                                className="min-h-[44px] bg-saffron/10 text-saffron-dark text-[11px] font-bold rounded-xl hover:bg-saffron hover:text-white transition-colors flex items-center justify-center gap-1.5"
                              >
                                <Edit3 size={13} /> Edit
                              </button>
                              <button
                                onClick={() => openDuplicate(trip)}
                                aria-label={`Duplicate ${trip.title}`}
                                className="min-h-[44px] bg-paper-dark text-ink-muted text-[11px] font-bold rounded-xl hover:bg-paper-dark transition-colors flex items-center justify-center gap-1.5"
                              >
                                <Copy size={13} /> Copy
                              </button>
                              <button
                                onClick={() => openTrip && trip.slug && openTrip(trip.slug)}
                                disabled={!trip.slug}
                                aria-label={`View public page for ${trip.title}`}
                                className="min-h-[44px] bg-paper-dark text-ink-muted text-[11px] font-bold rounded-xl hover:bg-paper-dark transition-colors flex items-center justify-center gap-1.5 disabled:opacity-40"
                              >
                                <ExternalLink size={13} /> View
                              </button>
                              {isAdmin ? (
                                <button
                                  onClick={() => askDelete(trip)}
                                  aria-label={`Delete ${trip.title}`}
                                  className="min-h-[44px] bg-red-50 text-red-500 text-[11px] font-bold rounded-xl hover:bg-red-100 transition-colors flex items-center justify-center gap-1.5"
                                >
                                  <Trash2 size={13} /> Delete
                                </button>
                              ) : (
                                <button
                                  onClick={() => { setFilterTrip(trip.id); setView('registrations') }}
                                  aria-label={`See registrations for ${trip.title}`}
                                  className="min-h-[44px] bg-paper-dark text-ink-muted text-[11px] font-bold rounded-xl hover:bg-paper-dark transition-colors flex items-center justify-center gap-1.5"
                                >
                                  <Users size={13} /> Regs
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}

      {/* ================= REGISTRATIONS VIEW ================= */}
      {view === 'registrations' && (
        <div className="space-y-5">

          {/* Summary strip — Collected sums verified online AND recorded cash.
              Five across only from xl: at 1024px the content box is ~704px, so
              five tiles are 124px each and a lakh-scale "Collected" figure
              breaks mid-number inside its own tile. */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
            <SummaryTile label="Registrations" value={regSummary.total} icon={Users} />
            <SummaryTile label="Confirmed" value={regSummary.confirmed} icon={CheckCircle2} tone="green" />
            <SummaryTile label="Seats Booked" value={regSummary.seats} sub="confirmed only" icon={Bus} tone="slate" />
            <SummaryTile
              label="Collected"
              value={formatINR(regSummary.collected)}
              sub={`${formatINR(regSummary.online)} online · ${formatINR(regSummary.cash)} cash`}
              icon={Wallet}
              tone="green"
            />
            <SummaryTile
              label="Pending"
              value={formatINR(regSummary.pending)}
              sub={regSummary.cashToCollect > 0
                ? `${regSummary.cashToCollect} awaiting cash`
                : 'not yet paid'}
              icon={Hourglass}
              tone="amber"
            />
          </div>

          {/* filters */}
          <Card hover={false} className="p-4 sm:p-5 border-none shadow-premium bg-white rounded-xl sm:rounded-xl">
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted/50 pointer-events-none" size={16} />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search name, phone or email…"
                  aria-label="Search registrations"
                  className="w-full min-h-[44px] pl-11 pr-4 py-3 bg-cream/30 border border-saffron/10 rounded-xl outline-none focus:bg-white focus:border-saffron/40 transition-all text-sm font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <select
                  value={filterTrip}
                  onChange={(e) => setFilterTrip(e.target.value)}
                  aria-label="Filter by trip"
                  className="w-full min-w-0 min-h-[44px] px-4 bg-cream/30 border border-saffron/10 rounded-xl text-xs font-bold text-ink-muted outline-none focus:border-saffron/40"
                >
                  <option value="all">All trips</option>
                  {sortedTrips.map((t) => (
                    <option key={t.id} value={t.id}>{t.title || t.slug}</option>
                  ))}
                </select>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  aria-label="Filter by status"
                  className="w-full min-w-0 min-h-[44px] px-4 bg-cream/30 border border-saffron/10 rounded-xl text-xs font-bold text-ink-muted outline-none focus:border-saffron/40"
                >
                  <option value="all">All statuses</option>
                  {REG_STATUSES.map((s) => (
                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                {/* payment-method filter */}
                <div
                  role="group"
                  aria-label="Filter by payment method"
                  className="flex-1 min-w-0 flex items-center gap-1 p-1 bg-cream/40 rounded-xl border border-saffron/10"
                >
                  {[
                    { key: 'all', label: 'All', icon: Layers },
                    { key: 'online', label: 'Online', icon: CreditCard },
                    { key: 'cash', label: 'Cash', icon: Banknote },
                  ].map((m) => {
                    const Icon = m.icon
                    const active = filterMethod === m.key
                    return (
                      <button
                        key={m.key}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setFilterMethod(m.key)}
                        className={`flex-1 min-w-0 min-h-[44px] px-2 rounded-lg text-[10px] font-bold uppercase tracking-label flex items-center justify-center gap-1.5 transition-all ${
                          active ? 'bg-white text-saffron-dark shadow-sm' : 'text-ink-muted hover:text-saffron'
                        }`}
                      >
                        <Icon size={13} className="shrink-0" />
                        <span className="truncate">{m.label}</span>
                      </button>
                    )
                  })}
                </div>

                <Button
                  variant="secondary"
                  onClick={exportRegistrations}
                  disabled={filteredRegs.length === 0}
                  className="w-full sm:w-auto shrink-0 min-h-[44px] px-5 rounded-xl text-xs font-bold uppercase tracking-label disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  <Download size={15} /> Export CSV
                </Button>
              </div>

              {(filterTrip !== 'all' || filterStatus !== 'all' || filterMethod !== 'all' || search) && (
                <div className="flex items-center justify-between gap-3 pt-1">
                  <p className="text-[11px] font-bold text-ink-muted user-text">
                    Showing {filteredRegs.length} of {(registrations || []).length}
                  </p>
                  <button
                    type="button"
                    onClick={() => { setFilterTrip('all'); setFilterStatus('all'); setFilterMethod('all'); setSearch('') }}
                    className="min-h-[44px] px-3 rounded-lg text-[10px] font-bold uppercase tracking-label text-ink-muted hover:text-saffron hover:bg-cream/50 transition-colors shrink-0"
                  >
                    Clear filters
                  </button>
                </div>
              )}
            </div>
          </Card>

          {regError && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-bold flex items-start gap-2 user-text-box">
              <AlertTriangle size={14} className="shrink-0" /> <span className="user-text">{regError}</span>
            </div>
          )}

          {regsLoading && (registrations || []).length === 0 ? (
            <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-saffron" size={28} /></div>
          ) : filteredRegs.length === 0 ? (
            <Card className="p-8 sm:p-12 text-center border-none shadow-sm bg-white rounded-xl sm:rounded-xl">
              <div className="w-14 h-14 rounded-2xl bg-saffron flex items-center justify-center mx-auto mb-4">
                <Users className="text-saffron/50" size={26} />
              </div>
              <p className="font-bold text-ink-muted text-sm">
                {(registrations || []).length === 0 ? 'No registrations yet' : 'Nothing matches these filters'}
              </p>
              <p className="text-ink-muted text-xs mt-1.5 max-w-sm mx-auto leading-relaxed">
                {(registrations || []).length === 0
                  ? 'Once a trip is published with registrations open, every devotee who books a seat appears here.'
                  : 'Try a different trip, status or payment method — or clear the filters to see everything.'}
              </p>
              {(registrations || []).length > 0 && (
                <button
                  type="button"
                  onClick={() => { setFilterTrip('all'); setFilterStatus('all'); setFilterMethod('all'); setSearch('') }}
                  className="mt-5 min-h-[44px] px-6 rounded-2xl bg-saffron/10 text-saffron-dark text-[11px] font-bold uppercase tracking-label hover:bg-saffron hover:text-white transition-colors"
                >
                  Clear filters
                </button>
              )}
            </Card>
          ) : (
            <>
            {/* ---- below xl: stacked cards. A 1000px table is unusable on a
                 phone, so the same data is re-laid-out rather than scrolled.
                 The cut-off is xl, not md: the app shell is `lg:pl-64` inside
                 max-w-[1400px], so the content box is only ~704px at 1024px
                 and ~960px at 1280px — a md-and-up table meant everything
                 from 768px to 1280px scrolled sideways by 300-450px. ---- */}
            <div className="xl:hidden space-y-3">
              {filteredRegs.map((reg) => {
                const pay = resolvePayment(reg)
                const meta = payMeta(pay.state)
                const busy = regBusy === reg.id
                const status = (reg.status || 'pending').toLowerCase()
                const expanded = noteOpen === reg.id
                const hasDetail = expanded || reg.travellerNotes || reg.emergencyContact || reg.staffNotes || pay.cashDone
                return (
                  <Card
                    key={reg.id}
                    hover={false}
                    className="p-4 border-none shadow-premium bg-white rounded-[1.25rem] overflow-hidden user-text-box"
                  >
                    <div className="flex items-start gap-3 user-text-box">
                      <span className={`w-1.5 self-stretch rounded-full shrink-0 ${meta.dot}`} aria-hidden="true" />
                      <div className="flex-1 min-w-0 user-text-box">
                        <p className="font-bold text-ink text-sm user-text">{reg.userName || 'Devotee'}</p>
                        <p className="text-[11px] text-ink-muted font-bold mt-0.5 user-text">{reg.tripTitle || '—'}</p>

                        <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                          <PayChip pay={pay} />
                          <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-1 rounded-lg uppercase tracking-label border whitespace-nowrap ${regStatusClass(status)}`}>
                            {regStatusIcon(status)} {status}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mt-3 text-[11px] font-semibold text-ink-muted user-text-box">
                          <span className="user-text">{toInt(reg.seats) || 1} seat{(toInt(reg.seats) || 1) === 1 ? '' : 's'}</span>
                          <span className="user-text text-right font-bold text-ink-soft">{formatINR(reg.amountDue)} due</span>
                          {reg.userPhone && (
                            <a
                              href={`tel:${reg.userPhone}`}
                              className="col-span-2 flex items-center gap-1.5 text-ink-muted hover:text-saffron min-h-[44px] -my-1 user-text-box"
                            >
                              <Phone size={11} className="shrink-0" /> <span className="user-text">{reg.userPhone}</span>
                            </a>
                          )}
                          {reg.userEmail && (
                            <span className="col-span-2 flex items-center gap-1.5 text-ink-muted user-text-box">
                              <Mail size={11} className="shrink-0" /> <span className="user-text">{reg.userEmail}</span>
                            </span>
                          )}
                          <span className="col-span-2 text-ink-muted/50 user-text">Registered {formatStamp(reg.createdAt)}</span>
                          {/* What the team needs to buy tickets. */}
                          <span className="col-span-2 mt-1 user-text-box">
                            {detailsComplete(reg) ? (
                              <span className="block rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2">
                                <span className="block text-[9px] font-bold uppercase tracking-[0.14em] text-emerald-700 mb-1">Travellers</span>
                                {(reg.travellers || []).map((t, i) => (
                                  <span key={i} className="block text-[11px] text-ink user-text">
                                    {t.name}{t.age ? `, ${t.age}` : ''}{t.gender ? `, ${t.gender}` : ''}
                                    {t.idNumber ? ` · ${t.idType || 'ID'} ${t.idNumber}` : ''}
                                    {t.college ? <span className="block text-ink-muted">{[t.college, t.course, t.year].filter(Boolean).join(' · ')}</span> : null}
                                  </span>
                                ))}
                                {reg.pickup && <span className="block mt-1 text-[11px] text-ink-muted user-text">Boarding: {reg.pickup}</span>}
                              </span>
                            ) : (
                              <span className="block rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-[11px] font-bold text-amber-700">
                                Travel details not filled in yet
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mt-3.5 pt-3.5 border-t border-line/60">
                      {regActions(reg, pay, busy, status, expanded)}
                    </div>

                    {hasDetail && (
                      <div className="mt-3 pt-3 border-t border-line/60">
                        {regDetailPanel(reg, pay, busy, expanded)}
                      </div>
                    )}
                  </Card>
                )
              })}
            </div>

            {/* ---- xl and up: the reconciliation table ---- */}
            <Card hover={false} className="hidden xl:block p-0 border-none shadow-premium bg-white rounded-xl sm:rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px]">
                  <thead>
                    <tr className="text-left text-[10px] font-bold text-ink-muted uppercase tracking-label border-b border-line bg-cream/20">
                      <th className="py-4 px-5 font-bold">Devotee</th>
                      <th className="py-4 px-3 font-bold">Trip</th>
                      <th className="py-4 px-3 font-bold">Seats</th>
                      <th className="py-4 px-3 font-bold">Amount</th>
                      <th className="py-4 px-3 font-bold">Payment</th>
                      <th className="py-4 px-3 font-bold">Status</th>
                      <th className="py-4 px-3 font-bold">Registered</th>
                      <th className="py-4 px-5 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line/60">
                    {filteredRegs.map((reg) => {
                      const pay = resolvePayment(reg)
                      const meta = payMeta(pay.state)
                      const busy = regBusy === reg.id
                      const status = (reg.status || 'pending').toLowerCase()
                      const expanded = noteOpen === reg.id
                      const hasDetail = expanded || reg.travellerNotes || reg.emergencyContact || reg.staffNotes || pay.cashDone || pay.orderId
                      return (
                        <React.Fragment key={reg.id}>
                          <tr className="hover:bg-cream/20 transition-colors align-top">
                            <td className="py-4 px-5">
                              {/* min/max rather than a fixed w-[210px]: a fixed
                                  width is also a minimum, so three of them put
                                  the table's real min-content at ~1160px — well
                                  past the 900px floor — and the card scrolled
                                  sideways at every desktop width. */}
                              <div className="flex items-start gap-2.5 min-w-[150px] max-w-[260px] user-text-box">
                                <span className={`w-1 self-stretch rounded-full shrink-0 mt-0.5 ${meta.dot}`} aria-hidden="true" />
                                <div className="min-w-0 user-text-box">
                                  <p className="font-bold text-ink text-sm user-text">{reg.userName || 'Devotee'}</p>
                                  <div className="text-[11px] text-ink-muted font-medium mt-1 space-y-0.5 user-text-box">
                                    {reg.userPhone && <p className="flex items-center gap-1.5 user-text-box"><Phone size={10} className="shrink-0" /> <span className="user-text">{reg.userPhone}</span></p>}
                                    {reg.userEmail && <p className="flex items-center gap-1.5 user-text-box"><Mail size={10} className="shrink-0" /> <span className="user-text">{reg.userEmail}</span></p>}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-3">
                              <div className="min-w-[120px] max-w-[210px] user-text-box">
                                <p className="text-xs font-bold text-ink-muted user-text">{reg.tripTitle || '—'}</p>
                                <p className="text-[10px] text-ink-muted font-mono user-text">{reg.tripSlug || ''}</p>
                              </div>
                            </td>
                            <td className="py-4 px-3 text-sm font-bold text-ink-soft">{toInt(reg.seats) || 1}</td>
                            <td className="py-4 px-3 text-sm font-bold text-ink-soft whitespace-nowrap">{formatINR(reg.amountDue)}</td>
                            <td className="py-4 px-3">
                              <div className="min-w-[130px] max-w-[200px] user-text-box">
                              <PayChip pay={pay} />
                              {pay.state === 'cash_collected' && (
                                <p className="text-[10px] text-teal-600 font-bold mt-1 user-text">
                                  {formatINR(pay.cashAmount)} · {formatStamp(pay.cashAt)}
                                </p>
                              )}
                              {pay.state === 'online_paid' && pay.onlineAmount > 0 && (
                                <p className="text-[10px] text-emerald-600 font-bold mt-1 user-text">{formatINR(pay.onlineAmount)} verified</p>
                              )}
                              {pay.state === 'cash_pending' && (
                                <p className="text-[10px] text-orange-500 font-bold mt-1 user-text">to collect at office</p>
                              )}
                              {pay.state === 'online_pending' && pay.orderId && (
                                <p className="text-[9px] text-ink-muted font-mono mt-1 user-text" title={pay.orderId}>{pay.orderId}</p>
                              )}
                              </div>
                            </td>
                            <td className="py-4 px-3">
                              <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-1 rounded-lg uppercase tracking-label border whitespace-nowrap ${regStatusClass(status)}`}>
                                {regStatusIcon(status)} {status}
                              </span>
                            </td>
                            <td className="py-4 px-3 text-[11px] text-ink-muted font-semibold whitespace-nowrap">{formatStamp(reg.createdAt)}</td>
                            <td className="py-4 px-5">
                              <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                {regActions(reg, pay, busy, status, expanded)}
                              </div>
                            </td>
                          </tr>

                          {hasDetail && (
                            <tr className="bg-cream/20">
                              <td colSpan={8} className="px-5 pb-4">
                                {regDetailPanel(reg, pay, busy, expanded)}
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
            </>
          )}
        </div>
      )}

      {/* ================= CREATE / EDIT MODAL ================= */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={closeModal}
              className="absolute inset-0 bg-ink/60"
            />
            <motion.div
              initial={{ scale: 0.95, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 30 }}
              className="relative w-full max-w-3xl bg-white rounded-xl sm:rounded-xl shadow-premium-xl overflow-y-auto max-h-[90vh] border border-saffron/10"
            >
              <button
                onClick={closeModal}
                aria-label="Close"
                className="absolute top-4 right-4 w-11 h-11 rounded-full hover:bg-paper flex items-center justify-center text-ink-muted transition-all z-10"
              >
                <X size={22} />
              </button>

              <div className="p-5 sm:p-8 pb-0">
                <div className="w-12 h-12 bg-saffron rounded-2xl flex items-center justify-center mb-3 shadow-lg">
                  <Sparkles className="text-white" size={22} />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-ink pr-12">
                  {editingId ? 'Edit Trip' : 'New Trip'}
                </h2>
                <p className="text-ink-muted text-xs sm:text-sm mt-1">
                  {editingId ? 'Update the yatra details devotees see on its landing page.' : 'Set up a pilgrimage devotees can browse and register for.'}
                </p>

                {/* Section nav. Six tabs never fit a 360px phone, so the strip
                    scrolls — and ScrollRow draws the edge fade that says so. */}
                <ScrollRow
                  outerClassName="mt-5 -mx-5 sm:mx-0"
                  className="flex gap-2 px-5 sm:px-0 pb-1"
                >
                  {MODAL_SECTIONS.map((s) => {
                    const Icon = s.icon
                    const active = section === s.key
                    const bad = showErrors && sectionErrors[s.key]
                    return (
                      <button
                        key={s.key}
                        type="button"
                        onClick={() => setSection(s.key)}
                        className={`relative shrink-0 min-h-[44px] px-4 rounded-xl text-[11px] font-bold uppercase tracking-label whitespace-nowrap flex items-center gap-2 transition-all ${
                          active ? 'bg-saffron text-white shadow-md' : 'bg-cream/40 text-ink-muted hover:text-saffron'
                        }`}
                      >
                        <Icon size={14} className="shrink-0" /> {s.label}
                        {bad && <span className="w-1.5 h-1.5 rounded-full bg-red-500 absolute top-2 right-2" />}
                      </button>
                    )
                  })}
                </ScrollRow>
              </div>

              <form onSubmit={handleSubmit} className="p-5 sm:p-8 pt-6 space-y-6">

                {/* ---------- BASICS ---------- */}
                {section === 'basics' && (
                  <div className="space-y-5">
                    <Field label="Trip Title" error={showErrors ? errors.title : ''}>
                      <input
                        type="text"
                        value={form.title}
                        onChange={(e) => handleTitleChange(e.target.value)}
                        placeholder="Vrindavan Yatra 2026"
                        className={inputClass}
                      />
                    </Field>

                    <Field
                      label="Slug"
                      hint={`Public page: /trip/${form.slug || '…'}`}
                      error={showErrors ? errors.slug : ''}
                    >
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={form.slug}
                          onChange={(e) => { setSlugTouched(true); setField('slug', e.target.value) }}
                          onBlur={(e) => setField('slug', slugify(e.target.value))}
                          placeholder="vrindavan-yatra-2026"
                          className={`${inputClass} font-mono`}
                        />
                        <button
                          type="button"
                          aria-label="Regenerate slug from title"
                          onClick={() => { setSlugTouched(true); setField('slug', slugify(form.title)) }}
                          className="min-h-[44px] px-4 rounded-xl bg-saffron/10 text-saffron text-[10px] font-bold uppercase tracking-label hover:bg-saffron hover:text-white transition-colors shrink-0"
                        >
                          Auto
                        </button>
                      </div>
                    </Field>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field label="Subtitle">
                        <input
                          type="text"
                          value={form.subtitle}
                          onChange={(e) => setField('subtitle', e.target.value)}
                          placeholder="Kartik month pilgrimage"
                          className={inputClass}
                        />
                      </Field>
                      <Field label="Location">
                        <input
                          type="text"
                          value={form.location}
                          onChange={(e) => setField('location', e.target.value)}
                          placeholder="Vrindavan, Uttar Pradesh"
                          className={inputClass}
                        />
                      </Field>
                    </div>

                    <Field label="Description">
                      <textarea
                        rows={5}
                        value={form.description}
                        onChange={(e) => setField('description', e.target.value)}
                        placeholder="What devotees will experience on this yatra…"
                        className="w-full bg-cream/30 border border-saffron/10 rounded-2xl px-4 py-3 outline-none focus:bg-white focus:border-saffron/40 transition-all font-medium text-sm resize-none"
                      />
                    </Field>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field label="Meeting Point">
                        <input
                          type="text"
                          value={form.meetingPoint}
                          onChange={(e) => setField('meetingPoint', e.target.value)}
                          placeholder="HKM Vizag temple gate, 5:00 AM"
                          className={inputClass}
                        />
                      </Field>
                      <Field label="Contact Phone">
                        <input
                          type="tel"
                          value={form.contactPhone}
                          onChange={(e) => setField('contactPhone', e.target.value)}
                          placeholder="+91 90000 00000"
                          className={inputClass}
                        />
                      </Field>
                    </div>

                    <StringListEditor
                      label="Highlights"
                      items={form.highlights}
                      onChange={(v) => setField('highlights', v)}
                      placeholder="Govardhan parikrama"
                    />
                  </div>
                )}

                {/* ---------- DATES & PRICING ---------- */}
                {section === 'dates' && (
                  <div className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field label="Start Date" error={showErrors ? errors.startDate : ''}>
                        <input
                          type="date"
                          value={form.startDate}
                          onChange={(e) => setField('startDate', e.target.value)}
                          className={inputClass}
                        />
                      </Field>
                      <Field label="End Date" error={showErrors ? errors.endDate : ''}>
                        <input
                          type="date"
                          value={form.endDate}
                          min={form.startDate || undefined}
                          onChange={(e) => setField('endDate', e.target.value)}
                          className={inputClass}
                        />
                      </Field>
                    </div>

                    <Field label="Duration Label" hint="shown on the card">
                      <input
                        type="text"
                        value={form.durationLabel}
                        onChange={(e) => setField('durationLabel', e.target.value)}
                        placeholder="6 Days / 5 Nights"
                        className={inputClass}
                      />
                    </Field>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <Field label="Price (₹ per person)" error={showErrors ? errors.price : ''}>
                        <input
                          type="number"
                          min={0}
                          step="1"
                          value={form.price}
                          onChange={(e) => setField('price', e.target.value)}
                          placeholder="7500"
                          className={inputClass}
                        />
                      </Field>
                      <Field label="Actual cost (₹)" hint="Shown struck through, e.g. 1300">
                        <input
                          type="number"
                          min={0}
                          step="1"
                          value={form.originalPrice}
                          onChange={(e) => setField('originalPrice', e.target.value)}
                          placeholder="1300"
                          className={inputClass}
                        />
                      </Field>
                      <Field label="Who can come" hint="Leave as Everyone unless the yatra is separate">
                        <select
                          value={form.eligibility}
                          onChange={(e) => setField('eligibility', e.target.value)}
                          className={inputClass}
                        >
                          <option value="">Everyone</option>
                          <option value="Boys only">Boys only</option>
                          <option value="Girls only">Girls only</option>
                        </select>
                      </Field>
                      <Field label="Advance (₹)" hint="0 = full only" error={showErrors ? errors.advanceAmount : ''}>
                        <input
                          type="number"
                          min={0}
                          step="1"
                          value={form.advanceAmount}
                          onChange={(e) => setField('advanceAmount', e.target.value)}
                          placeholder="2000"
                          className={inputClass}
                        />
                      </Field>
                      <Field label="Capacity (seats)" error={showErrors ? errors.capacity : ''}>
                        <input
                          type="number"
                          min={0}
                          step="1"
                          value={form.capacity}
                          onChange={(e) => setField('capacity', e.target.value)}
                          placeholder="45"
                          className={inputClass}
                        />
                      </Field>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field label="Status">
                        <select
                          value={form.status}
                          onChange={(e) => setField('status', e.target.value)}
                          className={inputClass}
                        >
                          {TRIP_STATUSES.map((s) => (
                            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Registrations">
                        <button
                          type="button"
                          onClick={() => setField('registrationOpen', !form.registrationOpen)}
                          aria-label={form.registrationOpen ? 'Close registrations' : 'Open registrations'}
                          className={`w-full min-h-[44px] px-4 rounded-xl text-xs font-bold uppercase tracking-label flex items-center justify-between transition-colors ${
                            form.registrationOpen ? 'bg-green-50 text-green-600' : 'bg-paper-dark text-ink-muted'
                          }`}
                        >
                          {form.registrationOpen ? 'Open' : 'Closed'}
                          {form.registrationOpen ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                        </button>
                      </Field>
                    </div>

                    {/* ---- payment rails ---- */}
                    <div className="space-y-3 pt-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <label className={labelClass}>How devotees pay</label>
                        <span className="text-[10px] text-ink-muted font-medium">at least one, normally</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <RailToggle
                          on={form.onlinePaymentEnabled}
                          onToggle={() => setField('onlinePaymentEnabled', !form.onlinePaymentEnabled)}
                          icon={CreditCard}
                          title="Online payment"
                          onCopy="Devotees pay by UPI, card or netbanking through Razorpay. The seat is marked paid automatically once the payment is verified."
                          offCopy="The Razorpay checkout is hidden. Devotees cannot pay online for this trip."
                        />
                        <RailToggle
                          on={form.cashPaymentEnabled}
                          onToggle={() => setField('cashPaymentEnabled', !form.cashPaymentEnabled)}
                          icon={Banknote}
                          title="Cash at the office"
                          onCopy="Devotees may choose to pay cash at the temple office. A staff member records the money in Registrations once it is handed over."
                          offCopy="Cash is not offered. Devotees will not see a pay-at-office option."
                        />
                      </div>

                      {!form.onlinePaymentEnabled && !form.cashPaymentEnabled && (
                        <div className={`p-4 rounded-2xl border-2 flex items-start gap-3 ${
                          form.registrationOpen
                            ? 'bg-amber-50 border-amber-300 text-amber-800'
                            : 'bg-paper border-line text-ink-muted'
                        }`}>
                          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0 text-[11px] font-medium leading-relaxed user-text-box">
                            {form.registrationOpen ? (
                              <>
                                <p className="font-bold uppercase tracking-label text-[10px] mb-1">
                                  Both payment methods are off while registrations are open
                                </p>
                                <p>
                                  Devotees can still book a seat, but the app cannot collect any money for it — every
                                  registration will arrive as <span className="font-bold">Unpaid</span> and has to be settled
                                  offline. That is a fine choice for a free or invitation-only yatra; if it was not deliberate,
                                  switch one of the two back on.
                                </p>
                              </>
                            ) : (
                              <p>
                                Both payment methods are off. Registrations are closed too, so nothing is broken — turn one on
                                before you open registrations if you intend to collect money through the app.
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="p-4 rounded-2xl bg-cream/40 border border-saffron/10 text-[11px] text-ink-muted font-medium leading-relaxed">
                      A trip only appears to devotees once its status is <span className="font-bold text-saffron-dark">upcoming</span> (or later);
                      <span className="font-bold text-saffron-dark"> draft</span> keeps it staff-only. Registrations can be closed independently
                      of the status — useful once the bus fills up.
                    </div>
                  </div>
                )}

                {/* ---------- MEDIA ---------- */}
                {section === 'media' && (
                  <div className="space-y-5">
                    {uploadsNotice}

                    <Field
                      label="Cover Image"
                      hint="wide shot · shown on the card and the trip page"
                      error={!uploads.cover ? uploadErrors.cover : ''}
                    >
                      <div className="flex flex-col sm:flex-row gap-4">
                        <div className="w-full sm:w-52 h-32 rounded-2xl overflow-hidden bg-cream/40 border border-saffron/10 flex items-center justify-center shrink-0">
                          {form.coverImage ? (
                            <img src={form.coverImage} alt="Trip cover" className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon size={30} className="text-saffron/30" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0 space-y-2">
                          <label
                            className={`flex items-center gap-3 w-full p-4 border-2 border-dashed rounded-2xl transition-all min-h-[44px] ${
                              uploads.cover || !uploadsConfigured
                                ? 'bg-paper border-line cursor-not-allowed opacity-70'
                                : 'bg-cream/30 border-saffron/20 hover:bg-cream/50 cursor-pointer'
                            }`}
                          >
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm shrink-0">
                              {uploads.cover
                                ? <Loader2 className="animate-spin text-saffron" size={18} />
                                : <ImageIcon className="text-ink-muted" size={18} />}
                            </div>
                            <span className="text-[10px] font-bold text-ink-muted uppercase tracking-label">
                              {uploads.cover
                                ? (UPLOAD_PHASE_LABEL[uploads.cover] || 'Working…')
                                : form.coverImage ? 'Replace cover' : 'Choose a cover'}
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              disabled={!!uploads.cover || !uploadsConfigured}
                              onChange={handleCoverUpload}
                              className="hidden"
                            />
                          </label>
                          {form.coverImage && !uploads.cover && (
                            <button
                              type="button"
                              onClick={removeCover}
                              aria-label="Remove the cover image"
                              className="min-h-[44px] px-4 bg-red-50 text-red-500 text-[10px] font-bold uppercase tracking-label rounded-xl hover:bg-red-100 transition-colors"
                            >
                              Remove cover
                            </button>
                          )}
                        </div>
                      </div>
                    </Field>

                    <Field
                      label="Gallery"
                      hint={`${(form.gallery || []).length}/${GALLERY_MAX} images`}
                      error={!galleryBusy ? uploadErrors.gallery : ''}
                    >
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {(form.gallery || []).map((src, i) => (
                          <div key={`${src}-${i}`} className="relative h-28 rounded-2xl overflow-hidden bg-cream/40 border border-saffron/10">
                            <img src={src} alt={`Gallery ${i + 1}`} className="w-full h-full object-cover" />
                            <button
                              type="button"
                              aria-label={`Remove gallery image ${i + 1}`}
                              onClick={() => removeGalleryImage(i)}
                              className="absolute top-1.5 right-1.5 w-11 h-11 rounded-full bg-ink/70 text-white flex items-center justify-center hover:bg-red-500 transition-colors"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                        {(form.gallery || []).length < GALLERY_MAX && (
                          <label
                            className={`h-28 border-2 border-dashed rounded-2xl transition-all flex flex-col items-center justify-center gap-1 text-center px-2 ${
                              galleryBusy || !uploadsConfigured
                                ? 'bg-paper border-line cursor-not-allowed opacity-70'
                                : 'bg-cream/30 border-saffron/20 hover:bg-cream/50 cursor-pointer'
                            }`}
                          >
                            {galleryBusy
                              ? <Loader2 className="animate-spin text-saffron" size={18} />
                              : <Plus className="text-saffron/50" size={20} />}
                            <span className="text-[9px] font-bold text-ink-muted uppercase tracking-label leading-tight">
                              {galleryBusy
                                ? (UPLOAD_PHASE_LABEL[uploads.gallery] || 'Uploading…')
                                : 'Add'}
                            </span>
                            {galleryBusy && galleryQueue && galleryQueue.total > 1 && (
                              <span className="text-[9px] font-bold text-ink-muted/70">
                                {galleryQueue.index} of {galleryQueue.total}
                              </span>
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              disabled={galleryBusy || !uploadsConfigured}
                              onChange={handleGalleryUpload}
                              className="hidden"
                            />
                          </label>
                        )}
                      </div>
                    </Field>
                  </div>
                )}

                {/* ---------- ITINERARY ---------- */}
                {section === 'itinerary' && (
                  <div className="space-y-4">
                    {(form.itinerary || []).length === 0 && (
                      <div className="p-8 text-center bg-cream/30 rounded-2xl border border-dashed border-saffron/20">
                        <ListOrdered className="mx-auto text-saffron/30 mb-3" size={30} />
                        <p className="text-ink-muted text-xs">No days added yet — build the day-by-day plan here.</p>
                      </div>
                    )}

                    {(form.itinerary || []).map((day, i) => (
                      <div key={i} className="p-4 rounded-2xl bg-cream/25 border border-saffron/10 space-y-3">
                        {/* An <input> carries a ~170px intrinsic min-content
                            width, so `flex-1` alone would not let the title
                            shrink: 80 + 170 + three 44px buttons overflowed a
                            360px modal sideways. `min-w-0` lets it shrink and
                            `flex-wrap` drops the button cluster onto its own
                            line once the title cannot hold its 11rem basis. */}
                        <div className="flex flex-wrap items-center gap-2">
                          <input
                            type="number"
                            min={1}
                            value={day.day}
                            onChange={(e) => updateDay(i, 'day', e.target.value)}
                            aria-label={`Day number for entry ${i + 1}`}
                            className="w-20 shrink-0 px-3 py-3 min-h-[44px] bg-white border border-saffron/10 rounded-xl outline-none focus:border-saffron/40 font-bold text-sm text-center"
                          />
                          <input
                            type="text"
                            value={day.title}
                            onChange={(e) => updateDay(i, 'title', e.target.value)}
                            placeholder="Arrival & Mangala Aarti"
                            aria-label={`Title for day ${i + 1}`}
                            className="flex-1 min-w-0 basis-[11rem] px-4 py-3 min-h-[44px] bg-white border border-saffron/10 rounded-xl outline-none focus:border-saffron/40 font-medium text-sm"
                          />
                          <div className="flex gap-1 shrink-0 ml-auto">
                            <button
                              type="button" aria-label={`Move day ${i + 1} up`} disabled={i === 0}
                              onClick={() => moveDay(i, -1)}
                              className="w-11 h-11 rounded-xl bg-white border border-saffron/10 text-ink-muted hover:text-saffron flex items-center justify-center disabled:opacity-30"
                            >
                              <ChevronUp size={16} />
                            </button>
                            <button
                              type="button" aria-label={`Move day ${i + 1} down`} disabled={i === form.itinerary.length - 1}
                              onClick={() => moveDay(i, 1)}
                              className="w-11 h-11 rounded-xl bg-white border border-saffron/10 text-ink-muted hover:text-saffron flex items-center justify-center disabled:opacity-30"
                            >
                              <ChevronDown size={16} />
                            </button>
                            <button
                              type="button" aria-label={`Remove day ${i + 1}`}
                              onClick={() => removeDay(i)}
                              className="w-11 h-11 rounded-xl bg-red-50 text-red-400 hover:bg-red-100 flex items-center justify-center"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>
                        <textarea
                          rows={2}
                          value={day.details}
                          onChange={(e) => updateDay(i, 'details', e.target.value)}
                          placeholder="Temples visited, prasadam, evening programme…"
                          aria-label={`Details for day ${i + 1}`}
                          className="w-full bg-white border border-saffron/10 rounded-xl px-4 py-3 outline-none focus:border-saffron/40 text-sm font-medium resize-none"
                        />
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={addDay}
                      className="w-full min-h-[44px] py-3 bg-saffron/10 text-saffron-dark text-xs font-bold uppercase tracking-label rounded-2xl hover:bg-saffron hover:text-white transition-colors flex items-center justify-center gap-2"
                    >
                      <Plus size={16} /> Add Day
                    </button>
                  </div>
                )}

                {/* ---------- LOCATIONS ---------- */}
                {section === 'locations' && (
                  <div className="space-y-4">
                    {uploadsNotice}

                    <div className="p-4 rounded-2xl bg-cream/40 border border-saffron/10 text-[11px] text-ink-muted font-medium leading-relaxed">
                      The places this yatra visits — Govardhan Hill, Radha Kund, Keshi Ghat — each with its own
                      photo and a line or two about it. The arrows set the order devotees see them in.
                    </div>

                    {(form.locations || []).length === 0 ? (
                      <div className="p-8 text-center bg-cream/30 rounded-2xl border border-dashed border-saffron/20">
                        <MapPin className="mx-auto text-saffron/30 mb-3" size={30} />
                        <p className="text-ink-muted text-xs">No places added yet — add the first stop of this yatra.</p>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-[10px] font-bold uppercase tracking-label text-ink-muted">
                          {(form.locations || []).length} place{(form.locations || []).length === 1 ? '' : 's'}
                        </p>
                        {openLocation && (
                          <button
                            type="button"
                            onClick={() => setOpenLocation(null)}
                            className="min-h-[44px] px-3 rounded-lg text-[10px] font-bold uppercase tracking-label text-ink-muted hover:text-saffron hover:bg-cream/50 transition-colors shrink-0"
                          >
                            Collapse all
                          </button>
                        )}
                      </div>
                    )}

                    {/* One row open at a time, so a twenty-stop yatra is still
                        a list you can scan rather than a wall of inputs. */}
                    <div className="space-y-3">
                      {(form.locations || []).map((row, i) => {
                        const slotKey = `loc:${row.id}`
                        const phase = uploads[slotKey]
                        const error = uploadErrors[slotKey]
                        const expanded = openLocation === row.id
                        const rowName = row.name || `place ${i + 1}`
                        return (
                          <div key={row.id} className="rounded-2xl bg-cream/25 border border-saffron/10 overflow-hidden">
                            <div className="flex items-center gap-2 p-2.5">
                              <button
                                type="button"
                                aria-expanded={expanded}
                                aria-label={`${expanded ? 'Collapse' : 'Edit'} ${rowName}`}
                                onClick={() => setOpenLocation(expanded ? null : row.id)}
                                className="flex-1 min-w-0 min-h-[44px] flex items-center gap-2.5 text-left px-1 rounded-xl hover:bg-white/60 transition-colors"
                              >
                                <span className="w-9 h-9 rounded-xl overflow-hidden bg-white border border-saffron/10 flex items-center justify-center shrink-0">
                                  {row.image ? (
                                    <img src={row.image} alt="" className="w-full h-full object-cover" />
                                  ) : phase ? (
                                    <Loader2 size={14} className="animate-spin text-saffron" />
                                  ) : (
                                    <MapPin size={14} className="text-saffron/40" />
                                  )}
                                </span>
                                <span className="min-w-0 flex-1 user-text-box">
                                  <span className="block text-[9px] font-bold uppercase tracking-label text-ink-muted/70">
                                    Stop {i + 1}
                                  </span>
                                  <span className="block text-sm font-bold text-ink truncate user-text">
                                    {row.name || 'Untitled place'}
                                  </span>
                                </span>
                                <ChevronDown
                                  size={16}
                                  className={`shrink-0 text-ink-muted transition-transform ${expanded ? 'rotate-180' : ''}`}
                                />
                              </button>
                              <div className="flex gap-1 shrink-0">
                                <button
                                  type="button" aria-label={`Move ${rowName} up`} disabled={i === 0}
                                  onClick={() => moveLocation(i, -1)}
                                  className="w-11 h-11 rounded-xl bg-white border border-saffron/10 text-ink-muted hover:text-saffron flex items-center justify-center disabled:opacity-30"
                                >
                                  <ChevronUp size={16} />
                                </button>
                                <button
                                  type="button" aria-label={`Move ${rowName} down`} disabled={i === (form.locations || []).length - 1}
                                  onClick={() => moveLocation(i, 1)}
                                  className="w-11 h-11 rounded-xl bg-white border border-saffron/10 text-ink-muted hover:text-saffron flex items-center justify-center disabled:opacity-30"
                                >
                                  <ChevronDown size={16} />
                                </button>
                                <button
                                  type="button" aria-label={`Remove ${rowName}`}
                                  onClick={() => removeLocation(i)}
                                  className="w-11 h-11 rounded-xl bg-red-50 text-red-400 hover:bg-red-100 flex items-center justify-center"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </div>

                            {expanded && (
                              <div className="px-2.5 pb-3 pt-3 space-y-3 border-t border-saffron/10">
                                <input
                                  type="text"
                                  value={row.name}
                                  onChange={(e) => updateLocation(i, 'name', e.target.value)}
                                  placeholder="Govardhan Hill"
                                  aria-label={`Name of place ${i + 1}`}
                                  className="w-full px-4 py-3 min-h-[44px] bg-white border border-saffron/10 rounded-xl outline-none focus:border-saffron/40 font-medium text-sm"
                                />
                                <textarea
                                  rows={2}
                                  value={row.description}
                                  onChange={(e) => updateLocation(i, 'description', e.target.value)}
                                  placeholder="The sacred hill Krishna lifted — devotees do the parikrama barefoot."
                                  aria-label={`Description of place ${i + 1}`}
                                  className="w-full bg-white border border-saffron/10 rounded-xl px-4 py-3 outline-none focus:border-saffron/40 text-sm font-medium resize-none"
                                />

                                <div className="flex flex-col sm:flex-row gap-3">
                                  <div className="w-full sm:w-36 h-24 rounded-xl overflow-hidden bg-white border border-saffron/10 flex items-center justify-center shrink-0">
                                    {row.image ? (
                                      <img src={row.image} alt={`Photo of ${rowName}`} className="w-full h-full object-cover" />
                                    ) : (
                                      <ImageIcon size={22} className="text-saffron/30" />
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0 space-y-2">
                                    <label
                                      className={`flex items-center gap-2.5 w-full p-3 border-2 border-dashed rounded-xl transition-all min-h-[44px] ${
                                        phase || !uploadsConfigured
                                          ? 'bg-paper border-line cursor-not-allowed opacity-70'
                                          : 'bg-white border-saffron/20 hover:bg-cream/40 cursor-pointer'
                                      }`}
                                    >
                                      <span className="w-8 h-8 bg-cream/50 rounded-lg flex items-center justify-center shrink-0">
                                        {phase
                                          ? <Loader2 className="animate-spin text-saffron" size={15} />
                                          : <ImageIcon className="text-ink-muted" size={15} />}
                                      </span>
                                      <span className="text-[10px] font-bold text-ink-muted uppercase tracking-label">
                                        {phase
                                          ? (UPLOAD_PHASE_LABEL[phase] || 'Working…')
                                          : row.image ? 'Replace photo' : 'Add a photo'}
                                      </span>
                                      <input
                                        type="file"
                                        accept="image/*"
                                        disabled={!!phase || !uploadsConfigured}
                                        onChange={(e) => handleLocationUpload(i, e)}
                                        className="hidden"
                                      />
                                    </label>
                                    {row.image && !phase && (
                                      <button
                                        type="button"
                                        onClick={() => removeLocationImage(i)}
                                        aria-label={`Remove the photo of ${rowName}`}
                                        className="min-h-[44px] px-4 bg-red-50 text-red-500 text-[10px] font-bold uppercase tracking-label rounded-xl hover:bg-red-100 transition-colors"
                                      >
                                        Remove photo
                                      </button>
                                    )}
                                    <UploadStatus phase={phase} error={error} />
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>

                    <button
                      type="button"
                      onClick={addLocation}
                      className="w-full min-h-[44px] py-3 bg-saffron/10 text-saffron-dark text-xs font-bold uppercase tracking-label rounded-2xl hover:bg-saffron hover:text-white transition-colors flex items-center justify-center gap-2"
                    >
                      <Plus size={16} /> Add Place
                    </button>
                  </div>
                )}

                {/* ---------- INCLUSIONS ---------- */}
                {section === 'inclusions' && (
                  <div className="space-y-6">
                    <StringListEditor
                      label="Inclusions"
                      items={form.inclusions}
                      onChange={(v) => setField('inclusions', v)}
                      placeholder="AC bus travel, prasadam, accommodation"
                    />
                    <div className="h-px bg-paper-dark" />
                    <StringListEditor
                      label="Exclusions"
                      items={form.exclusions}
                      onChange={(v) => setField('exclusions', v)}
                      placeholder="Personal shopping, entry tickets"
                    />
                  </div>
                )}

                {/* ---------- footer ---------- */}
                <div className="sticky bottom-0 -mx-5 sm:-mx-8 px-5 sm:px-8 pt-4 pb-1 bg-white border-t border-line space-y-3">
                  {showErrors && hasErrors && (
                    <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-[11px] font-bold flex items-start gap-2">
                      <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                      <span className="user-text">{Object.values(errors)[0]}</span>
                    </div>
                  )}
                  {saveError && (
                    <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-[11px] font-bold flex items-start gap-2 user-text-box">
                      <AlertTriangle size={14} className="shrink-0" /> <span className="user-text">{saveError}</span>
                    </div>
                  )}
                  <div className="flex flex-col sm:flex-row gap-3 items-center">
                    {/* Where the document-size meter used to sit: now the page
                        address being written, or why Save is waiting. */}
                    <p className="text-[10px] font-bold uppercase tracking-label flex-1 min-w-0 text-center sm:text-left truncate user-text">
                      {uploadsBusy ? (
                        <span className="text-saffron-dark inline-flex items-center gap-1.5">
                          <Loader2 size={12} className="animate-spin shrink-0" /> Uploading images…
                        </span>
                      ) : (
                        <span className="text-ink-muted/50">/trip/{form.slug || '…'}</span>
                      )}
                    </p>
                    <button
                      type="button"
                      onClick={closeModal}
                      disabled={saving || uploadsBusy}
                      className="w-full sm:w-auto min-h-[44px] px-6 rounded-2xl bg-paper-dark text-ink-muted text-xs font-bold uppercase tracking-label hover:bg-paper-dark transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <Button
                      type="submit"
                      disabled={saving || uploadsBusy}
                      className="w-full sm:w-auto py-3 px-8 bg-saffron shadow-lg font-bold rounded-2xl flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                      {saving || uploadsBusy ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
                      {saving ? 'Saving…' : uploadsBusy ? 'Uploading…' : editingId ? 'Save Changes' : 'Create Trip'}
                    </Button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================= DELETE CONFIRM (typed, in-page) ================= */}
      <AnimatePresence>
        {deleteTarget && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => !deleting && setDeleteTarget(null)}
              className="absolute inset-0 bg-ink/60"
            />
            <motion.div
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-xl sm:rounded-xl shadow-premium-xl p-5 sm:p-8 overflow-y-auto max-h-[90vh] border border-red-100 user-text-box"
            >
              <button
                onClick={() => !deleting && setDeleteTarget(null)}
                aria-label="Close"
                className="absolute top-4 right-4 w-11 h-11 rounded-full hover:bg-paper flex items-center justify-center text-ink-muted"
              >
                <X size={20} />
              </button>

              <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mb-4">
                <Trash2 className="text-red-500" size={22} />
              </div>
              <h3 className="text-xl font-bold text-ink pr-10">Delete this trip?</h3>
              <p className="text-sm text-ink-muted mt-2 leading-relaxed user-text">
                <span className="font-bold text-ink-soft">{deleteTarget.title}</span> will be removed permanently and
                <span className="font-bold"> /trip/{deleteTarget.slug}</span> will stop working. Its
                {' '}{(regStatsByTrip.get(deleteTarget.id)?.count) || 0} registration(s) are kept but will no longer point at a live trip.
              </p>

              <div className="mt-5 space-y-2 user-text-box">
                <label className={`${labelClass} block user-text`}>Type <span className="font-mono text-saffron-dark">{deleteTarget.slug}</span> to confirm</label>
                <input
                  type="text"
                  value={deleteText}
                  onChange={(e) => setDeleteText(e.target.value)}
                  placeholder={deleteTarget.slug}
                  className={`${inputClass} font-mono`}
                />
              </div>

              {deleteError && (
                <p className="mt-3 text-[11px] font-bold text-red-500 flex items-start gap-1.5 user-text-box">
                  <AlertTriangle size={12} className="shrink-0 mt-0.5" /> <span className="user-text">{deleteError}</span>
                </p>
              )}

              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <button
                  onClick={() => setDeleteTarget(null)}
                  disabled={deleting}
                  className="flex-1 min-h-[44px] rounded-2xl bg-paper-dark text-ink-muted text-xs font-bold uppercase tracking-label hover:bg-paper-dark transition-colors disabled:opacity-50"
                >
                  Keep it
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={deleting || deleteText.trim() !== (deleteTarget.slug || '')}
                  className="flex-1 min-h-[44px] rounded-2xl bg-red-500 text-white text-xs font-bold uppercase tracking-label hover:bg-red-600 transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  {deleting ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                  Delete Trip
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================= RECORD CASH (in-page, staff attestation) ================= */}
      <AnimatePresence>
        {cashTarget && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => !cashSaving && setCashTarget(null)}
              className="absolute inset-0 bg-ink/60"
            />
            <motion.div
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-xl sm:rounded-xl shadow-premium-xl p-5 sm:p-8 overflow-y-auto max-h-[90vh] border border-teal-100 user-text-box"
            >
              <button
                onClick={() => !cashSaving && setCashTarget(null)}
                aria-label="Close"
                className="absolute top-4 right-4 w-11 h-11 rounded-full hover:bg-paper flex items-center justify-center text-ink-muted"
              >
                <X size={20} />
              </button>

              <div className="w-12 h-12 bg-teal-50 rounded-2xl flex items-center justify-center mb-4">
                <Banknote className="text-teal-600" size={22} />
              </div>
              <h3 className="text-xl font-bold text-ink pr-10">Record cash received</h3>
              <p className="text-sm text-ink-muted mt-2 leading-relaxed user-text">
                Confirming that <span className="font-bold text-ink-soft">{cashTarget.userName || 'this devotee'}</span> handed
                over cash for <span className="font-bold text-ink-soft">{cashTarget.tripTitle || 'this trip'}</span>. This is
                your attestation as staff — it is what the Collected total and the CSV will report.
              </p>

              <div className="mt-5 space-y-2">
                <div className="flex items-baseline justify-between gap-2">
                  <label className={labelClass} htmlFor="cash-amount">Amount received (₹)</label>
                  <span className="text-[10px] text-ink-muted font-medium">due {formatINR(cashTarget.amountDue)}</span>
                </div>
                <input
                  id="cash-amount"
                  type="number"
                  min={0}
                  step="1"
                  inputMode="numeric"
                  value={cashDraft}
                  onChange={(e) => setCashDraft(e.target.value)}
                  className={inputClass}
                />
                {toNumber(cashDraft) > 0 && toNumber(cashDraft) !== toNumber(cashTarget.amountDue) && (
                  <p className="text-[11px] font-bold text-amber-600 ml-1 flex items-start gap-1.5">
                    <AlertTriangle size={12} className="shrink-0 mt-0.5" />
                    <span className="user-text">
                      That is {toNumber(cashDraft) < toNumber(cashTarget.amountDue) ? 'less' : 'more'} than
                      the {formatINR(cashTarget.amountDue)} due — a part payment is fine, just make sure it is what you counted.
                    </span>
                  </p>
                )}
              </div>

              {cashError && (
                <p className="mt-3 text-[11px] font-bold text-red-500 flex items-start gap-1.5">
                  <AlertTriangle size={12} className="shrink-0 mt-0.5" /> <span className="user-text">{cashError}</span>
                </p>
              )}

              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <button
                  onClick={() => setCashTarget(null)}
                  disabled={cashSaving}
                  className="flex-1 min-h-[44px] rounded-2xl bg-paper-dark text-ink-muted text-xs font-bold uppercase tracking-label hover:bg-paper-dark transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmRecordCash}
                  disabled={cashSaving || !(toNumber(cashDraft) > 0)}
                  className="flex-1 min-h-[44px] rounded-2xl bg-teal-600 text-white text-xs font-bold uppercase tracking-label hover:bg-teal-700 transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  {cashSaving ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                  Record {formatINR(toNumber(cashDraft))}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================= UNDO CASH (mis-tap recovery) ================= */}
      <AnimatePresence>
        {undoTarget && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => !cashSaving && setUndoTarget(null)}
              className="absolute inset-0 bg-ink/60"
            />
            <motion.div
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-xl sm:rounded-xl shadow-premium-xl p-5 sm:p-8 overflow-y-auto max-h-[90vh] border border-amber-100 user-text-box"
            >
              <button
                onClick={() => !cashSaving && setUndoTarget(null)}
                aria-label="Close"
                className="absolute top-4 right-4 w-11 h-11 rounded-full hover:bg-paper flex items-center justify-center text-ink-muted"
              >
                <X size={20} />
              </button>

              <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center mb-4">
                <Undo2 className="text-amber-600" size={22} />
              </div>
              <h3 className="text-xl font-bold text-ink pr-10">Undo this cash record?</h3>
              <p className="text-sm text-ink-muted mt-2 leading-relaxed user-text">
                <span className="font-bold text-ink-soft">{undoTarget.userName || 'This devotee'}</span> goes back to
                <span className="font-bold"> cash pending collection</span>, and
                the {formatINR(undoTarget.cashAmount ?? undoTarget.amountDue)} comes straight back out of the Collected total.
                Only do this if the money was never actually received.
              </p>

              {cashError && (
                <p className="mt-3 text-[11px] font-bold text-red-500 flex items-start gap-1.5">
                  <AlertTriangle size={12} className="shrink-0 mt-0.5" /> <span className="user-text">{cashError}</span>
                </p>
              )}

              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <button
                  onClick={() => setUndoTarget(null)}
                  disabled={cashSaving}
                  className="flex-1 min-h-[44px] rounded-2xl bg-paper-dark text-ink-muted text-xs font-bold uppercase tracking-label hover:bg-paper-dark transition-colors disabled:opacity-50"
                >
                  Keep it
                </button>
                <button
                  onClick={confirmUndoCash}
                  disabled={cashSaving}
                  className="flex-1 min-h-[44px] rounded-2xl bg-amber-500 text-white text-xs font-bold uppercase tracking-label hover:bg-amber-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {cashSaving ? <Loader2 size={15} className="animate-spin" /> : <Undo2 size={15} />}
                  Undo record
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default TripsAdmin
