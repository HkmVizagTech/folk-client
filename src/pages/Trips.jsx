import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MapPin, Calendar, Clock, Users, Bus, Ticket, ArrowRight, Search, Filter,
  Sparkles, Compass, Settings, X, Image as ImageIcon
} from 'lucide-react'
import { where } from 'firebase/firestore'
import { useFirestore } from '../hooks/useFirestore'
import { useAuth } from '../hooks/useAuth'

/* ------------------------------------------------------------------ *
 * Helpers — kept local to the page. Trips.jsx / TripDetail.jsx are the
 * only two files this feature owns, so a small duplication beats
 * adding a shared module.
 * ------------------------------------------------------------------ */

const todayISO = () => {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** 'YYYY-MM-DD' -> { y, m, d } without timezone drift. */
const parseISO = (iso) => {
  if (!iso || typeof iso !== 'string') return null
  const parts = iso.split('-')
  if (parts.length !== 3) return null
  const [y, m, d] = parts.map((p) => parseInt(p, 10))
  if (!y || !m || !d) return null
  return { y, m, d }
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

const STATUS_STYLES = {
  upcoming: 'bg-saffron text-white',
  ongoing: 'bg-emerald-500 text-white',
  completed: 'bg-gray-900/80 text-white',
  cancelled: 'bg-red-500 text-white',
  draft: 'bg-gray-500 text-white',
}

const statusLabel = (status) => {
  switch ((status || '').toLowerCase()) {
    case 'ongoing': return 'Happening now'
    case 'completed': return 'Completed'
    case 'cancelled': return 'Cancelled'
    case 'draft': return 'Draft'
    default: return 'Upcoming'
  }
}

/** Deterministic, brand-harmonised gradient for trips with no cover image. */
const FALLBACK_GRADIENTS = [
  'from-saffron via-saffron-dark to-gold-dark',
  'from-emerald-500 via-teal-600 to-cyan-700',
  'from-indigo-500 via-violet-600 to-purple-700',
  'from-rose-500 via-red-500 to-orange-600',
  'from-amber-500 via-orange-500 to-saffron-dark',
  'from-sky-500 via-blue-600 to-indigo-700',
]

const gradientFor = (key = '') => {
  let hash = 0
  for (let i = 0; i < key.length; i += 1) hash = (hash * 31 + key.charCodeAt(i)) % 9973
  return FALLBACK_GRADIENTS[hash % FALLBACK_GRADIENTS.length]
}

/** A trip is "past" when it is marked completed, or its end date has gone by. */
const isCompletedTrip = (trip, today) => {
  const s = (trip.status || '').toLowerCase()
  if (s === 'completed') return true
  if (s === 'cancelled') return false
  return !!trip.endDate && trip.endDate < today
}

/* ------------------------------------------------------------------ *
 * Minimal top bar — only for logged-out visitors landing on /trips
 * directly, where the app shell (navbar) is not mounted.
 * ------------------------------------------------------------------ */
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
          className="min-h-[44px] px-5 sm:px-7 rounded-full bg-gray-900 text-white text-sm font-bold hover:bg-saffron transition-colors whitespace-nowrap"
        >
          Sign in
        </button>
      </div>
    </div>
  </header>
)

/* ------------------------------------------------------------------ */

const TripCard = ({ trip, seatsLeft, onOpen, index }) => {
  const status = (trip.status || 'upcoming').toLowerCase()
  const open = () => onOpen(trip.slug)

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ delay: Math.min(index * 0.05, 0.3) }}
      role="button"
      tabIndex={0}
      aria-label={`${trip.title || 'Trip'} — view details`}
      onClick={open}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          open()
        }
      }}
      className="group cursor-pointer h-full flex flex-col bg-white rounded-xl sm:rounded-xl overflow-hidden shadow-premium hover:shadow-premium-xl border border-saffron/5 transition-all duration-300 hover:-translate-y-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-saffron focus-visible:ring-offset-2"
    >
      {/* Cover */}
      <div className="relative h-40 xs:h-44 sm:h-48 overflow-hidden">
        {trip.coverImage ? (
          <img
            src={trip.coverImage}
            alt={trip.title || 'Trip cover'}
            loading="lazy"
            className="w-full max-w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.07]"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${gradientFor(trip.slug || trip.id)} relative flex items-center justify-center`}>
            <div className="absolute inset-0 opacity-25 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.55),transparent_55%)]" aria-hidden="true" />
            <Compass size={44} className="text-white/70 relative z-10" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" aria-hidden="true" />

        <div className="absolute top-4 left-4 right-4 flex flex-wrap gap-2">
          <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-[0.14em] shadow-lg ${STATUS_STYLES[status] || STATUS_STYLES.upcoming}`}>
            {statusLabel(status)}
          </span>
          {trip.registrationOpen === false && status !== 'completed' && status !== 'cancelled' && (
            <span className="px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-[0.14em] bg-white text-gray-700 shadow-lg">
              Registration closed
            </span>
          )}
        </div>

        <div className="absolute bottom-3.5 left-4 right-4 user-text-box">
          <span className="text-[10px] sm:text-[11px] font-black text-white uppercase tracking-[0.12em] drop-shadow flex items-center gap-1.5 min-w-0">
            <Calendar size={13} className="text-gold shrink-0" />
            <span className="truncate min-w-0">{formatDateRange(trip.startDate, trip.endDate)}</span>
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 xs:p-5 sm:p-6 flex-1 flex flex-col gap-3 user-text-box">
        <div className="user-text-box">
          <h3 className="text-[15px] xs:text-base sm:text-lg font-black text-gray-900 tracking-tight leading-snug line-clamp-2 user-text">
            {trip.title || 'Untitled trip'}
          </h3>
          {trip.subtitle && (
            <p className="text-xs text-gray-400 font-semibold mt-1 line-clamp-2 user-text">{trip.subtitle}</p>
          )}
        </div>

        <div className="flex flex-wrap gap-2 text-[10px] font-black text-gray-500 user-text-box">
          {trip.location && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cream/70 border border-saffron/10 max-w-full min-w-0">
              <MapPin size={12} className="text-saffron shrink-0" />
              <span className="truncate min-w-0">{trip.location}</span>
            </span>
          )}
          {trip.durationLabel && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cream/70 border border-saffron/10 max-w-full min-w-0">
              <Clock size={12} className="text-saffron shrink-0" />
              <span className="truncate min-w-0">{trip.durationLabel}</span>
            </span>
          )}
        </div>

        <div className="mt-auto pt-4 border-t border-gray-100 flex items-end justify-between gap-3 user-text-box">
          <div className="min-w-0">
            {Number(trip.price) > 0 ? (
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <p className="text-lg sm:text-xl font-black text-gray-900 tracking-tight leading-none">{inr(trip.price)}</p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.12em]">/ person</p>
              </div>
            ) : (
              <p className="text-sm font-black text-emerald-600 uppercase tracking-tight">Free / by seva</p>
            )}
            {typeof seatsLeft === 'number' ? (
              <p className={`mt-2 text-[10px] font-black uppercase tracking-[0.12em] inline-flex items-center gap-1.5 px-2 py-1 rounded-lg ${
                seatsLeft === 0
                  ? 'text-red-600 bg-red-50'
                  : seatsLeft <= 5
                    ? 'text-amber-700 bg-amber-50'
                    : 'text-emerald-700 bg-emerald-50'
              }`}>
                <Users size={11} className="shrink-0" />
                {seatsLeft === 0 ? 'Fully booked' : `${seatsLeft} seat${seatsLeft === 1 ? '' : 's'} left`}
              </p>
            ) : (
              <p className="mt-2 text-[10px] font-black uppercase tracking-[0.12em] text-gray-400 inline-flex items-center gap-1.5">
                <Users size={11} className="shrink-0" /> Open seating
              </p>
            )}
          </div>
          <span className="shrink-0 w-11 h-11 rounded-2xl bg-gray-900 text-white flex items-center justify-center group-hover:bg-saffron transition-colors">
            <ArrowRight size={18} />
          </span>
        </div>
      </div>
    </motion.article>
  )
}

