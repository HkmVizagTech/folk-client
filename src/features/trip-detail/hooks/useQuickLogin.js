import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../../../hooks/useAuth'

const last10 = (s) => s.replace(/\D/g, '').slice(-10)

/**
 * Sign-in without leaving the yatra: number, code, name. Signing in hands
 * straight over to booking (`onSignedIn`) so a WhatsApp visitor never loses the page.
 */
export const useQuickLogin = ({ open, onClose, onSignedIn }) => {
  const { user, sendOTP, verifyOTP, completeProfile } = useAuth()
  const [step, setStep] = useState('phone') // phone | code | name
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [resending, setResending] = useState(false)
  const [error, setError] = useState('')
  const [note, setNote] = useState('')
  const handedOff = useRef(false)

  useEffect(() => {
    if (!open) return
    handedOff.current = false
    setStep('phone'); setPhone(''); setCode(''); setName('')
    setError(''); setNote(''); setBusy(false)
  }, [open])

  // Signed in with a complete profile: hand straight over to booking.
  useEffect(() => {
    if (!open || handedOff.current) return
    if (user && !user.requiresRole) {
      handedOff.current = true
      onSignedIn?.()
      onClose()
    } else if (user?.requiresRole && step !== 'name') {
      setStep('name')
      setName(user.displayName || '')
    }
  }, [open, user, step, onSignedIn, onClose])

  const send = async (e) => {
    e?.preventDefault()
    const digits = last10(phone)
    if (digits.length !== 10) { setError('Enter your 10-digit mobile number.'); return }
    setBusy(true); setError(''); setNote('')
    try {
      const r = await sendOTP(`+91${digits}`)
      if (r && r.sent === false) throw new Error('The code could not be sent just now. Please try again in a moment.')
      setStep('code')
      setNote('Code sent on WhatsApp.')
    } catch (err) {
      setError(err.message || 'The code could not be sent. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  const resend = async () => {
    setResending(true); setError(''); setNote('')
    try {
      const r = await sendOTP(`+91${last10(phone)}`)
      if (r && r.sent === false) throw new Error('Could not resend just now.')
      setNote('A new code is on its way.')
    } catch (err) {
      setError(err.message || 'Could not resend the code.')
    } finally {
      setResending(false)
    }
  }

  const verify = async (e) => {
    e?.preventDefault()
    if (code.length < 6) return
    setBusy(true); setError('')
    try {
      await verifyOTP(code)
      // The handover effect takes it from here: straight to booking, or to the name step.
    } catch (err) {
      setError(err.code === 'auth/invalid-verification-code' || /invalid/i.test(err.message || '')
        ? 'That code was not right. Check it and try again.'
        : (err.message || 'Could not check that code.'))
      setBusy(false)
    }
  }

  const saveName = async (e) => {
    e?.preventDefault()
    if (!name.trim()) { setError('Please tell us your name.'); return }
    setBusy(true); setError('')
    try {
      await completeProfile('devotee', name.trim())
      handedOff.current = true
      onSignedIn?.()
      onClose()
    } catch (err) {
      setError(err.message || 'Could not save your name. Please try again.')
      setBusy(false)
    }
  }

  const changeNumber = () => { setStep('phone'); setCode(''); setError(''); setNote('') }

  return {
    step, phone, setPhone, code, setCode, name, setName, busy, resending, error, note,
    send, resend, verify, saveName, changeNumber, shownPhone: last10(phone),
  }
}
