// Firebase phone / OTP sign-in sends verification SMS, and Firebase only
// allows that on the paid Blaze plan - on the free Spark plan every attempt
// fails with `auth/billing-not-enabled` no matter what the code does.
// Set this to false to hide the Phone tab entirely (devotees then use Email
// or Google, both of which work on the free plan); set it back to true once
// the Firebase project is on Blaze.
export const PHONE_AUTH_ENABLED = true

// Firebase surfaces these as raw strings like
// "Firebase: Error (auth/billing-not-enabled)." - never show that to a
// devotee. Map the ones that actually happen to plain language.
export const phoneAuthErrorMessage = (err) => {
  switch (err?.code) {
    case 'auth/invalid-phone-number':
      return 'Invalid phone number format. Include country code (e.g. +91).'
    case 'auth/billing-not-enabled':
    case 'auth/operation-not-allowed':
      return 'Phone sign-in is not available right now. Please use Email or Google to continue.'
    case 'auth/too-many-requests':
    case 'auth/quota-exceeded':
      return 'Too many attempts from this number. Please wait a few minutes and try again.'
    case 'auth/captcha-check-failed':
      return 'Verification check failed. Please refresh the page and try again.'
    case 'auth/invalid-verification-code':
      return 'Invalid OTP. Please check and try again.'
    case 'auth/code-expired':
      return 'That OTP has expired. Request a new one.'
    default:
      return null
  }
}

export const emailAuthErrorMessage = (err) => {
  if (err.code === 'auth/email-already-in-use') return 'Email already in use. Please sign in instead.'
  if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') return 'Invalid email or password.'
  if (err.code === 'auth/weak-password') return 'Password should be at least 6 characters.'
  return err.message || 'Authentication failed. Please try again.'
}

export const adminAuthErrorMessage = (err) => {
  if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
    return 'Invalid administrator credentials. If the shared admin login was never created, sign in with the site owner’s account first (Google works too) and use “Create / Reset Admin Login” in the Command Center to set its password.'
  }
  if (err.code === 'auth/too-many-requests') return 'Too many attempts. Please wait and try again.'
  return err.message || 'Sign-in failed. Please try again.'
}

export const toAdminEmail = (value) => (value.includes('@') ? value : `${value.trim().toLowerCase()}@folkvizag.app`)
