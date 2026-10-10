import React from 'react'
import { Mail, Phone } from 'lucide-react'
import { useLoginFlow } from './hooks/useLoginFlow'
import { PHONE_AUTH_ENABLED } from './lib/authErrors'
import AuthShell from './components/AuthShell'
import AuthAlert from './components/AuthAlert'
import Segmented from './components/Segmented'
import GoogleButton from './components/GoogleButton'
import EmailForm from './components/EmailForm'
import PhoneForm from './components/PhoneForm'
import ResetForm from './components/ResetForm'
import ProfileStep from './components/ProfileStep'

const METHODS = [
  { id: 'email', label: 'Email', icon: Mail },
  { id: 'phone', label: 'Phone', icon: Phone },
]
const MODES = [
  { id: 'login', label: 'Log in' },
  { id: 'signup', label: 'Sign up' },
]

const Login = () => {
  const flow = useLoginFlow()
  const { user, error, message, authMethod, selectMethod, isSignUp, setMode, isForgotPassword, otpSent, loading, googleAuth } = flow

  if (user?.requiresRole) {
    return (
      <AuthShell title="Welcome, Devotee" description="Confirm your account to continue your journey.">
        <AuthAlert error={error} message={message} />
        <ProfileStep flow={flow} />
      </AuthShell>
    )
  }

  const showChooser = !otpSent && !isForgotPassword
  const form = isForgotPassword ? <ResetForm flow={flow} /> : authMethod === 'email' ? <EmailForm flow={flow} /> : <PhoneForm flow={flow} />

  return (
    <AuthShell
      title={isSignUp ? 'Create your account' : 'Welcome back'}
      description={isSignUp ? 'Join the FOLK Vizag devotee community.' : 'Sign in to continue your spiritual journey.'}
      footer={<>Access is governed by our <span className="font-semibold text-saffron-dark">Privacy Terms</span> and <span className="font-semibold text-saffron-dark">Ethical Guidelines</span>.</>}
    >
      <AuthAlert error={error} message={message} />
      {showChooser && (
        <div className="mb-5 space-y-3">
          {PHONE_AUTH_ENABLED && <Segmented label="Sign-in method" items={METHODS} value={authMethod} onChange={selectMethod} />}
          <Segmented label="Account mode" items={MODES} value={isSignUp ? 'signup' : 'login'} onChange={(id) => setMode(id === 'signup')} />
        </div>
      )}
      {form}
      {showChooser && <GoogleButton onClick={googleAuth} disabled={loading} />}
    </AuthShell>
  )
}

export default Login
