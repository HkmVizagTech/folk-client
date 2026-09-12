// Backend URL: VITE_BACKEND_URL first, then VITE_API_BASE_URL (both naming
// conventions are accepted), falling back to the live Railway URL. If the env
// var is set to the WRONG host (e.g. this static site), POSTs fail with 405 -
// api.js detects that and shows a clear message instead of a cryptic error.
export const CONFIG = {
  BACKEND_URL: import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_BASE_URL || 'https://folkvizag-backend-production.up.railway.app',
  RAZORPAY_KEY: import.meta.env.VITE_RAZORPAY_KEY || import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_your_key_here', // Update with actual key in production
};
