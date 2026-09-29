import React, { useState, useEffect } from 'react';
import { Mail, ArrowRight, CheckCircle2, Lock, User, Phone, Key, RefreshCw } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { auth } from '../lib/firebase';

// Administrators signing in here are let in (App.jsx lands staff on the
// Command Center at "/"). This page used to sign admins straight back out,
// which on a trip page looked like "I signed in and it asks me to sign in
// again": the app remounted onto the public trip before the error could show.

// Friendly text for Google sign-in failures that aren't the user's fault.
const googleErrorMessage = (err) => {
  switch (err?.code) {
    case 'auth/unauthorized-domain':
      return 'Google sign-in is not enabled for this web address yet. Please sign in with Phone (WhatsApp OTP) or email for now.';
    case 'auth/popup-blocked':
      return 'Your browser blocked the Google sign-in window. Allow pop-ups for this site, or sign in with Phone (WhatsApp OTP).';
    case 'auth/operation-not-supported-in-this-environment':
    case 'auth/web-storage-unsupported':
      return 'Google sign-in does not work in this browser (for example inside WhatsApp or Instagram). Open the link in Chrome or Safari, or sign in with Phone (WhatsApp OTP).';
    case 'auth/network-request-failed':
      return 'Network problem while signing in. Check your connection and try again.';
    default:
      return err?.message || 'Failed to sign in with Google';
  }
};

// Phone OTP now goes through Flaxxa WAPI on the backend, keeping the
// project on the Firebase free (Spark) tier — no billing required.
// Set to false only if you want to hide the Phone tab entirely.
const PHONE_AUTH_ENABLED = true;

