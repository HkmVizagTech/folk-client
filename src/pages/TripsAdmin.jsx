import React, { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bus, Plus, X, Loader2, Edit3, Copy, Trash2, ExternalLink, Search, Download,
  Image as ImageIcon, Calendar, MapPin, IndianRupee, Users, CheckCircle2, XCircle,
  Clock, Ban, AlertTriangle, ChevronUp, ChevronDown, ChevronLeft, ListOrdered,
  Sparkles, ShieldCheck, ToggleLeft, ToggleRight, Wallet, FileText, MessageSquare,
  Hourglass, Layers, Phone, Mail
} from 'lucide-react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { useFirestore } from '../hooks/useFirestore'
import { useAuth } from '../hooks/useAuth'
import { auth, db } from '../lib/firebase'
import {
  collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp
} from 'firebase/firestore'

/* ------------------------------------------------------------------ *
 *  Constants & small helpers
 * ------------------------------------------------------------------ */

const TRIP_STATUSES = ['draft', 'upcoming', 'ongoing', 'completed', 'cancelled']
const REG_STATUSES = ['pending', 'confirmed', 'waitlisted', 'cancelled']

// Firestore hard-caps a document at 1 MiB. Cover + gallery images live inline
// as data URIs in the same doc, so a fat image is a real save failure.
const DOC_LIMIT_BYTES = 1048576
const DOC_WARN_BYTES = 700 * 1024
const DOC_BLOCK_BYTES = 1000 * 1024

const MODAL_SECTIONS = [
  { key: 'basics', label: 'Basics', icon: FileText },
  { key: 'dates', label: 'Dates & Pricing', icon: Calendar },
  { key: 'media', label: 'Media', icon: ImageIcon },
  { key: 'itinerary', label: 'Itinerary', icon: ListOrdered },
  { key: 'inclusions', label: 'Inclusions', icon: Layers },
]

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
  advanceAmount: '',
  capacity: '',
  status: 'draft',
  registrationOpen: false,
  highlights: [],
  itinerary: [],
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

const byteSize = (str) => {
  try {
    return new Blob([str]).size
  } catch {
    return String(str || '').length
  }
}

const formatBytes = (bytes) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

// Events.jsx canvas-resize pattern — this app has no storage bucket, every
// image is an inline data URI, so it must be shrunk before it ever hits state.
const resizeToDataUri = (file, maxWidth, quality) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read that file'))
    reader.onload = (event) => {
      const img = new Image()
      img.onerror = () => reject(new Error('That file is not a readable image'))
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width)
          width = maxWidth
        }
        canvas.width = width
        canvas.height = height
        canvas.getContext('2d').drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.src = event.target.result
    }
    reader.readAsDataURL(file)
  })

const downloadCsv = (headers, rows, filename) => {
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
    default: return 'text-gray-500 bg-gray-100 border-gray-200'
  }
}

