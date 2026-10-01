import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MapPin, Calendar, Clock, Users, Bus, Ticket, ArrowRight, ArrowUpRight, Search,
  Filter, Sparkles, Compass, Settings, X, Image as ImageIcon
} from 'lucide-react'
import { where } from '../lib/pgstore'
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
  upcoming: 'bg-[#FF9933] text-white',
  ongoing: 'bg-emerald-500 text-white',
  completed: 'bg-[#0B0A09]/85 text-white backdrop-blur-sm',
  cancelled: 'bg-red-500 text-white',
  draft: 'bg-gray-700 text-white',
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

/**
 * The places a yatra visits. Staff edit these in TripsAdmin; everything here
 * treats the field as untrusted — a half-filled row (no name, or no photo)
 * must still render, and a trip with none at all simply has no places to show.
 */
const normaliseLocations = (value) => {
  if (!Array.isArray(value)) return []
  return value
    .filter((l) => l && typeof l === 'object')
    .map((l, i) => ({
      id: typeof l.id === 'string' && l.id ? l.id : `loc-${i}`,
      name: typeof l.name === 'string' ? l.name.trim() : '',
      description: typeof l.description === 'string' ? l.description.trim() : '',
      image: typeof l.image === 'string' && l.image.trim() ? l.image.trim() : '',
    }))
    // A row with neither a name nor a photo has nothing to say.
    .filter((l) => l.name || l.image)
}

/** Deterministic, brand-harmonised surface for anything with no photograph. */
const SURFACES = [
  'folk-yatra-surface-1',
  'folk-yatra-surface-2',
  'folk-yatra-surface-3',
  'folk-yatra-surface-4',
  'folk-yatra-surface-5',
  'folk-yatra-surface-6',
]

const surfaceFor = (key = '') => {
  let hash = 0
  for (let i = 0; i < String(key).length; i += 1) {
    hash = (hash * 31 + String(key).charCodeAt(i)) % 9973
  }
  return SURFACES[hash % SURFACES.length]
}

/** A trip is "past" when it is marked completed, or its end date has gone by. */
const isCompletedTrip = (trip, today) => {
  const s = (trip.status || '').toLowerCase()
  if (s === 'completed') return true
  if (s === 'cancelled') return false
  return !!trip.endDate && trip.endDate < today
}

/* ------------------------------------------------------------------ *
 * Scoped styles.
 *
 * Same approach as Landing.jsx: everything the page needs that Tailwind
 * cannot express inline lives here, so no shared file has to change.
 * Photographs now arrive from the R2 CDN rather than being inlined in the
 * document, so the shimmer below is doing real work — it is what the
 * reserved aspect-ratio box shows while the bytes are still in flight.
 * ------------------------------------------------------------------ */
