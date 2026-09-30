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

// The site owner's Firebase Auth UID. An identity, not a secret: only the
// owner of that Firebase account can sign in as it. Keep in sync with
// isRootAdminUid() in firestore.rules and ROOT_ADMIN_UID on the server.
export const ROOT_ADMIN_UID = 'wRbvUaFiBOYeXEEtF8OuXnzGWXs2';

export const CONFIG = {
  BACKEND_URL: withScheme(
    import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_BASE_URL || 'https://folk-server-main-production.up.railway.app'
  ),
  RAZORPAY_KEY: import.meta.env.VITE_RAZORPAY_KEY || import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_your_key_here', // Update with actual key in production
};
