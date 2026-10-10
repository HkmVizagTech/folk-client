import React from 'react'
import { Mail, ArrowLeft } from 'lucide-react'
import { Button } from '../../../components/ui'
import IconInput from './IconInput'

const ResetForm = ({ flow }) => {
  const { email, setEmail, loading, submitted, emailAuth, closeReset } = flow
  return (
    <form onSubmit={emailAuth} className="space-y-4" noValidate>
      <div>
        <h2 className="font-display text-[20px] font-semibold text-ink">Reset password</h2>
        <p className="mt-1 text-[14px] text-ink-muted">Enter your email and we&apos;ll send you a link to reset your password.</p>
      </div>
      <IconInput id="reset-email" icon={Mail} label="Email address" type="email" placeholder="you@example.com" autoComplete="email"
        value={email} onChange={(e) => setEmail(e.target.value)} invalid={submitted && !email} />
      <Button type="submit" size="lg" className="w-full" loading={loading}>Send reset link</Button>
      <Button type="button" variant="ghost" className="w-full" onClick={closeReset}>
        <ArrowLeft size={16} aria-hidden="true" /> Back to sign in
      </Button>
    </form>
  )
}

export default ResetForm