/* ------------------------------------------------------------------ */

const EmptyState = ({ icon, title, body, action }) => (
  <div className="py-14 sm:py-20 px-5 sm:px-6 text-center bg-white rounded-xl sm:rounded-xl border border-dashed border-saffron/25 user-text-box">
    <div className="relative w-16 h-16 mx-auto mb-5">
      <span className="absolute inset-0 rounded-3xl bg-saffron/10 blur-xl" aria-hidden="true" />
      <span className="relative w-16 h-16 rounded-3xl bg-saffron text-saffron flex items-center justify-center ring-1 ring-saffron/15">
        {icon}
      </span>
    </div>
    <h3 className="text-[15px] sm:text-base font-black text-gray-800 tracking-tight user-text">{title}</h3>
    <p className="text-[13px] sm:text-sm text-gray-400 font-medium mt-2 max-w-sm mx-auto leading-relaxed user-text">{body}</p>
    {action}
  </div>
)

/** Card-shaped placeholder — reads as the grid filling in, not as a stall. */
const TripCardSkeleton = ({ index = 0 }) => (
  <div
    className="h-full flex flex-col bg-white rounded-xl sm:rounded-xl overflow-hidden shadow-premium border border-saffron/5 animate-pulse"
    style={{ animationDelay: `${index * 90}ms` }}
    aria-hidden="true"
  >
    <div className="h-40 xs:h-44 sm:h-48 bg-gradient-to-br from-cream-dark/70 to-cream" />
    <div className="p-4 xs:p-5 sm:p-6 flex-1 flex flex-col gap-3">
      <div className="h-4 w-4/5 rounded-full bg-cream-dark/70" />
      <div className="h-3 w-3/5 rounded-full bg-cream-dark/50" />
      <div className="flex gap-2 pt-1">
        <div className="h-6 w-24 rounded-lg bg-cream-dark/50" />
        <div className="h-6 w-16 rounded-lg bg-cream-dark/40" />
      </div>
      <div className="mt-auto pt-4 border-t border-gray-100 flex items-end justify-between gap-3">
        <div className="space-y-2">
          <div className="h-5 w-20 rounded-full bg-cream-dark/70" />
          <div className="h-3 w-16 rounded-full bg-cream-dark/40" />
        </div>
        <div className="w-11 h-11 rounded-2xl bg-cream-dark/60" />
      </div>
    </div>
  </div>
)

