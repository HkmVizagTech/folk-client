import React from 'react'
import { Mail, Lock, User } from 'lucide-react'
import { Button } from '../../../components/ui'
import IconInput from './IconInput'

const EmailForm = ({ flow }) => {
  const { isSignUp, name, setName, email, setEmail, password, setPassword, loading, submitted, openReset, emailAuth } = flow
  return (
    <form onSubmit={emailAuth} className="space-y-4" noValidate>
      {isSignUp && (
        <IconInput id="auth-name" icon={User} label="Full name" type="text" placeholder="Your full name" autoComplete="name"
          value={name} onChange={(e) => setName(e.target.value)} invalid={submitted && !name} />
      )}
      <IconInput id="auth-email" icon={Mail} label="Email address" type="email" placeholder="you@example.com" autoComplete="email"
        value={email} onChange={(e) => setEmail(e.target.value)} invalid={submitted && !email} />
      <IconInput id="auth-password" icon={Lock} label="Password" type="password" placeholder="Enter your password"
        autoComplete={isSignUp ? 'new-password' : 'current-password'}
        value={password} onChange={(e) => setPassword(e.target.value)} invalid={submitted && !password} />
      {!isSignUp && (
        <div className="flex justify-end">
          <button type="button" onClick={openReset} className="min-h-[32px] text-[14px] font-semibold text-saffron-dark hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron rounded">
            Forgot password?
          </button>
        </div>
      )}
      <Button type="submit" size="lg" className="w-full" loading={loading}>
        {isSignUp ? 'Create account' : 'Sign in'}
      </Button>
    </form>
  )
}

export default EmailForm
