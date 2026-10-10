import { useState } from 'react'
import { useAuth } from '../../../hooks/useAuth'
import { adminAuthErrorMessage, toAdminEmail } from '../lib/authErrors'

/**
 * State + handlers for /admin sign-in. Email/username + password, or Google
 * for administrators who have no password. App.jsx routes by role after.
 */
export const useAdminLogin = () => {
  const { loginEmail, loginGoogle, resetPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [isForgot, setIsForgot] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const clearNotices = () => { setError(''); setMessage('') }

  const googleAuth = async () => {
    setLoading(true); clearNotices()
    try { await loginGoogle() }
    catch (err) { setError(err.message || 'Google sign-in failed. Please try again.') }
    finally { setLoading(false) }
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!email || (!password && !isForgot)) {
      setSubmitted(true)
      setError('Please fill in all fields.')
      return
    }
    setLoading(true); clearNotices()
    try {
      if (isForgot) {
        await resetPassword(toAdminEmail(email))
        setMessage('Password reset link sent. Check your inbox.')
        setIsForgot(false)
      } else {
        // Accept either the shared username ("admin") or a full email address.
        await loginEmail(toAdminEmail(email), password)
      }
    } catch (err) {
      setError(adminAuthErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const openForgot = () => { setIsForgot(true); setSubmitted(false); clearNotices() }
  const closeForgot = () => { setIsForgot(false); clearNotices() }

  return { email, setEmail, password, setPassword, loading, error, message, isForgot, submitted, openForgot, closeForgot, googleAuth, submit }
}