/* ------------------------------------------------------------------ */

const Trips = ({ openTrip, setActiveTab, onLoginClick, isPublicView = false }) => {
  const { user } = useAuth()
  const isStaff = user?.role === 'admin' || user?.role === 'folks_head'

  const tripsQuery = React.useMemo(() => [], [])
  const { data: trips, loading } = useFirestore('trips', tripsQuery)

  // Role-aware registrations query, mirroring Hostels.jsx: staff read every
  // registration (so seat counts are exact for them), everyone else is scoped
  // to their own. Public visitors read none and simply see full capacity.
  const registrationsQuery = React.useMemo(() => {
    if (isStaff) return []
    return [where('userId', '==', user?.uid || 'guest')]
  }, [isStaff, user?.uid])
  const { data: registrations } = useFirestore('trip_registrations', registrationsQuery)

  const [tab, setTab] = useState('upcoming')
  const [search, setSearch] = useState('')
  const [locationFilter, setLocationFilter] = useState('all')

  const today = React.useMemo(() => todayISO(), [])

  // Drafts are staff-only.
  const visibleTrips = React.useMemo(
    () => (trips || []).filter((t) => isStaff || (t.status || '').toLowerCase() !== 'draft'),
    [trips, isStaff]
  )

  const seatsTakenByTrip = React.useMemo(() => {
    const map = {}
    ;(registrations || []).forEach((r) => {
      const s = (r.status || '').toLowerCase()
      if (s !== 'pending' && s !== 'confirmed') return
      map[r.tripId] = (map[r.tripId] || 0) + (parseInt(r.seats, 10) || 1)
    })
    return map
  }, [registrations])

  const { upcoming, completed } = React.useMemo(() => {
    const up = []
    const done = []
    visibleTrips.forEach((t) => (isCompletedTrip(t, today) ? done : up).push(t))
    up.sort((a, b) => (a.startDate || '9999-99-99').localeCompare(b.startDate || '9999-99-99'))
    done.sort((a, b) => (b.endDate || '').localeCompare(a.endDate || ''))
    return { upcoming: up, completed: done }
  }, [visibleTrips, today])

  const locations = React.useMemo(() => {
    const set = new Set()
    visibleTrips.forEach((t) => {
      if (t.location) set.add(t.location)
    })
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [visibleTrips])

  const showFilters = visibleTrips.length > 6
  const activeList = tab === 'upcoming' ? upcoming : completed

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    return activeList.filter((t) => {
      if (showFilters && locationFilter !== 'all' && t.location !== locationFilter) return false
      if (!q) return true
      return [t.title, t.subtitle, t.location, t.durationLabel]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    })
  }, [activeList, search, locationFilter, showFilters])

  const seatsLeftFor = (trip) => {
    const capacity = parseInt(trip.capacity, 10)
    if (!capacity || capacity <= 0) return null
    return Math.max(0, capacity - (seatsTakenByTrip[trip.id] || 0))
  }

  const isFiltering = !!search.trim() || (showFilters && locationFilter !== 'all')

  const content = (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 sm:space-y-10 pb-12">
      {/* ---------------- Hero header ---------------- */}
      <section className="relative overflow-hidden rounded-xl sm:rounded-xl bg-[#0B0A09] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_15%,rgba(255,153,51,0.35),transparent_58%),radial-gradient(circle_at_88%_85%,rgba(255,215,0,0.2),transparent_55%)]" aria-hidden="true" />

        <div className="relative z-10 px-5 sm:px-10 lg:px-14 py-9 sm:py-14 lg:py-16">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-7 sm:gap-8">
            <div className="max-w-2xl min-w-0">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-[10px] font-bold uppercase tracking-label text-white/85">
                <span className="w-2 h-2 rounded-full bg-saffron shadow-[0_0_12px_3px_rgba(255,153,51,0.7)]" />
                Trips &amp; Yatras
              </span>

              <h1
                className="mt-6 font-black tracking-[-0.03em] leading-[0.95]"
                style={{ fontSize: 'clamp(2.1rem, 6vw, 3.75rem)' }}
              >
                Journey to the <span className="text-saffron">holy places</span>
              </h1>

              <p className="mt-4 sm:mt-5 text-white/65 leading-[1.7] max-w-xl text-[14px] sm:text-base">
                Pilgrimages, weekend yatras and heritage trails with the FOLK crew — travel,
                stay, prasadam and kirtan taken care of. Pick a journey, reserve your seat.
              </p>

              <div className="mt-7 sm:mt-8 grid grid-cols-3 gap-3 sm:gap-0 sm:flex sm:flex-wrap sm:items-center sm:gap-x-8 sm:gap-y-4 max-w-md sm:max-w-none">
                <div className="min-w-0">
                  <p className="text-xl sm:text-2xl font-black tracking-tight">{upcoming.length}</p>
                  <p className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-[0.12em] sm:tracking-[0.14em] text-white/45 mt-0.5">Upcoming</p>
                </div>
                <div className="min-w-0 pl-3 border-l border-white/15 sm:pl-8">
                  <p className="text-xl sm:text-2xl font-black tracking-tight">{completed.length}</p>
                  <p className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-[0.12em] sm:tracking-[0.14em] text-white/45 mt-0.5">Completed</p>
                </div>
                <div className="min-w-0 pl-3 border-l border-white/15 sm:pl-8">
                  <p className="text-xl sm:text-2xl font-black tracking-tight">{locations.length || '—'}</p>
                  <p className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-[0.12em] sm:tracking-[0.14em] text-white/45 mt-0.5">Destinations</p>
                </div>
              </div>
            </div>

            {isStaff && (
              <button
                type="button"
                onClick={() => setActiveTab && setActiveTab('trips-admin')}
                className="shrink-0 min-h-[48px] px-7 rounded-2xl bg-white text-gray-900 font-black text-[11px] uppercase tracking-label hover:bg-saffron hover:text-white transition-colors inline-flex items-center justify-center gap-2 shadow-xl"
              >
                <Settings size={16} /> Manage Trips
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ---------------- Tabs + filters ---------------- */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 p-1.5 bg-white rounded-2xl shadow-premium border border-saffron/5 w-full sm:w-fit overflow-x-auto scrollbar-hide">
          {[
            { id: 'upcoming', label: 'Upcoming', count: upcoming.length },
            { id: 'completed', label: 'Completed', count: completed.length },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              aria-pressed={tab === t.id}
              className={`relative flex-1 sm:flex-none min-h-[44px] px-5 sm:px-7 rounded-xl text-[11px] font-black uppercase tracking-[0.14em] whitespace-nowrap transition-colors inline-flex items-center justify-center gap-2 ${
                tab === t.id ? 'text-white' : 'text-gray-400 hover:text-gray-700'
              }`}
            >
              {tab === t.id && (
                <motion.span
                  layoutId="tripsTabPill"
                  className="absolute inset-0 rounded-xl bg-saffron shadow-lg"
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                />
              )}
              <span className="relative z-10">{t.label}</span>
              <span
                className={`relative z-10 px-2 py-0.5 rounded-md text-[9px] font-black ${
                  tab === t.id ? 'bg-white/25 text-white' : 'bg-gray-100 text-gray-500'
                }`}
              >
                {t.count}
              </span>
            </button>
          ))}
        </div>

        {showFilters && (
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search trips, destinations…"
                aria-label="Search trips"
                className="w-full min-h-[48px] pl-11 pr-12 py-3 bg-white border border-saffron/10 rounded-2xl outline-none focus:border-saffron/40 transition-all font-medium text-sm shadow-sm"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  aria-label="Clear search"
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-xl text-gray-400 hover:bg-gray-100 flex items-center justify-center"
                >
                  <X size={16} />
                </button>
              )}
            </div>
            <div className="relative sm:w-64">
              <Filter size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                aria-label="Filter by destination"
                className="w-full min-h-[48px] pl-11 pr-4 py-3 bg-white border border-saffron/10 rounded-2xl outline-none focus:border-saffron/40 transition-all font-semibold text-sm text-gray-600 shadow-sm appearance-none cursor-pointer"
              >
                <option value="all">All destinations</option>
                {locations.map((loc) => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* ---------------- Grid ---------------- */}
      {loading && (trips || []).length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {[0, 1, 2, 3, 4, 5].map((i) => <TripCardSkeleton key={i} index={i} />)}
          <span className="sr-only" role="status">Loading trips…</span>
        </div>
      ) : filtered.length === 0 ? (
        isFiltering ? (
          <EmptyState
            icon={<Search size={26} />}
            title="No trips match your search"
            body="Try a different destination, or clear the filters to see everything on offer."
            action={(
              <button
                type="button"
                onClick={() => { setSearch(''); setLocationFilter('all') }}
                className="mt-6 min-h-[44px] px-6 rounded-2xl bg-gray-900 text-white font-black uppercase tracking-label text-[10px] hover:bg-saffron transition-colors inline-flex items-center justify-center gap-2"
              >
                <X size={14} /> Clear filters
              </button>
            )}
          />
        ) : tab === 'upcoming' ? (
          <EmptyState
            icon={<Bus size={26} />}
            title="No yatras announced yet"
            body="The next pilgrimage is being planned. Check back soon — the crew announces dates here first."
            action={completed.length > 0 ? (
              <button
                type="button"
                onClick={() => setTab('completed')}
                className="mt-6 min-h-[44px] px-6 rounded-2xl bg-gray-900 text-white font-black uppercase tracking-label text-[10px] hover:bg-saffron transition-colors inline-flex items-center justify-center gap-2"
              >
                Look back at past yatras <ArrowRight size={14} />
              </button>
            ) : null}
          />
        ) : (
          <EmptyState
            icon={<ImageIcon size={26} />}
            title="No completed trips yet"
            body="Once a yatra wraps up it moves here, so you can look back at where the crew has been."
            action={upcoming.length > 0 ? (
              <button
                type="button"
                onClick={() => setTab('upcoming')}
                className="mt-6 min-h-[44px] px-6 rounded-2xl bg-gray-900 text-white font-black uppercase tracking-label text-[10px] hover:bg-saffron transition-colors inline-flex items-center justify-center gap-2"
              >
                See what&apos;s coming up <ArrowRight size={14} />
              </button>
            ) : null}
          />
        )
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          <AnimatePresence mode="popLayout">
            {filtered.map((trip, i) => (
              <TripCard
                key={trip.id}
                trip={trip}
                index={i}
                seatsLeft={tab === 'upcoming' ? seatsLeftFor(trip) : null}
                onOpen={(slug) => openTrip && openTrip(slug)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* ---------------- Custom yatra CTA ---------------- */}
      <section className="relative overflow-hidden rounded-xl sm:rounded-xl bg-white shadow-premium border border-saffron/10">
        <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-saffron/10 hidden" aria-hidden="true" />
        <div className="relative z-10 p-5 sm:p-10 flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-6 justify-between">
          <div className="flex items-start sm:items-center gap-4 min-w-0">
            <div className="w-12 h-12 shrink-0 rounded-2xl bg-saffron text-white flex items-center justify-center shadow-lg">
              <Sparkles size={22} />
            </div>
            <div className="min-w-0">
              <h3 className="font-black text-gray-900 tracking-tight text-[15px] sm:text-lg">Group rates &amp; custom yatras</h3>
              <p className="text-[13px] sm:text-sm text-gray-500 font-medium mt-1 leading-relaxed">
                Families, colleges and offices — we plan the route, stay and prasadam for you.
              </p>
            </div>
          </div>
          <a
            href="https://wa.me/919154881444"
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 inline-flex items-center justify-center gap-2 min-h-[48px] px-7 rounded-2xl bg-gray-900 text-white font-black uppercase tracking-label text-[10px] hover:bg-saffron transition-colors"
          >
            <Ticket size={15} /> Plan with us
          </a>
        </div>
      </section>
    </motion.div>
  )

  if (isPublicView) {
    return (
      <div className="min-h-screen bg-cream">
        <PublicTopBar onLoginClick={onLoginClick} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">{content}</div>
      </div>
    )
  }

  return content
}

export default Trips
