import { useEffect, useMemo, useState } from 'react'
import { auth } from '../../../lib/firebase'
import { getPaymentConfig } from '../../../lib/razorpay'
import { computePaymentModes, computePricing, MAX_SEATS } from '../lib/pricing'

const emptyForm = { seats: 1, name: '', travellerNotes: '', emergencyContact: '', phone: '', email: '' }

/** Registration form state, seat stepper, price figures and the payment routes on offer. */
export const useBookingForm = ({ trip, user, seatsLeft, modalOpen }) => {
  const [form, setForm] = useState(emptyForm)
  const [payMethod, setPayMethod] = useState('online') // 'online' | 'cash'
  // The server holds the Razorpay keys and says whether online payment is on.
  const [payCfg, setPayCfg] = useState(null)
  useEffect(() => {
    let alive = true
    getPaymentConfig().then((c) => { if (alive) setPayCfg(c) })
    return () => { alive = false }
  }, [])
  const razorpayReady = !!payCfg?.enabled

  const pricing = useMemo(() => computePricing(trip, form.seats), [trip, form.seats])
  const modes = computePaymentModes(trip, { razorpayReady, total: pricing.total, payMethod })
  const { onlineAvailable, cashAvailable } = modes

  useEffect(() => {
    if (!modalOpen) return
    setForm({
      seats: 1,
      name: user?.fullName || user?.name || auth.currentUser?.displayName || '',
      travellerNotes: '',
      emergencyContact: '',
      phone: user?.phone || user?.mobile || auth.currentUser?.phoneNumber || '',
      email: user?.email || auth.currentUser?.email || '',
    })
    // Default to online when on offer; otherwise cash carries the flow.
    setPayMethod(onlineAvailable ? 'online' : (cashAvailable ? 'cash' : 'online'))
  }, [modalOpen, user?.phone, user?.mobile, user?.email, onlineAvailable, cashAvailable]) // eslint-disable-line react-hooks/exhaustive-deps

  const maxSelectableSeats = Math.min(MAX_SEATS, seatsLeft && seatsLeft > 0 ? seatsLeft : MAX_SEATS)
  const adjustSeats = (delta) => {
    setForm((prev) => {
      const next = (parseInt(prev.seats, 10) || 1) + delta
      return { ...prev, seats: Math.min(maxSelectableSeats, Math.max(1, next)) }
    })
  }
  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))

  return { form, setField, adjustSeats, pricing, modes, payMethod, setPayMethod, razorpayReady }
}
