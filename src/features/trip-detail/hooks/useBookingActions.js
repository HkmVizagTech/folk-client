import { useEffect, useState } from 'react'
import { addDoc, collection, doc, serverTimestamp, updateDoc } from '../../../lib/pgstore'
import { auth, db } from '../../../lib/firebase'
import { callApi } from '../../../lib/api'
import { openCheckout } from '../../../lib/razorpay'
import { useOptimisticMutation } from '../../../hooks/useOptimistic'
import { inr } from '../../trips/lib/format'
import { MAX_SEATS } from '../lib/pricing'

/**
 * Registering, paying and cancelling. Payment steps are never optimistic; only
 * the cancel (pending -> cancelled) is, because it rolls back cleanly.
 */
export const useBookingActions = ({
  trip, slug, user, form, pricing, modes, seatsLeft, myRegistration, modalOpen, closeModal, setNotice, setCancelledId,
}) => {
  const { seats, total, payNow } = pricing
  const [submitting, setSubmitting] = useState(null) // 'pay' | 'cash' | 'later' | null
  const [formError, setFormError] = useState('')
  const [payingExisting, setPayingExisting] = useState(false)
  const cancel = useOptimisticMutation()

  useEffect(() => { if (modalOpen) setFormError('') }, [modalOpen])

  // Shape matched to the deployed rules. No `cashCollected` / paid flag is
  // written here: staff own those fields, so setting them would forge a payment.
  const createRegistration = (paymentMode) => addDoc(collection(db, 'trip_registrations'), {
    tripId: trip.id,
    tripSlug: trip.slug || slug || '',
    tripTitle: trip.title || '',
    userId: user.uid,
    userName: (form.name || '').trim() || user.fullName || user.name || auth.currentUser?.displayName || 'Devotee',
    userPhone: (form.phone || '').trim(),
    userEmail: (form.email || '').trim(),
    seats,
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

  /** Opens Razorpay; the server confirms both the payment and the seat. */
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
      setNotice({ tone: 'success', text: 'Payment received and your seat is confirmed. Hare Krishna! The yatra team will be in touch with the details.' })
    } else {
      setNotice({ tone: 'warn', text: 'Payment not completed. Your seat is held for now. Tap "Pay now" to finish.' })
    }
  }

  /** mode: 'pay' (Razorpay now) | 'cash' (pay at the office) | 'later' */
  const register = async (mode) => {
    if (!user || !trip || submitting) return
    if (seats < 1 || seats > MAX_SEATS) {
      setFormError(`You can book between 1 and ${MAX_SEATS} seats in one registration.`)
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
      regRef = await createRegistration(mode === 'cash' ? 'cash' : 'online')

      if (mode === 'cash') {
        // No Razorpay call. The seat stays pending until staff mark the cash collected.
        closeModal()
        setNotice({
          tone: 'success',
          text: `Seat reserved for ${seats} traveller${seats === 1 ? '' : 's'}. Please pay ${inr(payNow)} in cash at the FOLK office. Your seat is confirmed by the yatra team once the cash is received.${trip.contactPhone ? ` Questions? Call or WhatsApp ${trip.contactPhone}.` : ''}`,
        })
        return
      }

      if (mode === 'later') {
        closeModal()
        setNotice({
          tone: 'success',
          text: modes.onlineAvailable
            ? 'Seat reserved. The yatra team will confirm and collect the payment. You can pay online any time from this page.'
            : `Seat reserved. Your registration is pending: the yatra team will confirm it and arrange payment with you.${trip.contactPhone ? ` Call or WhatsApp ${trip.contactPhone}.` : ''}`,
        })
        return
      }

      const order = await callApi('createOrder', { amount: payNow, eventId: trip.id })
      if (!order || !order.id) throw new Error('The payment order could not be created. Please try again.')

      // Persist the pointer BEFORE checkout opens, so it survives the user closing the modal.
      await updateDoc(regRef, { paymentOrderId: order.id, updatedAt: serverTimestamp() })

      closeModal()
      await runCheckout(order, seats)
    } catch (error) {
      console.error('Trip registration error:', error)
      if (regRef) {
        closeModal()
        setNotice({ tone: 'warn', text: `Your seat is reserved, but the payment could not start: ${error.message} You can pay from this page later.` })
      } else {
        setFormError(error.message || 'Something went wrong. Please try again.')
      }
    } finally {
      setSubmitting(null)
    }
  }

  /** Finish paying for a seat that was booked but never paid for. */
  const payExisting = async () => {
    if (!myRegistration || payingExisting) return
    setPayingExisting(true)
    setNotice(null)
    try {
      const order = await callApi('createOrder', { tripRegistrationId: myRegistration.id })
      if (!order?.id) throw new Error('The payment could not be started. Please try again.')
      await runCheckout(order, parseInt(myRegistration.seats, 10) || 1)
    } catch (error) {
      setNotice({ tone: 'warn', text: error.message || 'The payment could not be started. Please try again.' })
    } finally {
      setPayingExisting(false)
    }
  }

  const cancelRegistration = () => {
    if (!myRegistration || cancel.pending) return Promise.resolve()
    const id = myRegistration.id
    return cancel.run({
      optimistic: () => setCancelledId(id),
      // Rules allow exactly these two fields, and only from 'pending'.
      commit: async () => {
        await updateDoc(doc(db, 'trip_registrations', id), { status: 'cancelled', updatedAt: serverTimestamp() })
        setNotice({ tone: 'info', text: 'Your registration has been cancelled.' })
      },
      rollback: () => setCancelledId(null),
      onError: (error) => {
        console.error('Error cancelling registration:', error)
        setNotice({ tone: 'warn', text: `Could not cancel: ${error.message}` })
      },
    })
  }

  return {
    submitting, formError, register,
    payingExisting, payExisting,
    cancelling: cancel.pending, cancelRegistration,
  }
}