const regStatusClass = (status) => {
  switch ((status || '').toLowerCase()) {
    case 'confirmed': return 'text-green-600 bg-green-100 border-green-200'
    case 'waitlisted': return 'text-amber-600 bg-amber-50 border-amber-200'
    case 'cancelled': return 'text-gray-500 bg-gray-100 border-gray-200'
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

const payStateClass = (state) => {
  switch (state) {
    case 'paid': return 'text-green-600 bg-green-100 border-green-200'
    case 'pending': return 'text-amber-600 bg-amber-50 border-amber-200'
    case 'checking': return 'text-gray-400 bg-gray-50 border-gray-200'
    default: return 'text-red-500 bg-red-50 border-red-200'
  }
}

const inputClass =
  'w-full px-4 py-3 bg-cream/30 border border-saffron/10 rounded-xl outline-none focus:bg-white focus:border-saffron/40 transition-all font-medium text-sm min-h-[44px]'
const labelClass = 'text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1'

/* ------------------------------------------------------------------ *
 *  Module-level sub components (kept outside so typing never remounts)
 * ------------------------------------------------------------------ */

const Field = ({ label, error, hint, children, className = '' }) => (
  <div className={`space-y-2 ${className}`}>
    <div className="flex items-baseline justify-between gap-2">
      <label className={labelClass}>{label}</label>
      {hint && <span className="text-[10px] text-gray-400 font-medium">{hint}</span>}
    </div>
    {children}
    {error && (
      <p className="text-[11px] font-bold text-red-500 ml-1 flex items-center gap-1">
        <AlertTriangle size={12} /> {error}
      </p>
    )}
  </div>
)

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
        <span className="text-[10px] text-gray-400 font-medium">{hint || 'Enter to add · commas split'}</span>
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
    slate: 'from-gray-50 to-gray-100 text-gray-600',
  }
  return (
    <div className={`rounded-2xl p-4 bg-gradient-to-br ${tones[tone]} border border-white/60 shadow-premium`}>
      <div className="flex items-center gap-2 mb-1">
        {Icon && <Icon size={14} />}
        <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-80">{label}</p>
      </div>
      <p className="text-xl font-black leading-tight">{value}</p>
      {sub && <p className="text-[10px] font-bold opacity-60 mt-0.5">{sub}</p>}
    </div>
  )
}

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

  const resolvePayment = useCallback((reg) => {
    const orderId = reg?.paymentOrderId || null
    if (!orderId) return { state: 'unpaid', label: 'Unpaid', orderId: null, amount: 0 }
    const p = paymentsById.get(String(orderId))
    if (!p) {
      return paymentsLoading
        ? { state: 'checking', label: 'Checking…', orderId, amount: 0 }
        : { state: 'pending', label: 'Pending', orderId, amount: 0 }
    }
    const paid = p.status === 'completed' && p.verified === true
    return {
      state: paid ? 'paid' : 'pending',
      label: paid ? 'Paid' : 'Pending',
      orderId,
      amount: Number.isFinite(Number(p.amount)) ? Number(p.amount) : 0,
    }
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
  const [imageError, setImageError] = useState('')
  const [showErrors, setShowErrors] = useState(false)

  const setField = useCallback((key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }, [])

  const openCreate = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setSlugTouched(false)
    setSection('basics')
    setSaveError('')
    setImageError('')
    setShowErrors(false)
    setModalOpen(true)
  }

  const formFromTrip = (trip) => ({
    slug: trip.slug || '',
    title: trip.title || '',
    subtitle: trip.subtitle || '',
    location: trip.location || '',
    description: trip.description || '',
    coverImage: trip.coverImage || '',
    gallery: Array.isArray(trip.gallery) ? trip.gallery.slice(0, 3) : [],
    startDate: trip.startDate || '',
    endDate: trip.endDate || '',
    durationLabel: trip.durationLabel || '',
    price: trip.price ?? '',
    advanceAmount: trip.advanceAmount ?? '',
    capacity: trip.capacity ?? '',
    status: TRIP_STATUSES.includes(trip.status) ? trip.status : 'draft',
    registrationOpen: !!trip.registrationOpen,
    highlights: Array.isArray(trip.highlights) ? trip.highlights : [],
    itinerary: Array.isArray(trip.itinerary)
      ? trip.itinerary.map((d, i) => ({
          day: toInt(d?.day) || i + 1,
          title: d?.title || '',
          details: d?.details || '',
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
    setImageError('')
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
    setImageError('')
    setShowErrors(false)
    setModalOpen(true)
  }

  const closeModal = () => {
    if (saving) return
    setModalOpen(false)
  }

  const handleTitleChange = (value) => {
    setForm((prev) => ({
      ...prev,
      title: value,
      slug: slugTouched ? prev.slug : slugify(value),
    }))
  }

  /* ---------------- images ---------------- */
  const [uploading, setUploading] = useState('')

  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setImageError('')
    setUploading('cover')
    try {
      const uri = await resizeToDataUri(file, 1200, 0.7)
      setField('coverImage', uri)
    } catch (err) {
      setImageError(err.message || 'Could not process that image')
    } finally {
      setUploading('')
    }
  }

  const handleGalleryUpload = async (e) => {
    const files = Array.from(e.target.files || [])
    e.target.value = ''
    if (files.length === 0) return
    setImageError('')
    const room = 3 - (form.gallery || []).length
    if (room <= 0) {
      setImageError('Gallery already holds the maximum of 3 images')
      return
    }
    setUploading('gallery')
    try {
      const picked = files.slice(0, room)
      const uris = []
      for (const file of picked) {
        // eslint-disable-next-line no-await-in-loop
        uris.push(await resizeToDataUri(file, 800, 0.55))
      }
      setForm((prev) => ({ ...prev, gallery: [...(prev.gallery || []), ...uris].slice(0, 3) }))
      if (files.length > room) setImageError(`Only ${room} more image${room === 1 ? '' : 's'} could be added (max 3)`)
    } catch (err) {
      setImageError(err.message || 'Could not process those images')
    } finally {
      setUploading('')
    }
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

  /* ---------------- validation + size ---------------- */
  const buildPayload = useCallback((f) => ({
    slug: (f.slug || '').trim(),
    title: (f.title || '').trim(),
    subtitle: (f.subtitle || '').trim(),
    location: (f.location || '').trim(),
    description: f.description || '',
    coverImage: f.coverImage || '',
    gallery: (f.gallery || []).slice(0, 3),
    startDate: f.startDate || '',
    endDate: f.endDate || '',
    durationLabel: (f.durationLabel || '').trim(),
    price: toNumber(f.price),
    advanceAmount: toNumber(f.advanceAmount),
    capacity: toInt(f.capacity),
    status: TRIP_STATUSES.includes(f.status) ? f.status : 'draft',
    registrationOpen: !!f.registrationOpen,
    highlights: (f.highlights || []).map((s) => String(s).trim()).filter(Boolean),
    itinerary: (f.itinerary || [])
      .map((d, i) => ({ day: toInt(d.day) || i + 1, title: String(d.title || '').trim(), details: String(d.details || '').trim() }))
      .filter((d) => d.title || d.details),
    inclusions: (f.inclusions || []).map((s) => String(s).trim()).filter(Boolean),
    exclusions: (f.exclusions || []).map((s) => String(s).trim()).filter(Boolean),
    meetingPoint: (f.meetingPoint || '').trim(),
    contactPhone: (f.contactPhone || '').trim(),
  }), [])

  const docBytes = useMemo(() => {
    // Timestamps + createdBy are small; measuring the payload is a fair proxy
    // for the stored doc, and the images dominate it anyway.
    try {
      return byteSize(JSON.stringify(buildPayload(form)))
    } catch {
      return 0
    }
  }, [form, buildPayload])

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
    if (docBytes > DOC_BLOCK_BYTES) {
      e.media = `This trip is ${formatBytes(docBytes)} — Firestore rejects anything over 1 MB. Remove or re-upload an image.`
    }
    return e
  }, [form, trips, editingId, docBytes])

  const sectionErrors = useMemo(() => ({
    basics: !!(errors.title || errors.slug),
    dates: !!(errors.startDate || errors.endDate || errors.price || errors.advanceAmount || errors.capacity),
    media: !!errors.media,
    itinerary: false,
    inclusions: false,
  }), [errors])

  const hasErrors = Object.keys(errors).length > 0

  const handleSubmit = async (e) => {
    e.preventDefault()
    setShowErrors(true)
    setSaveError('')
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
  }, [registrations, filterTrip, filterStatus, search])

  const regSummary = useMemo(() => {
    let confirmed = 0
    let seats = 0
    let collected = 0
    let pending = 0
    filteredRegs.forEach((r) => {
      const status = (r.status || 'pending').toLowerCase()
      const due = toNumber(r.amountDue)
      const pay = resolvePayment(r)
      if (status === 'confirmed') {
        confirmed += 1
        seats += toInt(r.seats) || 1
      }
      if (pay.state === 'paid') {
        collected += pay.amount > 0 ? pay.amount : due
      } else if (status !== 'cancelled' && pay.state !== 'checking') {
        pending += due
      }
    })
    return { total: filteredRegs.length, confirmed, seats, collected, pending }
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

  // The travel manifest staff actually carry — mirrors generateGrowthAudit.
  const exportRegistrations = () => {
    const headers = [
      'Name', 'Phone', 'Email', 'Trip', 'Trip Slug', 'Seats',
      'Amount Due (INR)', 'Payment', 'Order ID', 'Status', 'Registered On',
      'Traveller Notes', 'Emergency Contact', 'Staff Notes',
    ]
    const rows = filteredRegs.map((r) => {
      const pay = resolvePayment(r)
      return [
        r.userName || '',
        r.userPhone || '',
        r.userEmail || '',
        r.tripTitle || '',
        r.tripSlug || '',
        toInt(r.seats) || 1,
        toNumber(r.amountDue),
        pay.label,
        pay.orderId || '',
        r.status || 'pending',
        formatStamp(r.createdAt),
        r.travellerNotes || '',
        r.emergencyContact || '',
        r.staffNotes || '',
      ]
    })
    downloadCsv(headers, rows, `trip_registrations_${new Date().toISOString().slice(0, 10)}.csv`)
  }

  /* ---------------- loading ---------------- */
  if (tripsLoading && (trips || []).length === 0) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-saffron" size={40} />
          <p className="text-gray-400 font-black uppercase tracking-[0.3em] text-[10px]">Loading Yatras…</p>
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
            className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-saffron transition-colors min-h-[44px]"
          >
            <ChevronLeft size={14} /> Command Center
          </button>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-bold font-poppins text-saffron-dark">Trips & Yatras</h1>
            <Bus className="text-saffron shrink-0" size={24} />
            {isAdmin && (
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-saffron/10 text-saffron text-[9px] font-black uppercase tracking-widest">
                <ShieldCheck size={11} /> Admin
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Create pilgrimages, publish them, and manage every registration and payment.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 shrink-0">
          <Button
            onClick={openCreate}
            className="w-full sm:w-auto min-h-[44px] px-6 bg-gradient-to-r from-saffron to-gold shadow-lg font-bold rounded-2xl flex items-center justify-center gap-2"
          >
            <Plus size={18} /> New Trip
          </Button>
        </div>
      </div>

      {/* ---------------- View switcher ---------------- */}
      <div className="flex items-center gap-2 p-1.5 bg-white rounded-2xl shadow-premium border border-saffron/10 w-full sm:w-auto sm:inline-flex overflow-x-auto scrollbar-hide">
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
              className={`flex-1 sm:flex-none min-h-[44px] px-5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 whitespace-nowrap ${
                active ? 'bg-gradient-to-r from-saffron to-gold text-white shadow-md' : 'text-gray-400 hover:text-saffron'
              }`}
            >
              <Icon size={15} /> {tab.label}
              <span className={`px-1.5 py-0.5 rounded-md text-[9px] ${active ? 'bg-white/25' : 'bg-gray-100 text-gray-500'}`}>
                {tab.count}
              </span>
            </button>
          )
        })}
      </div>

      {/* ================= TRIPS VIEW ================= */}
      {view === 'trips' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <SummaryTile label="Total Trips" value={totalTrips} icon={Bus} />
            <SummaryTile label="Upcoming" value={upcomingTrips} icon={Calendar} tone="green" />
            <SummaryTile label="Open for Registration" value={openTrips} icon={ToggleRight} tone="amber" />
            <SummaryTile label="Registrations" value={(registrations || []).length} icon={Users} tone="slate" />
          </div>

          {tripError && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-bold flex items-center gap-2">
              <AlertTriangle size={14} /> {tripError}
            </div>
          )}

          {sortedTrips.length === 0 ? (
            <Card className="p-10 text-center border-none shadow-sm bg-white">
              <Bus className="mx-auto text-saffron/30 mb-4" size={44} />
              <p className="text-gray-400 italic text-sm mb-5">No trips yet — create the first yatra.</p>
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
                  return (
                    <motion.div key={trip.id} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }}>
                      <Card hover={false} className="p-4 sm:p-5 border-none shadow-premium bg-white rounded-[1.5rem] sm:rounded-[2rem]">
                        <div className="flex flex-col lg:flex-row lg:items-center gap-4">

                          {/* thumb */}
                          <div className="w-full h-36 lg:w-28 lg:h-20 shrink-0 rounded-2xl overflow-hidden bg-gradient-to-br from-saffron/10 to-gold/10 flex items-center justify-center">
                            {trip.coverImage ? (
                              <img src={trip.coverImage} alt={trip.title} className="w-full h-full object-cover" />
                            ) : (
                              <Bus size={26} className="text-saffron/30" />
                            )}
                          </div>

                          {/* meta */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-bold text-gray-800 text-sm sm:text-base truncate">{trip.title || 'Untitled trip'}</h3>
                              <span className={`text-[9px] font-black px-2 py-1 rounded-md uppercase tracking-widest border ${tripStatusClass(trip.status)}`}>
                                {trip.status || 'draft'}
                              </span>
                              <span className={`text-[9px] font-black px-2 py-1 rounded-md uppercase tracking-widest border ${
                                trip.registrationOpen ? 'text-green-600 bg-green-50 border-green-200' : 'text-gray-400 bg-gray-50 border-gray-200'
                              }`}>
                                {trip.registrationOpen ? 'Registrations open' : 'Registrations closed'}
                              </span>
                            </div>
                            <p className="text-[11px] text-gray-400 font-mono mt-1 truncate">/trip/{trip.slug || '—'}</p>
                            <div className="flex items-center gap-x-4 gap-y-1 flex-wrap mt-2 text-[11px] text-gray-500 font-semibold">
                              <span className="flex items-center gap-1.5"><Calendar size={12} className="text-gold" /> {formatDate(trip.startDate)} → {formatDate(trip.endDate)}</span>
                              {trip.location && <span className="flex items-center gap-1.5 truncate max-w-[180px]"><MapPin size={12} className="text-saffron" /> {trip.location}</span>}
                              <span className="flex items-center gap-1.5"><IndianRupee size={12} className="text-emerald-500" /> {formatINR(trip.price)}</span>
                              <span className="flex items-center gap-1.5"><Users size={12} className="text-celestial-dark" /> {stats.count} registration{stats.count === 1 ? '' : 's'}{trip.capacity ? ` · ${stats.seats}/${trip.capacity} seats` : ''}</span>
                            </div>
                          </div>

                          {/* controls */}
                          <div className="flex flex-col gap-2 shrink-0 lg:w-[290px]">
                            <div className="flex items-center gap-2">
                              <select
                                value={TRIP_STATUSES.includes(trip.status) ? trip.status : 'draft'}
                                disabled={busy}
                                aria-label={`Status for ${trip.title}`}
                                onChange={(e) => handleTripStatus(trip, e.target.value)}
                                className="flex-1 min-h-[44px] px-3 bg-cream/40 border border-saffron/10 rounded-xl text-xs font-bold text-gray-600 outline-none focus:border-saffron/40 disabled:opacity-60"
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
                                  trip.registrationOpen ? 'bg-green-50 text-green-600 hover:bg-green-100' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                }`}
                              >
                                {busy ? <Loader2 size={15} className="animate-spin" /> : trip.registrationOpen ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                                <span className="hidden sm:inline">{trip.registrationOpen ? 'Open' : 'Closed'}</span>
                              </button>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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
                                className="min-h-[44px] bg-gray-100 text-gray-600 text-[11px] font-bold rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-1.5"
                              >
                                <Copy size={13} /> Copy
                              </button>
                              <button
                                onClick={() => openTrip && trip.slug && openTrip(trip.slug)}
                                disabled={!trip.slug}
                                aria-label={`View public page for ${trip.title}`}
                                className="min-h-[44px] bg-gray-100 text-gray-600 text-[11px] font-bold rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-40"
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
                                  className="min-h-[44px] bg-gray-100 text-gray-600 text-[11px] font-bold rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-1.5"
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

          {/* summary strip */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
            <SummaryTile label="Registrations" value={regSummary.total} icon={Users} />
            <SummaryTile label="Confirmed" value={regSummary.confirmed} icon={CheckCircle2} tone="green" />
            <SummaryTile label="Seats Booked" value={regSummary.seats} sub="confirmed only" icon={Bus} tone="slate" />
            <SummaryTile label="Collected" value={formatINR(regSummary.collected)} sub="verified payments" icon={Wallet} tone="green" />
            <SummaryTile label="Pending" value={formatINR(regSummary.pending)} sub="not yet paid" icon={Hourglass} tone="amber" />
          </div>

          {/* filters */}
          <Card hover={false} className="p-4 sm:p-5 border-none shadow-premium bg-white rounded-[1.5rem] sm:rounded-[2rem]">
            <div className="flex flex-col lg:flex-row gap-3">
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search name, phone or email…"
                  aria-label="Search registrations"
                  className="w-full min-h-[44px] pl-11 pr-4 py-3 bg-cream/30 border border-saffron/10 rounded-xl outline-none focus:bg-white focus:border-saffron/40 transition-all text-sm font-medium"
                />
              </div>
              <select
                value={filterTrip}
                onChange={(e) => setFilterTrip(e.target.value)}
                aria-label="Filter by trip"
                className="min-h-[44px] px-4 bg-cream/30 border border-saffron/10 rounded-xl text-xs font-bold text-gray-600 outline-none focus:border-saffron/40 lg:w-56"
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
                className="min-h-[44px] px-4 bg-cream/30 border border-saffron/10 rounded-xl text-xs font-bold text-gray-600 outline-none focus:border-saffron/40 lg:w-44"
              >
                <option value="all">All statuses</option>
                {REG_STATUSES.map((s) => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
              <Button
                variant="secondary"
                onClick={exportRegistrations}
                disabled={filteredRegs.length === 0}
                className="min-h-[44px] px-5 rounded-xl text-xs font-black uppercase tracking-widest disabled:opacity-40"
              >
                <Download size={15} /> Export CSV
              </Button>
            </div>
          </Card>

          {regError && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-bold flex items-center gap-2">
              <AlertTriangle size={14} /> {regError}
            </div>
          )}

          {regsLoading && (registrations || []).length === 0 ? (
            <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-saffron" size={28} /></div>
          ) : filteredRegs.length === 0 ? (
            <Card className="p-10 text-center border-none shadow-sm bg-white">
              <Users className="mx-auto text-saffron/30 mb-4" size={40} />
              <p className="text-gray-400 italic text-sm">No registrations match these filters.</p>
            </Card>
          ) : (
            <Card hover={false} className="p-0 border-none shadow-premium bg-white rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden">
              <div className="overflow-x-auto scrollbar-hide">
                <table className="w-full min-w-[980px]">
                  <thead>
                    <tr className="text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100 bg-cream/20">
                      <th className="py-4 px-5 font-black">Devotee</th>
                      <th className="py-4 px-3 font-black">Trip</th>
                      <th className="py-4 px-3 font-black">Seats</th>
                      <th className="py-4 px-3 font-black">Amount</th>
                      <th className="py-4 px-3 font-black">Payment</th>
                      <th className="py-4 px-3 font-black">Status</th>
                      <th className="py-4 px-3 font-black">Registered</th>
                      <th className="py-4 px-5 font-black text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredRegs.map((reg) => {
                      const pay = resolvePayment(reg)
                      const busy = regBusy === reg.id
                      const status = (reg.status || 'pending').toLowerCase()
                      const expanded = noteOpen === reg.id
                      return (
                        <React.Fragment key={reg.id}>
                          <tr className="hover:bg-cream/20 transition-colors align-top">
                            <td className="py-4 px-5">
                              <p className="font-bold text-gray-800 text-sm">{reg.userName || 'Devotee'}</p>
                              <div className="text-[11px] text-gray-400 font-medium mt-1 space-y-0.5">
                                {reg.userPhone && <p className="flex items-center gap-1.5"><Phone size={10} /> {reg.userPhone}</p>}
                                {reg.userEmail && <p className="flex items-center gap-1.5 truncate max-w-[190px]"><Mail size={10} /> {reg.userEmail}</p>}
                              </div>
                            </td>
                            <td className="py-4 px-3">
                              <p className="text-xs font-bold text-gray-600 truncate max-w-[160px]">{reg.tripTitle || '—'}</p>
                              <p className="text-[10px] text-gray-400 font-mono truncate max-w-[160px]">{reg.tripSlug || ''}</p>
                            </td>
                            <td className="py-4 px-3 text-sm font-bold text-gray-700">{toInt(reg.seats) || 1}</td>
                            <td className="py-4 px-3 text-sm font-bold text-gray-700 whitespace-nowrap">{formatINR(reg.amountDue)}</td>
                            <td className="py-4 px-3">
                              <span className={`inline-flex items-center gap-1 text-[9px] font-black px-2 py-1 rounded-md uppercase tracking-widest border whitespace-nowrap ${payStateClass(pay.state)}`}>
                                {pay.state === 'paid' ? <CheckCircle2 size={11} /> : pay.state === 'pending' ? <Clock size={11} /> : <XCircle size={11} />}
                                {pay.label}
                              </span>
                              {pay.orderId && (
                                <p className="text-[9px] text-gray-400 font-mono mt-1 truncate max-w-[130px]" title={pay.orderId}>{pay.orderId}</p>
                              )}
                            </td>
                            <td className="py-4 px-3">
                              <span className={`inline-flex items-center gap-1 text-[9px] font-black px-2 py-1 rounded-md uppercase tracking-widest border whitespace-nowrap ${regStatusClass(status)}`}>
                                {regStatusIcon(status)} {status}
                              </span>
                            </td>
                            <td className="py-4 px-3 text-[11px] text-gray-400 font-semibold whitespace-nowrap">{formatStamp(reg.createdAt)}</td>
                            <td className="py-4 px-5">
                              <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                <button
                                  disabled={busy || status === 'confirmed'}
                                  onClick={() => updateRegistration(reg, 'confirmed')}
                                  aria-label={`Confirm ${reg.userName || 'registration'}`}
                                  className="min-h-[36px] px-3 bg-green-500 text-white text-[10px] font-black uppercase tracking-wider rounded-lg hover:bg-green-600 transition-colors disabled:opacity-40 flex items-center gap-1.5"
                                >
                                  {busy ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />} Confirm
                                </button>
                                <button
                                  disabled={busy || status === 'waitlisted'}
                                  onClick={() => updateRegistration(reg, 'waitlisted')}
                                  aria-label={`Waitlist ${reg.userName || 'registration'}`}
                                  className="min-h-[36px] px-3 bg-amber-50 text-amber-600 text-[10px] font-black uppercase tracking-wider rounded-lg hover:bg-amber-100 transition-colors disabled:opacity-40 flex items-center gap-1.5"
                                >
                                  {busy ? <Loader2 size={12} className="animate-spin" /> : <Hourglass size={12} />} Wait
                                </button>
                                <button
                                  disabled={busy || status === 'cancelled'}
                                  onClick={() => updateRegistration(reg, 'cancelled')}
                                  aria-label={`Cancel ${reg.userName || 'registration'}`}
                                  className="min-h-[36px] px-3 bg-red-50 text-red-500 text-[10px] font-black uppercase tracking-wider rounded-lg hover:bg-red-100 transition-colors disabled:opacity-40 flex items-center gap-1.5"
                                >
                                  {busy ? <Loader2 size={12} className="animate-spin" /> : <Ban size={12} />} Cancel
                                </button>
                                <button
                                  onClick={() => {
                                    setNoteDrafts((prev) => ({ ...prev, [reg.id]: prev[reg.id] ?? (reg.staffNotes || '') }))
                                    setNoteOpen(expanded ? null : reg.id)
                                  }}
                                  aria-label={`Staff note for ${reg.userName || 'registration'}`}
                                  className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                                    reg.staffNotes ? 'bg-saffron/10 text-saffron' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                                  }`}
                                >
                                  <MessageSquare size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>

                          {(expanded || reg.travellerNotes || reg.emergencyContact) && (
                            <tr className="bg-cream/20">
                              <td colSpan={8} className="px-5 pb-4">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                                  <div className="text-[11px] text-gray-500 space-y-1">
                                    {reg.travellerNotes && <p><span className="font-black uppercase tracking-widest text-[9px] text-gray-400">Traveller note</span><br />{reg.travellerNotes}</p>}
                                    {reg.emergencyContact && <p><span className="font-black uppercase tracking-widest text-[9px] text-gray-400">Emergency contact</span><br />{reg.emergencyContact}</p>}
                                    {!expanded && reg.staffNotes && <p><span className="font-black uppercase tracking-widest text-[9px] text-gray-400">Staff note</span><br />{reg.staffNotes}</p>}
                                  </div>
                                  {expanded && (
                                    <div className="space-y-2">
                                      <label className={labelClass}>Staff note</label>
                                      <textarea
                                        rows={2}
                                        value={noteDrafts[reg.id] ?? (reg.staffNotes || '')}
                                        onChange={(e) => setNoteDrafts((prev) => ({ ...prev, [reg.id]: e.target.value }))}
                                        placeholder="Seat allotted in bus 2, paid cash balance…"
                                        className="w-full bg-white border border-saffron/10 rounded-xl px-4 py-3 outline-none focus:border-saffron/40 transition-all text-sm font-medium resize-none"
                                      />
                                      <div className="flex gap-2">
                                        <button
                                          disabled={busy}
                                          onClick={() => saveNoteOnly(reg)}
                                          className="min-h-[40px] px-4 bg-saffron text-white text-[10px] font-black uppercase tracking-wider rounded-lg hover:bg-saffron-dark transition-colors disabled:opacity-50 flex items-center gap-2"
                                        >
                                          {busy ? <Loader2 size={13} className="animate-spin" /> : null} Save note
                                        </button>
                                        <button
                                          onClick={() => setNoteOpen(null)}
                                          className="min-h-[40px] px-4 bg-gray-100 text-gray-500 text-[10px] font-black uppercase tracking-wider rounded-lg hover:bg-gray-200 transition-colors"
                                        >
                                          Close
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
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
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-xl"
            />
            <motion.div
              initial={{ scale: 0.95, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 30 }}
              className="relative w-full max-w-3xl bg-white rounded-[1.75rem] sm:rounded-[2.5rem] shadow-premium-xl overflow-y-auto max-h-[90vh] border border-saffron/10"
            >
              <button
                onClick={closeModal}
                aria-label="Close"
                className="absolute top-4 right-4 w-11 h-11 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-all z-10"
              >
                <X size={22} />
              </button>

              <div className="p-5 sm:p-8 pb-0">
                <div className="w-12 h-12 bg-gradient-to-br from-saffron to-gold rounded-2xl flex items-center justify-center mb-3 shadow-lg">
                  <Sparkles className="text-white" size={22} />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 pr-12">
                  {editingId ? 'Edit Trip' : 'New Trip'}
                </h2>
                <p className="text-gray-400 text-xs sm:text-sm mt-1">
                  {editingId ? 'Update the yatra details devotees see on its landing page.' : 'Set up a pilgrimage devotees can browse and register for.'}
                </p>

                {/* section nav */}
                <div className="flex gap-2 mt-5 -mx-5 px-5 sm:mx-0 sm:px-0 overflow-x-auto scrollbar-hide pb-1">
                  {MODAL_SECTIONS.map((s) => {
                    const Icon = s.icon
                    const active = section === s.key
                    const bad = showErrors && sectionErrors[s.key]
                    return (
                      <button
                        key={s.key}
                        type="button"
                        onClick={() => setSection(s.key)}
                        className={`relative min-h-[44px] px-4 rounded-xl text-[11px] font-black uppercase tracking-widest whitespace-nowrap flex items-center gap-2 transition-all ${
                          active ? 'bg-gradient-to-r from-saffron to-gold text-white shadow-md' : 'bg-cream/40 text-gray-400 hover:text-saffron'
                        }`}
                      >
                        <Icon size={14} /> {s.label}
                        {bad && <span className="w-1.5 h-1.5 rounded-full bg-red-500 absolute top-2 right-2" />}
                      </button>
                    )
                  })}
                </div>
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
                          className="min-h-[44px] px-4 rounded-xl bg-saffron/10 text-saffron text-[10px] font-black uppercase tracking-widest hover:bg-saffron hover:text-white transition-colors shrink-0"
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
                          className={`w-full min-h-[44px] px-4 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-between transition-colors ${
                            form.registrationOpen ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'
                          }`}
                        >
                          {form.registrationOpen ? 'Open' : 'Closed'}
                          {form.registrationOpen ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                        </button>
                      </Field>
                    </div>

                    <div className="p-4 rounded-2xl bg-cream/40 border border-saffron/10 text-[11px] text-gray-500 font-medium leading-relaxed">
                      A trip only appears to devotees once its status is <span className="font-black text-saffron-dark">upcoming</span> (or later);
                      <span className="font-black text-saffron-dark"> draft</span> keeps it staff-only. Registrations can be closed independently
                      of the status — useful once the bus fills up.
                    </div>
                  </div>
                )}

                {/* ---------- MEDIA ---------- */}
                {section === 'media' && (
                  <div className="space-y-5">
                    <div className={`p-4 rounded-2xl border font-bold text-[11px] flex items-start gap-3 ${
                      docBytes > DOC_BLOCK_BYTES
                        ? 'bg-red-50 border-red-200 text-red-600'
                        : docBytes > DOC_WARN_BYTES
                          ? 'bg-amber-50 border-amber-200 text-amber-700'
                          : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    }`}>
                      {docBytes > DOC_WARN_BYTES ? <AlertTriangle size={16} className="shrink-0 mt-0.5" /> : <CheckCircle2 size={16} className="shrink-0 mt-0.5" />}
                      <div className="flex-1 min-w-0">
                        <p>Estimated document size: {formatBytes(docBytes)} of the 1 MB Firestore limit</p>
                        <div className="w-full h-1.5 bg-white/70 rounded-full mt-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              docBytes > DOC_BLOCK_BYTES ? 'bg-red-500' : docBytes > DOC_WARN_BYTES ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(100, Math.round((docBytes / DOC_LIMIT_BYTES) * 100))}%` }}
                          />
                        </div>
                        {docBytes > DOC_WARN_BYTES && (
                          <p className="mt-2 font-medium">
                            Images are stored inline in this document. Drop a gallery image or re-upload a smaller cover to get back under the limit.
                          </p>
                        )}
                      </div>
                    </div>

                    {imageError && (
                      <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-[11px] font-bold flex items-center gap-2">
                        <AlertTriangle size={13} /> {imageError}
                      </div>
                    )}

                    <Field label="Cover Image" hint="resized to 1200px wide" error={showErrors ? errors.media : ''}>
                      <div className="flex flex-col sm:flex-row gap-4">
                        <div className="w-full sm:w-52 h-32 rounded-2xl overflow-hidden bg-gradient-to-br from-saffron/10 to-gold/10 flex items-center justify-center shrink-0">
                          {form.coverImage ? (
                            <img src={form.coverImage} alt="Trip cover" className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon size={30} className="text-saffron/30" />
                          )}
                        </div>
                        <div className="flex-1 space-y-2">
                          <label className="flex items-center gap-3 cursor-pointer w-full p-4 bg-cream/30 border-2 border-dashed border-saffron/20 rounded-2xl hover:bg-cream/50 transition-all min-h-[44px]">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm shrink-0">
                              {uploading === 'cover' ? <Loader2 className="animate-spin text-saffron" size={18} /> : <ImageIcon className="text-gray-400" size={18} />}
                            </div>
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                              {uploading === 'cover' ? 'Processing…' : form.coverImage ? 'Replace cover' : 'Choose a cover'}
                            </span>
                            <input type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" />
                          </label>
                          {form.coverImage && (
                            <button
                              type="button"
                              onClick={() => setField('coverImage', '')}
                              className="min-h-[40px] px-4 bg-red-50 text-red-500 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-red-100 transition-colors"
                            >
                              Remove cover
                            </button>
                          )}
                        </div>
                      </div>
                    </Field>

                    <Field label="Gallery" hint={`${(form.gallery || []).length}/3 · resized to 800px`}>
                      <div className="grid grid-cols-3 gap-3">
                        {(form.gallery || []).map((src, i) => (
                          <div key={i} className="relative h-24 rounded-2xl overflow-hidden bg-cream/40">
                            <img src={src} alt={`Gallery ${i + 1}`} className="w-full h-full object-cover" />
                            <button
                              type="button"
                              aria-label={`Remove gallery image ${i + 1}`}
                              onClick={() => setField('gallery', form.gallery.filter((_, idx) => idx !== i))}
                              className="absolute top-1.5 right-1.5 w-8 h-8 rounded-full bg-gray-900/70 text-white flex items-center justify-center hover:bg-red-500 transition-colors"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                        {(form.gallery || []).length < 3 && (
                          <label className="h-24 cursor-pointer bg-cream/30 border-2 border-dashed border-saffron/20 rounded-2xl hover:bg-cream/50 transition-all flex flex-col items-center justify-center gap-1">
                            {uploading === 'gallery'
                              ? <Loader2 className="animate-spin text-saffron" size={18} />
                              : <Plus className="text-saffron/50" size={20} />}
                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Add</span>
                            <input type="file" accept="image/*" multiple onChange={handleGalleryUpload} className="hidden" />
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
                        <p className="text-gray-400 italic text-xs">No days added yet — build the day-by-day plan here.</p>
                      </div>
                    )}

                    {(form.itinerary || []).map((day, i) => (
                      <div key={i} className="p-4 rounded-2xl bg-cream/25 border border-saffron/10 space-y-3">
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min={1}
                            value={day.day}
                            onChange={(e) => updateDay(i, 'day', e.target.value)}
                            aria-label={`Day number for entry ${i + 1}`}
                            className="w-20 px-3 py-3 min-h-[44px] bg-white border border-saffron/10 rounded-xl outline-none focus:border-saffron/40 font-bold text-sm text-center"
                          />
                          <input
                            type="text"
                            value={day.title}
                            onChange={(e) => updateDay(i, 'title', e.target.value)}
                            placeholder="Arrival & Mangala Aarti"
                            aria-label={`Title for day ${i + 1}`}
                            className="flex-1 px-4 py-3 min-h-[44px] bg-white border border-saffron/10 rounded-xl outline-none focus:border-saffron/40 font-medium text-sm"
                          />
                          <div className="flex gap-1 shrink-0">
                            <button
                              type="button" aria-label={`Move day ${i + 1} up`} disabled={i === 0}
                              onClick={() => moveDay(i, -1)}
                              className="w-11 h-11 rounded-xl bg-white border border-saffron/10 text-gray-400 hover:text-saffron flex items-center justify-center disabled:opacity-30"
                            >
                              <ChevronUp size={16} />
                            </button>
                            <button
                              type="button" aria-label={`Move day ${i + 1} down`} disabled={i === form.itinerary.length - 1}
                              onClick={() => moveDay(i, 1)}
                              className="w-11 h-11 rounded-xl bg-white border border-saffron/10 text-gray-400 hover:text-saffron flex items-center justify-center disabled:opacity-30"
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
                      className="w-full min-h-[44px] py-3 bg-saffron/10 text-saffron-dark text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-saffron hover:text-white transition-colors flex items-center justify-center gap-2"
                    >
                      <Plus size={16} /> Add Day
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
                    <div className="h-px bg-gray-100" />
                    <StringListEditor
                      label="Exclusions"
                      items={form.exclusions}
                      onChange={(v) => setField('exclusions', v)}
                      placeholder="Personal shopping, entry tickets"
                    />
                  </div>
                )}

                {/* ---------- footer ---------- */}
                <div className="sticky bottom-0 -mx-5 sm:-mx-8 px-5 sm:px-8 pt-4 pb-1 bg-white/95 backdrop-blur-sm border-t border-gray-100 space-y-3">
                  {showErrors && hasErrors && (
                    <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-[11px] font-bold flex items-start gap-2">
                      <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                      <span>{Object.values(errors)[0]}</span>
                    </div>
                  )}
                  {saveError && (
                    <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-[11px] font-bold flex items-center gap-2">
                      <AlertTriangle size={14} /> {saveError}
                    </div>
                  )}
                  <div className="flex flex-col sm:flex-row gap-3 items-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-300 flex-1 text-center sm:text-left">
                      {formatBytes(docBytes)} / 1 MB
                    </p>
                    <button
                      type="button"
                      onClick={closeModal}
                      disabled={saving}
                      className="w-full sm:w-auto min-h-[44px] px-6 rounded-2xl bg-gray-100 text-gray-500 text-xs font-black uppercase tracking-widest hover:bg-gray-200 transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <Button
                      type="submit"
                      disabled={saving}
                      className="w-full sm:w-auto py-3 px-8 bg-gradient-to-r from-saffron to-gold shadow-lg font-bold rounded-2xl flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                      {saving ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
                      {saving ? 'Saving…' : editingId ? 'Save Changes' : 'Create Trip'}
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
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-xl"
            />
            <motion.div
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[1.75rem] sm:rounded-[2.5rem] shadow-premium-xl p-6 sm:p-8 overflow-y-auto max-h-[90vh] border border-red-100"
            >
              <button
                onClick={() => !deleting && setDeleteTarget(null)}
                aria-label="Close"
                className="absolute top-4 right-4 w-11 h-11 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400"
              >
                <X size={20} />
              </button>

              <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mb-4">
                <Trash2 className="text-red-500" size={22} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 pr-10">Delete this trip?</h3>
              <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                <span className="font-bold text-gray-700">{deleteTarget.title}</span> will be removed permanently and
                <span className="font-bold"> /trip/{deleteTarget.slug}</span> will stop working. Its
                {' '}{(regStatsByTrip.get(deleteTarget.id)?.count) || 0} registration(s) are kept but will no longer point at a live trip.
              </p>

              <div className="mt-5 space-y-2">
                <label className={labelClass}>Type <span className="font-mono text-saffron-dark">{deleteTarget.slug}</span> to confirm</label>
                <input
                  type="text"
                  value={deleteText}
                  onChange={(e) => setDeleteText(e.target.value)}
                  placeholder={deleteTarget.slug}
                  className={`${inputClass} font-mono`}
                />
              </div>

              {deleteError && (
                <p className="mt-3 text-[11px] font-bold text-red-500 flex items-center gap-1">
                  <AlertTriangle size={12} /> {deleteError}
                </p>
              )}

              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <button
                  onClick={() => setDeleteTarget(null)}
                  disabled={deleting}
                  className="flex-1 min-h-[44px] rounded-2xl bg-gray-100 text-gray-500 text-xs font-black uppercase tracking-widest hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  Keep it
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={deleting || deleteText.trim() !== (deleteTarget.slug || '')}
                  className="flex-1 min-h-[44px] rounded-2xl bg-red-500 text-white text-xs font-black uppercase tracking-widest hover:bg-red-600 transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  {deleting ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                  Delete Trip
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