const Login = () => {
  const { loginGoogle, loginEmail, registerEmail, resetPassword, sendOTP, verifyOTP, user, completeProfile, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [selectedRole, setSelectedRole] = useState('devotee');
  
  // Auth Modes
  const [authMethod, setAuthMethod] = useState(PHONE_AUTH_ENABLED ? 'phone' : 'email'); // 'email' | 'phone'
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  
  // Email Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  // Phone Form States
  const [phone, setPhone] = useState('+91');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  // If phone auth is switched off, never leave the UI stranded on the phone
  // form (e.g. a stale state) - fall back to email.
  useEffect(() => {
    if (!PHONE_AUTH_ENABLED && authMethod === 'phone') setAuthMethod('email');
  }, [authMethod]);

  const handleGoogleAuth = async () => {
    setLoading(true); setError(''); setMessage('');
    try {
      await loginGoogle();
    }
    catch (err) {
      // Closing the Google window yourself isn't an error worth showing.
      if (err.code !== 'auth/popup-closed-by-user' && err.code !== 'auth/cancelled-popup-request') {
        setError(googleErrorMessage(err));
      }
    }
    finally { setLoading(false); }
  };

  const toEmail = (value) => value.includes('@') ? value : `${value.trim().toLowerCase()}@folkvizag.app`;

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    if (!email || (!isForgotPassword && !password) || (!isForgotPassword && isSignUp && !name)) {
      setError('Please fill in all necessary fields');
      return;
    }
    setLoading(true); setError(''); setMessage('');
    try {
      if (isForgotPassword) {
        await resetPassword(toEmail(email));
        setMessage('Password reset link sent! Check your inbox.');
        setIsForgotPassword(false);
      } else if (isSignUp) {
        await registerEmail(toEmail(email), password, name);
      } else {
        await loginEmail(toEmail(email), password);
      }
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') setError('Email already in use. Please sign in instead.');
      else if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') setError('Invalid email or password.');
      else if (err.code === 'auth/weak-password') setError('Password should be at least 6 characters.');
      else setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneAuth = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setMessage('');
    try {
      const result = await sendOTP(phone);
      if (result && result.sent === false) {
        throw new Error('Could not send the OTP right now. Please try again in a moment.');
      }
      setOtpSent(true);
      setMessage('OTP sent to your WhatsApp!');
    } catch (err) {
      console.error('OTP send error:', err);
      setError(err.message || 'Failed to send OTP. Try again.');
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(''), 5000);
    }
  };

  const handleResendOTP = async () => {
    setResendLoading(true); setError(''); setMessage('');
    try {
      const result = await sendOTP(phone);
      if (result && result.sent === false) {
        throw new Error('Could not resend the OTP right now. Please try again in a moment.');
      }
      setMessage('New OTP sent to your WhatsApp!');
    } catch (err) {
      console.error('OTP resend error:', err);
      setError(err.message || 'Failed to resend OTP. Try again.');
    } finally {
      setResendLoading(false);
      setTimeout(() => setMessage(''), 5000);
    }
  };

  const submitOTP = async (e) => {
    e.preventDefault();
    if (!otp) return;
    setLoading(true); setError(''); setMessage('');
    try {
      await verifyOTP(otp);
    } catch (err) {
      console.error('OTP verify error:', err);
      if (err.code === 'auth/invalid-verification-code') setError('Invalid OTP. Please check and try again.');
      else setError(err.message || 'Failed to verify OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteProfile = async () => {
    if (!selectedRole) return;

    // Every new account starts as a Devotee - Folks Head / Admin access is
    // granted afterwards by an existing admin, not chosen here (this is
    // enforced server-side by firestore.rules regardless of what the UI sends).
    // Phone sign-ups have no name on the account yet, so the name is
    // required here unless the account already carries one (Google/email).
    const finalName = (name || user?.displayName || '').trim();
    if (!finalName) {
      setError('Please enter your full name.');
      return;
    }
    if (finalName.length > 80) {
      setError('That name is too long. Please use up to 80 characters.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await completeProfile(selectedRole, finalName);
    } catch (err) {
      setError('Could not save your profile. Please try again.');
    } finally { setLoading(false); }
  };

  // Firebase has accepted the sign-in but the profile is still loading.
  // Without this the form reappears for a moment, which looks like the login
  // didn't work. AuthContext always resolves `user` after a sign-in, so this
  // can't spin forever.
  if (!user && auth.currentUser) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 border-4 border-saffron border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-bold text-gray-500">Signing you in…</p>
      </div>
    );
  }

  const fieldWrap = "relative flex items-center bg-white border border-line rounded-md focus-within:border-navy focus-within:ring-2 focus-within:ring-navy/15";
  const fieldInput = "w-full h-12 pl-11 pr-3 bg-transparent outline-none text-[16px] text-ink placeholder:text-ink-muted/70";
  const fieldIcon = "absolute left-3.5 text-ink-muted";
  const Spinner = () => <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" aria-hidden="true" />;
  const tabBtn = (on) => `flex-1 h-10 inline-flex items-center justify-center gap-2 rounded text-[14px] font-semibold ${on ? 'bg-white text-ink shadow-card' : 'text-ink-muted hover:text-ink'}`;

  return (
    <div className="min-h-screen bg-paper lg:grid lg:grid-cols-2">
      {/* Left: brand panel (desktop) / slim header (mobile) */}
      <aside className="bg-ink text-white px-6 py-6 lg:px-14 lg:py-12 flex lg:flex-col justify-between gap-6">
        <a href="/" className="flex items-center gap-3" aria-label="FOLK Vizag home">
          <img src="/folk_logo_white.png" alt="" className="h-10 lg:h-14 w-auto" />
          <span className="leading-tight">
            <span className="block font-display text-[13px] lg:text-[15px] font-bold">FOLK Vizag</span>
            <span className="block text-[12px] lg:text-[13px] text-white/60">Youth Empowerment Club</span>
          </span>
        </a>
        <div className="hidden lg:block max-w-md">
          <p className="kicker text-marigold">Members</p>
          <h1 className="display-lg mt-3 text-white">Your FOLK, in one place.</h1>
          <ul className="mt-8 space-y-3 text-white/75 text-[16px]">
            {['RSVP to programs and check in with your QR', 'Book yatras and pay online', 'Track your chanting and sadhana', 'Stay in touch with your FOLK guide'].map((t) => (
              <li key={t} className="flex gap-3"><CheckCircle2 size={19} className="mt-0.5 text-saffron shrink-0" aria-hidden="true" />{t}</li>
            ))}
          </ul>
        </div>
        <p className="hidden lg:block text-[13px] text-white/45">Hare Krishna Movement, Visakhapatnam</p>
      </aside>

      {/* Right: form */}
      <main className="flex items-start lg:items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-[420px]">
          {error && (
            <div role="alert" className="mb-5 flex gap-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-[15px] text-red-700">
              <span className="mt-1.5 w-2 h-2 rounded-full bg-red-600 shrink-0" aria-hidden="true" />{error}
            </div>
          )}
          {message && !error && (
            <div role="status" className="mb-5 flex gap-3 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-[15px] text-green-800">
              <CheckCircle2 size={18} className="mt-0.5 shrink-0" aria-hidden="true" />{message}
            </div>
          )}

          {user?.requiresRole ? (
            <section className="card p-6 sm:p-8">
              <h2 className="display-md">Welcome to FOLK Vizag</h2>
              <p className="mt-1.5 text-ink-muted">Tell us your name to finish setting up your account.</p>
              <label className="block mt-6">
                <span className="block mb-1.5 text-[14px] font-semibold">Full name</span>
                <div className={fieldWrap}>
                  <User className={fieldIcon} size={19} aria-hidden="true" />
                  <input
                    type="text"
                    autoComplete="name"
                    placeholder="e.g. Ravi Kumar"
                    value={name || (user?.displayName || '')}
                    onChange={(e) => setName(e.target.value)}
                    className={fieldInput}
                  />
                </div>
              </label>
              <button type="button" disabled={loading} onClick={handleCompleteProfile} className="btn-primary w-full mt-6">
                {loading ? <Spinner /> : <>Continue <ArrowRight size={17} /></>}
              </button>
              <p className="mt-4 text-[13px] text-ink-muted">New accounts start as members. FOLK guide and admin access is given by the team.</p>
            </section>
          ) : (
            <section className="card p-6 sm:p-8">
              {!otpSent && !isForgotPassword && (
                <>
                  <h2 className="display-md">{isSignUp ? 'Create your account' : 'Sign in'}</h2>
                  <p className="mt-1.5 text-ink-muted">
                    {isSignUp ? 'Already a member?' : 'New to FOLK?'}{' '}
                    <button type="button" onClick={() => { setIsSignUp(!isSignUp); setError(''); }} className="font-semibold text-saffron hover:underline">
                      {isSignUp ? 'Sign in' : 'Create an account'}
                    </button>
                  </p>
                  {PHONE_AUTH_ENABLED && (
                    <div className="mt-6 flex p-1 bg-paper rounded-md" role="tablist" aria-label="Sign-in method">
                      <button type="button" role="tab" aria-selected={authMethod === 'phone'} onClick={() => setAuthMethod('phone')} className={tabBtn(authMethod === 'phone')}>
                        <Phone size={16} aria-hidden="true" /> Phone
                      </button>
                      <button type="button" role="tab" aria-selected={authMethod === 'email'} onClick={() => setAuthMethod('email')} className={tabBtn(authMethod === 'email')}>
                        <Mail size={16} aria-hidden="true" /> Email
                      </button>
                    </div>
                  )}
                </>
              )}

              <div className="mt-6">
                {isForgotPassword ? (
                  <form onSubmit={handleEmailAuth} className="space-y-4">
                    <h2 className="display-md">Reset password</h2>
                    <p className="text-ink-muted">We&apos;ll email you a link to set a new password.</p>
                    <div className={fieldWrap}>
                      <Mail className={fieldIcon} size={19} aria-hidden="true" />
                      <input type="email" autoComplete="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} className={fieldInput} />
                    </div>
                    <button disabled={loading} type="submit" className="btn-primary w-full">{loading ? <Spinner /> : 'Send reset link'}</button>
                    <button type="button" onClick={() => { setIsForgotPassword(false); setError(''); setMessage(''); }} className="w-full h-10 text-[14px] font-semibold text-ink-muted hover:text-ink">Back to sign in</button>
                  </form>
                ) : authMethod === 'email' ? (
                  <form onSubmit={handleEmailAuth} className="space-y-4">
                    {isSignUp && (
                      <div className={fieldWrap}>
                        <User className={fieldIcon} size={19} aria-hidden="true" />
                        <input type="text" autoComplete="name" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} className={fieldInput} />
                      </div>
                    )}
                    <div className={fieldWrap}>
                      <Mail className={fieldIcon} size={19} aria-hidden="true" />
                      <input type="email" autoComplete="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} className={fieldInput} />
                    </div>
                    <div className={fieldWrap}>
                      <Lock className={fieldIcon} size={19} aria-hidden="true" />
                      <input type="password" autoComplete={isSignUp ? 'new-password' : 'current-password'} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className={fieldInput} />
                    </div>
                    {!isSignUp && (
                      <div className="flex justify-end">
                        <button type="button" onClick={() => setIsForgotPassword(true)} className="text-[14px] font-semibold text-saffron hover:underline">Forgot password?</button>
                      </div>
                    )}
                    <button disabled={loading} type="submit" className="btn-dark w-full">{loading ? <Spinner /> : (isSignUp ? 'Create account' : 'Sign in')}</button>
                  </form>
                ) : !otpSent ? (
                  <form onSubmit={handlePhoneAuth} className="space-y-4">
                    <label className="block">
                      <span className="block mb-1.5 text-[14px] font-semibold">Mobile number</span>
                      <div className={fieldWrap}>
                        <Phone className={fieldIcon} size={19} aria-hidden="true" />
                        <input type="tel" inputMode="tel" autoComplete="tel" placeholder="+91 98765 43210" value={phone} onChange={(e) => setPhone(e.target.value)} className={fieldInput} />
                      </div>
                    </label>
                    <p className="text-[14px] text-ink-muted">We&apos;ll send a 6-digit code to this number on WhatsApp.</p>
                    <button disabled={loading} type="submit" className="btn-dark w-full">{loading ? <Spinner /> : 'Send code on WhatsApp'}</button>
                  </form>
                ) : (
                  <form onSubmit={submitOTP} className="space-y-4">
                    <h2 className="display-md">Enter the code</h2>
                    <p className="text-ink-muted">Sent on WhatsApp to <span className="font-semibold text-ink">{phone}</span></p>
                    <div className={fieldWrap}>
                      <Key className={fieldIcon} size={19} aria-hidden="true" />
                      <input
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        pattern="[0-9]*"
                        placeholder="6-digit code"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        className={`${fieldInput} tracking-[0.3em] font-semibold`}
                        maxLength={6}
                        autoFocus
                      />
                    </div>
                    <button disabled={loading || otp.length < 6} type="submit" className="btn-primary w-full">{loading ? <Spinner /> : 'Verify & sign in'}</button>
                    <div className="flex items-center justify-between text-[14px]">
                      <button type="button" disabled={resendLoading} onClick={handleResendOTP} className="font-semibold text-saffron hover:underline disabled:opacity-50 inline-flex items-center gap-1.5">
                        <RefreshCw size={14} className={resendLoading ? 'animate-spin' : ''} aria-hidden="true" /> Resend code
                      </button>
                      <button type="button" onClick={() => { setOtpSent(false); setOtp(''); }} className="font-semibold text-ink-muted hover:text-ink">Change number</button>
                    </div>
                  </form>
                )}
              </div>

              {!otpSent && !isForgotPassword && (
                <>
                  <div className="my-6 flex items-center gap-3 text-[13px] text-ink-muted">
                    <span className="h-px flex-1 bg-line" /> or <span className="h-px flex-1 bg-line" />
                  </div>
                  <button type="button" onClick={handleGoogleAuth} disabled={loading} className="w-full h-12 inline-flex items-center justify-center gap-3 rounded-md border border-line bg-white font-semibold text-ink hover:bg-paper disabled:opacity-50">
                    <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" aria-hidden="true">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Continue with Google
                  </button>
                </>
              )}
            </section>
          )}

          <p className="mt-6 text-center text-[14px]">
            <a href="/" className="font-semibold text-ink-muted hover:text-ink">← Back to folkvizag.org</a>
          </p>
        </div>
      </main>
    </div>
  );
};

export default Login;