const TRIPS_STYLES = `
.folk-yatra-grain {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)' opacity='0.55'/%3E%3C/svg%3E");
  background-size: 160px 160px;
}
.folk-yatra-mandala {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Cg fill='none' stroke='%23FFB566' stroke-width='0.8'%3E%3Ccircle cx='100' cy='100' r='30'/%3E%3Ccircle cx='100' cy='100' r='52'/%3E%3Ccircle cx='100' cy='100' r='74'/%3E%3Cg%3E%3Cellipse cx='100' cy='58' rx='13' ry='30'/%3E%3Cellipse cx='100' cy='142' rx='13' ry='30'/%3E%3Cellipse cx='58' cy='100' rx='30' ry='13'/%3E%3Cellipse cx='142' cy='100' rx='30' ry='13'/%3E%3Cellipse cx='70' cy='70' rx='11' ry='26' transform='rotate(45 70 70)'/%3E%3Cellipse cx='130' cy='130' rx='11' ry='26' transform='rotate(45 130 130)'/%3E%3Cellipse cx='130' cy='70' rx='26' ry='11' transform='rotate(45 130 70)'/%3E%3Cellipse cx='70' cy='130' rx='26' ry='11' transform='rotate(45 70 130)'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
  background-size: 420px 420px;
  background-position: center;
  background-repeat: repeat;
}

/* Warm surfaces that stand in for a missing photograph. */
.folk-yatra-surface-1 { background: radial-gradient(120% 100% at 20% 15%, #FFC36B 0%, #F08A2A 38%, #B4530F 72%, #5E2A06 100%); }
.folk-yatra-surface-2 { background: radial-gradient(120% 100% at 78% 20%, #FFD98A 0%, #E8A12C 40%, #9A5B12 75%, #47250A 100%); }
.folk-yatra-surface-3 { background: radial-gradient(120% 100% at 30% 80%, #FF9F6B 0%, #D8542F 42%, #83220F 78%, #3A0F08 100%); }
.folk-yatra-surface-4 { background: radial-gradient(120% 100% at 70% 25%, #9FD6E8 0%, #3F7FA6 42%, #1C3E5C 78%, #0C1C2B 100%); }
.folk-yatra-surface-5 { background: radial-gradient(120% 100% at 25% 25%, #CDE8A8 0%, #6FA24B 42%, #33571F 78%, #16260D 100%); }
.folk-yatra-surface-6 { background: radial-gradient(120% 100% at 75% 75%, #E9C3F2 0%, #9A62B8 42%, #4C2A66 78%, #20102C 100%); }

/* Loading sweep for an image box whose bytes have not arrived yet. */
.folk-yatra-shimmer::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.42) 50%, rgba(255,255,255,0) 100%);
  transform: translateX(-100%);
  animation: folk-yatra-sweep 1.7s ease-in-out infinite;
}
@keyframes folk-yatra-sweep { to { transform: translateX(100%); } }

.folk-yatra-stroke {
  color: transparent;
  -webkit-text-stroke: 1.2px rgba(255,255,255,0.9);
  paint-order: stroke fill;
}
@media (min-width: 768px) {
  .folk-yatra-stroke { -webkit-text-stroke-width: 2px; }
}
@supports not ((-webkit-text-stroke: 1px #000)) {
  .folk-yatra-stroke { color: rgba(255,255,255,0.9); }
}

@media (prefers-reduced-motion: reduce) {
  .folk-yatra-shimmer::after { animation: none; }
}
`

/* ------------------------------------------------------------------ *
 * Photo — one image box used everywhere on this page.
 *
 * Images used to be base64 inlined in the trip document, so they were simply
 * *there* on first paint. They now come from R2, which means every one of
 * them is an async fetch. Three things follow, and this component owns all
 * three: the caller always gives the box a fixed aspect ratio (so nothing
 * reflows when the bytes land), the <img> is lazy and fades in, and until it
 * lands the reader sees a warm surface rather than a hole.
 *
 * The same component is the no-image state: `src` may legitimately be empty
 * (a location staff have not photographed yet), and a broken/404 URL falls
 * back to exactly the same surface via onError. Nothing here branches on
 * data: vs https: — both are valid <img src> values and are passed straight
 * through.
 * ------------------------------------------------------------------ */
