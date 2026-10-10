import React from 'react'
import { ShieldCheck, Lock, Mail, ArrowRight, ArrowLeft } from 'lucide-react'
import { Button } from '../../components/ui'
import { useAdminLogin } from './hooks/useAdminLogin'
import AuthShell from './components/AuthShell'
import AuthAlert from './components/AuthAlert'
import IconInput from './components/IconInput'
import GoogleButton from './components/GoogleButton'

/**
 * Dedicated sign-in screen for administrators at /admin. Email/username +
 * password (or Google). Non-admin credentials still sign in at the Firebase
 * level; App.jsx then shows the access notice instead of the dashboard.
 */
const AdminLogin = () => {
  const { email, setEmail, password, setPassword, loading, error, message, isForgot, submitted, openForgot, closeForgot, googleAuth, submit } = useAdminLogin()

  return (
    <AuthShell
      variant="admin"
      badge={<ShieldCheck size={24} aria-hidden="true" />}
      title="Administrator"
      description="FOLK Vizag control portal. Sign in to manage the community."
      footer={(
        <>
          <p>Restricted area. Administrator credentials are required - unauthorized access attempts are logged and reviewed.</p>
          <a href="/" className="mt-3 inline-flex min-h-[44px] items-center gap-1.5 font-semibold text-saffron-dark hover:underline">
            <ArrowLeft size={14} aria-hidden="true" /> Member sign-in
          </a>
        </>
      )}
    >
      <AuthAlert error={error} message={message} />
      <form onSubmit={submit} className="space-y-4" noValidate>
        <IconInput id="admin-email" icon={Mail} label="Username or email" type="text" required autoComplete="username" inputMode="email"
          placeholder="admin or admin@folkvizag.app" value={email} onChange={(e) => setEmail(e.target.value)} invalid={submitted && !email} />
        {!isForgot && (
          <>
            <IconInput id="admin-password" icon={Lock} label="Password" type="password" required autoComplete="current-password"
              placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} invalid={submitted && !password} />
            <div className="flex justify-end">
              <button type="button" onClick={openForgot} className="min-h-[32px] rounded text-[14px] font-semibold text-saffron-dark hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron">
                Forgot password?
              </button>
            </div>
          </>
        )}
        <Button type="submit" size="lg" className="w-full" loading={loading}>
          {isForgot ? 'Send reset link' : <>Enter control portal <ArrowRight size={18} aria-hidden="true" /></>}
        </Button>
        {isForgot && <Button type="button" variant="ghost" className="w-full" onClick={closeForgot}>Back to sign in</Button>}
      </form>
      {!isForgot && <GoogleButton onClick={googleAuth} disabled={loading} />}
    </AuthShell>
  )
}

export default AdminLogin
