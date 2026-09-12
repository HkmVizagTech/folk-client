// Central runtime configuration.
//
// Backend URL precedence: VITE_BACKEND_URL, then VITE_API_BASE_URL (both naming
// conventions are accepted), falling back to the live Railway URL. If the env
// var points at the WRONG host (e.g. this static site), POSTs fail with 405 —
// api.js detects that and shows a clear message instead of a cryptic error.
const withScheme = (url) => {
  const raw = (url || '').trim().replace(/\/+$/, '');
  if (!raw) return '';
  // Tolerate values pasted without a scheme (e.g. "folkvizag-backend-production
  // .up.railway.app" or "://host"): without https:// fetch treats the value as
  // a relative path and POSTs to this site itself (405).
  if (/^https?:\/\//i.test(raw)) return raw;
  return `https://${raw.replace(/^:\/*/, '')}`;
};

export const CONFIG = {
  BACKEND_URL: withScheme(
    import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_BASE_URL || 'https://folkvizag-backend-production.up.railway.app'
  ),
  RAZORPAY_KEY: import.meta.env.VITE_RAZORPAY_KEY || import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_your_key_here', // Update with actual key in production
};