const Photo = ({
  src,
  alt = '',
  tone = 'folk-yatra-surface-1',
  icon = null,
  className = '',
  imgClassName = '',
  eager = false,
  children = null,
}) => {
  const imgRef = useRef(null)
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)

  // Reset when the source changes. The `complete` check matters for an image
  // the browser already has cached: that fires `load` before React attaches
  // the handler, which would otherwise leave the picture stuck at opacity-0.
  useEffect(() => {
    setFailed(false)
    const node = imgRef.current
    setLoaded(!!(node && node.complete && node.naturalWidth > 0))
  }, [src])

  const hasImage = !!src && !failed

  return (
    <div className={`relative overflow-hidden bg-[#F6EADA] ${className}`}>
      {(!hasImage || !loaded) && (
        <div className={`absolute inset-0 ${tone}`} aria-hidden="true">
          <div className="absolute inset-0 folk-yatra-mandala opacity-[0.16] mix-blend-soft-light" />
          {hasImage ? (
            <div className="absolute inset-0 folk-yatra-shimmer" />
          ) : icon ? (
            <div className="absolute inset-0 flex items-center justify-center text-white/45">{icon}</div>
          ) : null}
        </div>
      )}

      {hasImage && (
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={`absolute inset-0 w-full max-w-full h-full object-cover transition-[opacity,transform] duration-700 ease-out ${loaded ? 'opacity-100' : 'opacity-0'} ${imgClassName}`}
        />
      )}

      {children}
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * ScrollRow — a horizontally scrolling strip that SAYS it scrolls.
 *
 * `overflow-x-auto scrollbar-hide` scrolls correctly but removes every hint
 * that it does, so a clipped strip reads as a broken layout. This wraps the
 * scroller and fades whichever edge still has content behind it, with a
 * chevron on the trailing edge. Both fades are driven by the real scroll
 * position, so nothing is drawn when the strip fits and nothing scrolls.
 * ------------------------------------------------------------------ */
const ScrollRow = ({
  children,
  className = '',
  outerClassName = '',
  fadeClass = 'from-white',
  fadeEdgeClass = '',
  chevronClass = 'text-gray-400',
}) => {
  const ref = useRef(null)
  const [edge, setEdge] = useState({ start: false, end: false })

  const measure = React.useCallback(() => {
    const el = ref.current
    if (!el) return
    const max = el.scrollWidth - el.clientWidth
    setEdge({ start: el.scrollLeft > 4, end: max > 4 && el.scrollLeft < max - 4 })
  }, [])

  useEffect(() => {
    measure()
    const el = ref.current
    if (!el || typeof ResizeObserver === 'undefined') return undefined
    // Watch the scroller AND its children: the strip's content arrives with
    // the data, long after first paint.
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
        className={`pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r ${fadeClass} to-transparent transition-opacity duration-200 ${fadeEdgeClass} ${edge.start ? 'opacity-100' : 'opacity-0'}`}
      />
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l ${fadeClass} to-transparent flex items-center justify-end pr-1 transition-opacity duration-200 ${fadeEdgeClass} ${edge.end ? 'opacity-100' : 'opacity-0'}`}
      >
        <ArrowRight size={13} className={chevronClass} />
      </span>
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * Minimal top bar — only for logged-out visitors landing on /trips
 * directly, where the app shell (navbar) is not mounted.
 * ------------------------------------------------------------------ */
const PublicTopBar = ({ onLoginClick }) => (
  <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-xl border-b border-orange-100/70">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="h-16 sm:h-[70px] flex items-center justify-between gap-3">
        <a href="/" className="min-w-0 flex items-center shrink-0" aria-label="FOLK Vizag — home">
          <img src="/folk_logo_blue.png" alt="Folk Vizag logo" className="h-12 sm:h-14 w-auto max-w-full object-contain shrink-0" />
        </a>
        <button
          type="button"
          onClick={() => onLoginClick && onLoginClick()}
          className="min-h-[44px] px-5 sm:px-7 rounded-full bg-gray-900 text-white text-sm font-bold hover:bg-[#FF9933] transition-colors whitespace-nowrap"
        >
          Sign in
        </button>
      </div>
    </div>
  </header>
)

/* ------------------------------------------------------------------ *
 * The places a yatra visits, as a card-sized signal.
 *
 * This is what actually sells a pilgrimage, so it gets real estate on the
 * card rather than being buried on the detail page: a short stack of the
 * place photographs, the count, and the route itself as a line of names.
 * ------------------------------------------------------------------ */
const LocationStrip = ({ locations }) => {
  if (locations.length === 0) return null

  const withPhotos = locations.filter((l) => l.image).slice(0, 3)
  const remaining = locations.length - withPhotos.length
  const names = locations.map((l) => l.name).filter(Boolean).join(' · ')

  return (
    <div className="flex items-center gap-3 min-w-0 user-text-box">
      {withPhotos.length > 0 && (
        <div className="flex -space-x-2.5 shrink-0" aria-hidden="true">
          {withPhotos.map((loc) => (
            <Photo
              key={loc.id}
              src={loc.image}
              tone={surfaceFor(loc.name || loc.id)}
              className="w-9 h-9 rounded-xl ring-2 ring-white shadow-sm"
            />
          ))}
          {remaining > 0 && (
            <span className="w-9 h-9 shrink-0 rounded-xl ring-2 ring-white bg-[#0B0A09] text-white text-[9px] font-black flex items-center justify-center shadow-sm">
              +{remaining}
            </span>
          )}
        </div>
      )}

      <div className="min-w-0">
        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#E67E22] flex items-center gap-1.5">
          {withPhotos.length === 0 && <MapPin size={11} className="shrink-0" />}
          Visits {locations.length} place{locations.length === 1 ? '' : 's'}
        </p>
        {names && (
          <p className="mt-0.5 text-[11px] font-semibold text-gray-500 truncate user-text">{names}</p>
        )}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */

const TripCard = ({ trip, seatsLeft, onOpen, index }) => {
  const status = (trip.status || 'upcoming').toLowerCase()
  const locations = React.useMemo(() => normaliseLocations(trip.locations), [trip.locations])
  const href = trip.slug ? `/trip/${encodeURIComponent(trip.slug)}` : undefined

  // A real <a href> so the card can be copied, opened in a new tab and
  // crawled - these pages exist to be shared on WhatsApp. We only hijack the
  // plain left-click to keep SPA navigation; every modified click (ctrl/cmd
  // for a new tab, middle-click, shift) is left to the browser.
  const handleLinkClick = (e) => {
    if (e.defaultPrevented) return
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return
    e.preventDefault()
    onOpen(trip.slug)
  }

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ delay: Math.min(index * 0.05, 0.3), duration: 0.45, ease: 'easeOut' }}
      className="group relative cursor-pointer h-full flex flex-col bg-white rounded-[1.5rem] sm:rounded-[1.75rem] overflow-hidden shadow-premium hover:shadow-premium-2xl border border-orange-50 transition-all duration-300 hover:-translate-y-1.5 focus-within:ring-2 focus-within:ring-[#FF9933] focus-within:ring-offset-2"
    >
      {/* Cover — a fixed ratio box, so the grid never reflows as covers land */}
      <Photo
        src={trip.coverImage}
        alt={trip.title ? `${trip.title} cover` : 'Trip cover'}
        tone={surfaceFor(trip.slug || trip.id)}
        icon={<Compass size={42} strokeWidth={1.5} />}
        className="aspect-[16/10] w-full"
        imgClassName="group-hover:scale-[1.06]"
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" aria-hidden="true" />
        <div className="absolute inset-0 folk-yatra-grain opacity-[0.16] mix-blend-overlay" aria-hidden="true" />

        <div className="absolute top-3.5 left-3.5 right-3.5 flex flex-wrap gap-2">
          <span className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.14em] shadow-lg ${STATUS_STYLES[status] || STATUS_STYLES.upcoming}`}>
            {statusLabel(status)}
          </span>
          {trip.registrationOpen === false && status !== 'completed' && status !== 'cancelled' && (
            <span className="px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.14em] bg-white text-gray-700 shadow-lg">
              Registration closed
            </span>
          )}
        </div>

        <div className="absolute bottom-3.5 left-4 right-4 user-text-box">
          <span className="text-[10px] sm:text-[11px] font-black text-white uppercase tracking-[0.12em] drop-shadow flex items-center gap-1.5 min-w-0">
            <Calendar size={13} className="text-[#FFC97A] shrink-0" />
            <span className="truncate min-w-0">{formatDateRange(trip.startDate, trip.endDate)}</span>
          </span>
        </div>
      </Photo>

      {/* Body */}
      <div className="p-4 xs:p-5 sm:p-6 flex-1 flex flex-col gap-3.5 user-text-box">
        <div className="user-text-box">
          <h3 className="text-lg sm:text-xl font-black text-gray-900 tracking-tight leading-snug line-clamp-2 group-hover:text-[#E67E22] transition-colors user-text">
            <a
              href={href}
              onClick={handleLinkClick}
              className="outline-none after:absolute after:inset-0 after:content-[''] after:rounded-[1.5rem] sm:after:rounded-[1.75rem]"
            >
              {trip.title || 'Untitled trip'}
            </a>
          </h3>
          {trip.subtitle && (
            <p className="text-[12.5px] text-gray-500 font-medium mt-1.5 leading-relaxed line-clamp-2 user-text">{trip.subtitle}</p>
          )}
        </div>

        {/* The route — the single most persuasive thing on the card */}
        {locations.length > 0 && (
          <div className="pt-0.5">
            <LocationStrip locations={locations} />
          </div>
        )}

        {(trip.location || trip.durationLabel) && (
          <div className="flex flex-wrap gap-2 text-[11px] font-bold text-gray-500 user-text-box">
            {trip.location && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#FDF9F1] border border-orange-100/80 max-w-full min-w-0">
                <MapPin size={12} className="text-[#FF9933] shrink-0" />
                <span className="truncate min-w-0 user-text">{trip.location}</span>
              </span>
            )}
            {trip.durationLabel && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#FDF9F1] border border-orange-100/80 max-w-full min-w-0">
                <Clock size={12} className="text-[#FF9933] shrink-0" />
                <span className="truncate min-w-0 user-text">{trip.durationLabel}</span>
              </span>
            )}
          </div>
        )}

        <div className="mt-auto pt-4 border-t border-gray-100 flex items-end justify-between gap-3 user-text-box">
          <div className="min-w-0">
            {Number(trip.price) > 0 ? (
              /* A lakh-plus price is one unbreakable token. Without `user-text`
                 it sets its own min-content width and pushes the arrow button
                 out of the card at the narrow end of the three-column grid. */
              <div className="flex items-baseline gap-1.5 flex-wrap min-w-0">
                <p className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight leading-none min-w-0 user-text">{inr(trip.price)}</p>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.12em]">/ person</p>
              </div>
            ) : (
              <p className="text-sm font-black text-emerald-600 uppercase tracking-tight user-text">Free / by seva</p>
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
          <span className="shrink-0 w-11 h-11 rounded-full bg-gray-900 text-white flex items-center justify-center group-hover:bg-[#FF9933] transition-colors">
            <ArrowRight size={18} />
          </span>
        </div>
      </div>
    </motion.article>
  )
}

/* ------------------------------------------------------------------ */

const EmptyState = ({ icon, title, body, action }) => (
  <div className="relative overflow-hidden py-14 sm:py-20 px-5 sm:px-6 text-center bg-white rounded-[1.75rem] sm:rounded-[2rem] border border-orange-100 shadow-premium user-text-box">
    <div className="absolute inset-0 folk-yatra-mandala opacity-[0.05]" aria-hidden="true" />

    <div className="relative">
      <div className="relative w-16 h-16 mx-auto mb-5">
        <span className="absolute inset-0 rounded-3xl bg-[#FF9933]/15 blur-xl" aria-hidden="true" />
        <span className="relative w-16 h-16 rounded-3xl bg-orange-50 text-[#FF9933] flex items-center justify-center ring-1 ring-orange-100">
          {icon}
        </span>
      </div>
      <h3 className="text-base sm:text-lg font-black text-gray-900 tracking-tight user-text">{title}</h3>
      <p className="text-[13px] sm:text-sm text-gray-500 font-medium mt-2.5 max-w-sm mx-auto leading-[1.75] user-text">{body}</p>
      {action}
    </div>
  </div>
)

/** Card-shaped placeholder — reads as the grid filling in, not as a stall. */
const TripCardSkeleton = ({ index = 0 }) => (
  <div
    className="h-full flex flex-col bg-white rounded-[1.5rem] sm:rounded-[1.75rem] overflow-hidden shadow-premium border border-orange-50 animate-pulse"
    style={{ animationDelay: `${index * 90}ms` }}
    aria-hidden="true"
  >
    <div className="aspect-[16/10] w-full bg-gradient-to-br from-[#F0E2CC] to-[#FBF4E8]" />
    <div className="p-4 xs:p-5 sm:p-6 flex-1 flex flex-col gap-3.5">
      <div className="h-4 w-4/5 rounded-full bg-[#F0E2CC]" />
      <div className="h-3 w-3/5 rounded-full bg-[#F5EADA]" />
      <div className="flex items-center gap-3 pt-0.5">
        <div className="flex -space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#F0E2CC] ring-2 ring-white" />
          <div className="w-9 h-9 rounded-xl bg-[#F5EADA] ring-2 ring-white" />
          <div className="w-9 h-9 rounded-xl bg-[#F0E2CC] ring-2 ring-white" />
        </div>
        <div className="flex-1 space-y-1.5">
          <div className="h-2.5 w-24 rounded-full bg-[#F0E2CC]" />
          <div className="h-2.5 w-full rounded-full bg-[#F5EADA]" />
        </div>
      </div>
      <div className="mt-auto pt-4 border-t border-gray-100 flex items-end justify-between gap-3">
        <div className="space-y-2">
          <div className="h-5 w-20 rounded-full bg-[#F0E2CC]" />
          <div className="h-3 w-16 rounded-full bg-[#F5EADA]" />
        </div>
        <div className="w-11 h-11 rounded-full bg-[#F0E2CC]" />
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
    return [where('userId', '==', user?.uid || '__none__')]
  }, [isStaff, user?.uid])
  // "Public visitors read none" was the intent all along, but the query still
  // went out as `userId == guest` and was refused on every poll. A null
  // collection turns the subscription off instead; signing in switches it on.
  const { data: registrations } = useFirestore(
    user?.uid ? 'trip_registrations' : null,
    registrationsQuery
  )

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

  /** Every distinct place the crew visits, for the hero's destination strip. */
  const placeNames = React.useMemo(() => {
    const set = new Set()
    visibleTrips.forEach((t) => {
      normaliseLocations(t.locations).forEach((l) => {
        if (l.name) set.add(l.name)
      })
    })
    return Array.from(set)
  }, [visibleTrips])

  const showFilters = visibleTrips.length > 6
  const activeList = tab === 'upcoming' ? upcoming : completed

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    return activeList.filter((t) => {
      if (showFilters && locationFilter !== 'all' && t.location !== locationFilter) return false
      if (!q) return true
      // Place names are searchable too — "Govardhan" should find the Vraja yatra
      // even when the trip itself is filed under "Mathura".
      const placeHaystack = normaliseLocations(t.locations).map((l) => l.name)
      return [t.title, t.subtitle, t.location, t.durationLabel, ...placeHaystack]
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

  const heroStats = [
    { value: upcoming.length, label: 'Upcoming' },
    { value: completed.length, label: 'Completed' },
    { value: locations.length || '—', label: 'Destinations' },
    ...(placeNames.length > 0 ? [{ value: placeNames.length, label: 'Holy places' }] : []),
  ]

  const content = (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 sm:space-y-12 pb-12">
      <style>{TRIPS_STYLES}</style>

      {/* ---------------- Hero header ---------------- */}
      <section className="relative isolate overflow-hidden rounded-[1.75rem] sm:rounded-[2.5rem] bg-[#0B0A09] text-white">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(115% 85% at 78% 10%, rgba(255,153,51,0.42) 0%, rgba(255,153,51,0) 56%), radial-gradient(95% 75% at 6% 92%, rgba(212,175,55,0.30) 0%, rgba(212,175,55,0) 62%), linear-gradient(168deg, #1C1611 0%, #100D0B 46%, #070605 100%)',
          }}
          aria-hidden="true"
        />
        <div className="absolute inset-0 folk-yatra-mandala opacity-[0.13] mix-blend-soft-light" aria-hidden="true" />
        <div className="absolute inset-0 folk-yatra-grain opacity-[0.22] mix-blend-overlay" aria-hidden="true" />

        <div className="relative z-10">
          <div className="px-5 sm:px-10 lg:px-14 pt-9 sm:pt-14 lg:pt-16 pb-8 sm:pb-12">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-7 sm:gap-8">
              <motion.div
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.65, ease: 'easeOut' }}
                className="max-w-2xl min-w-0"
              >
                <span className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[10px] font-black uppercase tracking-[0.2em] text-white/85">
                  <span className="w-2 h-2 rounded-full bg-[#FF9933] shadow-[0_0_12px_3px_rgba(255,153,51,0.7)]" />
                  Trips &amp; Yatras
                </span>

                <h1
                  className="mt-6 font-black tracking-[-0.03em] leading-[0.95]"
                  style={{ fontSize: 'clamp(2.1rem, 6.4vw, 4rem)' }}
                >
                  <span className="folk-yatra-stroke block">Journey to the</span>
                  <span className="block text-[#FF9933]">holy places.</span>
                </h1>

                <p className="mt-5 sm:mt-6 text-white/70 leading-[1.75] max-w-xl text-[14.5px] sm:text-base">
                  Pilgrimages, weekend yatras and heritage trails with the FOLK crew — travel,
                  stay, prasadam and kirtan taken care of. Pick a journey, reserve your seat.
                </p>

                <div className="mt-8 sm:mt-10 grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-6 max-w-lg">
                  {heroStats.map((stat) => (
                    <div
                      key={stat.label}
                      className="min-w-0 sm:border-l sm:border-white/15 sm:pl-5 sm:first:border-l-0 sm:first:pl-0"
                    >
                      <p className="text-xl sm:text-[26px] font-black tracking-tight leading-none">{stat.value}</p>
                      <p className="mt-1.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.14em] text-white/45">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </motion.div>

              {isStaff && (
                <button
                  type="button"
                  onClick={() => setActiveTab && setActiveTab('trips-admin')}
                  className="shrink-0 min-h-[48px] px-7 rounded-full bg-white text-gray-900 font-black text-[11px] uppercase tracking-[0.16em] hover:bg-[#FF9933] hover:text-white transition-colors inline-flex items-center justify-center gap-2 shadow-xl"
                >
                  <Settings size={16} /> Manage Trips
                </button>
              )}
            </div>
          </div>

          {/* Destination lockup strip — every holy place the crew travels to */}
          {placeNames.length > 0 && (
            <div className="relative z-10 border-t border-white/10 bg-black/35 backdrop-blur-md">
              <div className="py-4 sm:py-5">
                <ScrollRow
                  className="flex items-center gap-x-5 gap-y-3 px-5 sm:px-10 lg:px-14 user-text-box"
                  fadeClass="from-[#0B0A09]"
                  chevronClass="text-white/50"
                >
                  <span className="shrink-0 text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
                    On the map
                  </span>
                  {placeNames.slice(0, 12).map((name) => (
                    <span
                      key={name}
                      className="shrink-0 flex items-center gap-1.5 text-[12px] sm:text-[13px] font-bold text-white/75"
                    >
                      <MapPin size={12} className="text-[#FF9933] shrink-0" />
                      <span className="max-w-[12rem] truncate user-text">{name}</span>
                    </span>
                  ))}
                  {placeNames.length > 12 && (
                    <span className="shrink-0 text-[12px] font-bold text-white/40 whitespace-nowrap">
                      +{placeNames.length - 12} more
                    </span>
                  )}
                </ScrollRow>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ---------------- Tabs + filters ---------------- */}
      <div className="space-y-4">
        <ScrollRow
          className="flex items-center gap-2"
          outerClassName="p-1.5 bg-white rounded-full shadow-premium border border-orange-50 w-full sm:w-fit"
          fadeClass="from-white"
          fadeEdgeClass="rounded-full"
        >
          {[
            { id: 'upcoming', label: 'Upcoming', count: upcoming.length },
            { id: 'completed', label: 'Completed', count: completed.length },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              aria-pressed={tab === t.id}
              className={`relative flex-1 sm:flex-none min-h-[44px] px-5 sm:px-7 rounded-full text-[11px] font-black uppercase tracking-[0.14em] whitespace-nowrap transition-colors inline-flex items-center justify-center gap-2 ${
                tab === t.id ? 'text-white' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {tab === t.id && (
                <motion.span
                  layoutId="tripsTabPill"
                  className="absolute inset-0 rounded-full bg-[#FF9933] shadow-lg shadow-[#FF9933]/25"
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                />
              )}
              <span className="relative z-10">{t.label}</span>
              <span
                className={`relative z-10 px-2 py-0.5 rounded-md text-[9px] font-black ${
                  tab === t.id ? 'bg-white/25 text-white' : 'bg-[#FDF9F1] text-gray-400'
                }`}
              >
                {t.count}
              </span>
            </button>
          ))}
        </ScrollRow>

        {showFilters && (
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 min-w-0">
              <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search trips, destinations, holy places…"
                aria-label="Search trips"
                className="w-full min-w-0 min-h-[48px] pl-11 pr-14 py-3 bg-white border border-orange-100 rounded-2xl outline-none focus:border-[#FF9933]/50 transition-all font-medium text-sm shadow-sm"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  aria-label="Clear search"
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-11 h-11 rounded-xl text-gray-400 hover:bg-[#FDF9F1] flex items-center justify-center"
                >
                  <X size={16} />
                </button>
              )}
            </div>
            <div className="relative sm:w-64 shrink-0">
              <Filter size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                aria-label="Filter by destination"
                className="w-full min-h-[48px] pl-11 pr-4 py-3 bg-white border border-orange-100 rounded-2xl outline-none focus:border-[#FF9933]/50 transition-all font-bold text-sm text-gray-600 shadow-sm appearance-none cursor-pointer"
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6">
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
                className="mt-6 min-h-[44px] px-6 rounded-full bg-gray-900 text-white font-black uppercase tracking-[0.16em] text-[10px] hover:bg-[#FF9933] transition-colors inline-flex items-center justify-center gap-2"
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
                className="mt-6 min-h-[44px] px-6 rounded-full bg-gray-900 text-white font-black uppercase tracking-[0.16em] text-[10px] hover:bg-[#FF9933] transition-colors inline-flex items-center justify-center gap-2"
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
                className="mt-6 min-h-[44px] px-6 rounded-full bg-gray-900 text-white font-black uppercase tracking-[0.16em] text-[10px] hover:bg-[#FF9933] transition-colors inline-flex items-center justify-center gap-2"
              >
                See what&apos;s coming up <ArrowRight size={14} />
              </button>
            ) : null}
          />
        )
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6">
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
      <section className="relative isolate overflow-hidden rounded-[1.75rem] sm:rounded-[2.5rem] bg-[#0B0A09] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(255,153,51,0.34),transparent_62%),radial-gradient(circle_at_92%_88%,rgba(212,175,55,0.22),transparent_58%)]" aria-hidden="true" />
        <div className="absolute inset-0 folk-yatra-mandala opacity-[0.10] mix-blend-soft-light" aria-hidden="true" />

        <div className="relative z-10 p-6 sm:p-10 flex flex-col sm:flex-row sm:items-center gap-6 justify-between">
          <div className="flex items-start sm:items-center gap-4 min-w-0">
            <div className="w-[52px] h-[52px] shrink-0 rounded-2xl bg-[#FF9933] text-white flex items-center justify-center shadow-lg shadow-[#FF9933]/25">
              <Sparkles size={22} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#FFC97A]">Travel together</p>
              <h3 className="mt-1.5 text-lg sm:text-2xl font-black tracking-tight leading-tight">Group rates &amp; custom yatras</h3>
              <p className="mt-2 text-[13px] sm:text-sm text-white/60 font-medium leading-[1.7] max-w-md">
                Families, colleges and offices — we plan the route, stay and prasadam for you.
              </p>
            </div>
          </div>
          <a
            href="https://wa.me/919154881444"
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 inline-flex items-center justify-center gap-2 min-h-[48px] px-7 rounded-full bg-white text-gray-900 font-black uppercase tracking-[0.16em] text-[10px] hover:bg-[#FF9933] hover:text-white transition-colors"
          >
            <Ticket size={15} /> Plan with us <ArrowUpRight size={14} />
          </a>
        </div>
      </section>
    </motion.div>
  )

  if (isPublicView) {
    return (
      <div className="min-h-screen bg-[#FDF9F1]">
        <PublicTopBar onLoginClick={onLoginClick} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">{content}</div>
      </div>
    )
  }

  return content
}

export default Trips
