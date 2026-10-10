import { useState, useEffect } from 'react'
import { useAuth } from '../../../hooks/useAuth'
import { PHONE_AUTH_ENABLED, phoneAuthErrorMessage, emailAuthErrorMessage } from '../lib/authErrors'

/** Owns every piece of state and handler behind the devotee sign-in screen. */
export const useLoginFlow = () => {
  const { loginGoogle, loginEmail, registerEmail, resetPassword, setupRecaptcha, sendOTP, verifyOTP, user, completeProfile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [selectedRole, setSelectedRole] = useState('devotee')

  const [authMethod, setAuthMethod] = useState('email') // 'email' | 'phone'
  const [isSignUp, setIsSignUp] = useState(false)
  const [isForgotPassword, setIsForgotPassword] = useState(false)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')

  const [phone, setPhone] = useState('+91')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)

  // If phone auth is switched off, never leave the UI stranded on the phone
  // form (e.g. a stale state) - fall back to email.
  useEffect(() => {
    if (!PHONE_AUTH_ENABLED && authMethod === 'phone') setAuthMethod('email')
  }, [authMethod])

  useEffect(() => {
    if (PHONE_AUTH_ENABLED && authMethod === 'phone' && !otpSent && !isForgotPassword) {
      const t = setTimeout(() => setupRecaptcha('recaptcha-container'), 500)
      return () => clearTimeout(t)
    }
  }, [authMethod, otpSent, setupRecaptcha, isForgotPassword])

  const clearNotices = () => { setError(''); setMessage('') }

  const googleAuth = async () => {
    setLoading(true); clearNotices()
    try { await loginGoogle() }
    catch (err) { setError(err.message || 'Failed to sign in with Google') }
    finally { setLoading(false) }
  }

  const emailAuth = async (e) => {
    e.preventDefault()
    if (!email || (!isForgotPassword && !password) || (!isForgotPassword && isSignUp && !name)) {
      setSubmitted(true)
      setError('Please fill in all necessary fields')
      return
    }
    setLoading(true); clearNotices()
    try {
      if (isForgotPassword) {
        await resetPassword(email)
        setMessage('Password reset link sent! Check your inbox.')
        setIsForgotPassword(false)
      } else if (isSignUp) {
        await registerEmail(email, password, name)
      } else {
        await loginEmail(email, password)
      }
    } catch (err) {
      setError(emailAuthErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const phoneAuth = async (e) => {
    e.preventDefault()
    setLoading(true); clearNotices()
    try {
      await sendOTP(phone)
      setOtpSent(true)
      setMessage('OTP sent successfully!')
    } catch (err) {
      console.error('OTP send error:', err?.code, err?.message)
      setError(phoneAuthErrorMessage(err) || 'Failed to send OTP. Try again.')
    } finally {
      setLoading(false)
      setTimeout(() => setMessage(''), 5000)
    }
  }

  const submitOTP = async (e) => {
    e.preventDefault()
    if (!otp) return
    setLoading(true); clearNotices()
    try {
      await verifyOTP(otp)
    } catch (err) {
      console.error('OTP verify error:', err?.code, err?.message)
      setError(phoneAuthErrorMessage(err) || 'Failed to verify OTP.')
    } finally {
      setLoading(false)
    }
  }

  const finishProfile = async () => {
    if (!selectedRole) return
    // Every new account starts as a Devotee - Folks Head / Admin access is
    // granted afterwards by an existing admin, not chosen here (this is
    // enforced server-side by firestore.rules regardless of what the UI sends).
    if (isSignUp && !name) {
      setError('Please provide your Full Name to complete registration.')
      return
    }
    setLoading(true)
    try {
      await completeProfile(selectedRole, name)
    } catch {
      setError('Failed to save role. Please try again.')
    } finally { setLoading(false) }
  }

  const setMode = (signUp) => { setIsSignUp(signUp); setSubmitted(false) }
  const selectMethod = (method) => {
    setAuthMethod(method)
    if (method === 'phone') setIsSignUp(false)
  }
  const openReset = () => { setIsForgotPassword(true); setSubmitted(false) }
  const closeReset = () => { setIsForgotPassword(false); clearNotices() }

  return {
    user, loading, error, message, submitted, selectedRole, setSelectedRole,
    authMethod, selectMethod, isSignUp, setMode, isForgotPassword, openReset, closeReset,
    email, setEmail, password, setPassword, name, setName,
    phone, setPhone, otp, setOtp, otpSent, backToPhone: () => setOtpSent(false),
    googleAuth, emailAuth, phoneAuth, submitOTP, finishProfile,
  }
}
