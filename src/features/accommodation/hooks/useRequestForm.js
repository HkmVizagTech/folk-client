import { useEffect, useRef, useState } from 'react'
import { db } from '../../../lib/firebase'
// Postgres-backed shim, NOT the real Firebase SDK (see useFirestore).
import { collection, addDoc, serverTimestamp } from '../../../lib/pgstore'
import { emptyRequest } from '../lib/accommodation'

export const useRequestForm = (user) => {
  const [form, setForm] = useState(emptyRequest)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const timer = useRef(null)

  useEffect(() => () => clearTimeout(timer.current), [])

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }))

  const submit = async (e) => {
    e.preventDefault()
    if (!user) return
    setError('')
    setSent(false)

    const guestCount = parseInt(form.guestCount, 10)
    if (!Number.isInteger(guestCount) || guestCount < 1) {
      setError('Please enter how many guests are coming (at least 1).')
      return
    }
    // A stay that ends before it starts is always a typo.
    if (form.departureDate < form.arrivalDate) {
      setError('The departure date must be on or after the arrival date.')
      return
    }

    setSubmitting(true)
    try {
      await addDoc(collection(db, 'accommodation_requests'), {
        ...form,
        guestCount,
        userId: user.uid,
        userName: user.name || user.displayName || 'Devotee',
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      setForm(emptyRequest())
      setSent(true)
      timer.current = setTimeout(() => setSent(false), 4000)
    } catch (err) {
      console.error('Error submitting request:', err)
      setError(err?.message || 'Could not send your request. Please check your connection and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return { form, set, submit, submitting, error, sent }
}
