import React from 'react'
import { Phone, Key, User } from 'lucide-react'
import { Button } from '../../../components/ui'
import IconInput from './IconInput'

const PhoneForm = ({ flow }) => {
  const { isSignUp, name, setName, phone, setPhone, otp, setOtp, otpSent, loading, phoneAuth, submitOTP, backToPhone } = flow

  if (otpSent) {
    return (
      <form onSubmit={submitOTP} className="space-y-4">
        <p className="text-center text-[14px] text-ink-muted">Code sent to <span className="font-semibold text-ink">{phone}</span></p>
        <IconInput id="auth-otp" icon={Key} label="One-time code" type="text" inputMode="numeric" autoComplete="one-time-code"
          placeholder="Enter 6-digit OTP" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value)} />
        <Button type="submit" size="lg" className="w-full" loading={loading} disabled={otp.length < 6}>Verify code</Button>
        <Button type="button" variant="ghost" className="w-full" onClick={backToPhone}>Change phone number</Button>
      </form>
    )
  }

  return (
    <form onSubmit={phoneAuth} className="space-y-4">
      {isSignUp && (
        <IconInput id="auth-phone-name" icon={User} label="Full name" type="text" placeholder="Your full name" autoComplete="name"
          value={name} onChange={(e) => setName(e.target.value)} />
      )}
      <IconInput id="auth-phone" icon={Phone} label="Phone number" type="tel" placeholder="+91 9876543210" autoComplete="tel"
        value={phone} onChange={(e) => setPhone(e.target.value)} />
      <div id="recaptcha-container" className="flex justify-center" />
      <Button type="submit" size="lg" className="w-full" loading={loading}>{isSignUp ? 'Sign up with OTP' : 'Send OTP'}</Button>
    </form>
  )
}

export default PhoneForm
