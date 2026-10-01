import { auth } from './firebase';
import { CONFIG } from '../config';

/**
 * Firebase restores a signed-in session ASYNCHRONOUSLY after a page load, so
 * `auth.currentUser` is null for the first few hundred milliseconds even for a
 * user who is very much signed in. Reading it synchronously meant any call
 * fired from a component's mount effect went out with NO Authorization header,
 * the server answered "unauthenticated", and the caller quietly treated that
 * as a real answer - e.g. the trips admin concluding R2 was unconfigured when
 * it was perfectly configured, and never retrying because its effect ran once.
 *
 * Waiting for auth to settle first fixes every caller at once. authStateReady()
 * exists from firebase v10.1; the listener is a fallback for older versions,
 * and the timeout means a wedged auth layer degrades to an anonymous call
 * rather than hanging the UI forever.
 */
const AUTH_READY_TIMEOUT_MS = 8000;
let authReadyPromise = null;

export const waitForAuthReady = () => {
  if (authReadyPromise) return authReadyPromise;
  authReadyPromise = new Promise((resolve) => {
    let settled = false;
    const done = () => { if (!settled) { settled = true; resolve(); } };
    const timer = setTimeout(done, AUTH_READY_TIMEOUT_MS);
    const finish = () => { clearTimeout(timer); done(); };

    try {
      if (typeof auth.authStateReady === 'function') {
        auth.authStateReady().then(finish).catch(finish);
      } else {
        const unsub = auth.onAuthStateChanged(() => { unsub(); finish(); }, finish);
      }
    } catch {
      finish();
    }
  });
  return authReadyPromise;
};

/**
 * Utility to call the Cloud Run backend functions.
 * Handles authentication and onCall style data wrapping.
 */
export const callApi = async (functionName, data = {}) => {
  await waitForAuthReady();
  const user = auth.currentUser;
  const token = user ? await user.getIdToken() : null;

  // A missing/unset backend URL would make fetch hit THIS site (the static
  // frontend host), which rejects POST with 405. Fail loudly with the actual
  // cause instead of a cryptic "API Error 405".
  if (!CONFIG.BACKEND_URL || !/^https?:\/\//i.test(CONFIG.BACKEND_URL)) {
    throw new Error(
      'Backend URL is not configured. Set VITE_BACKEND_URL in the client environment (e.g. your Railway URL) and redeploy.'
    );
  }

  const url = `${CONFIG.BACKEND_URL}/${functionName}`;
  
  const headers = {
    'Content-Type': 'application/json',
  };
 
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Firebase onCall functions (or our CORS-wrapped versions) expect data in a "data" property
  const body = JSON.stringify({ data });

  const response = await fetch(url, {
    method: 'POST',
    mode: 'cors',
    headers,
    body,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    // 405 here means the POST landed on a host that only serves static files
    // (wrong/missing VITE_BACKEND_URL). 404 "Cannot POST" means the backend is
    // running an OLD build that doesn't have this route yet — redeploy it.
    if (response.status === 405 || response.status === 404) {
      throw new Error(
        `The backend rejected ${functionName} (HTTP ${response.status}). ` +
        `${response.status === 405
          ? 'The API URL is pointing at a static site — check VITE_BACKEND_URL.'
          // A 404 cuts both ways and the direction matters: either the server
          // predates this route, or THIS PAGE is a stale bundle still calling a
          // route the server has since dropped. Say both, because blaming the
          // backend alone sends people redeploying the wrong half.
          : 'Either the server predates this route, or this page is a stale build calling a route that no longer exists. Redeploy whichever side is behind — and on a phone, reload once more to clear the cached app.'}`
      );
    }
    throw new Error(errorData.error?.message || `API Error: ${response.status} ${response.statusText}`);
  }

  const result = await response.json();

  // Unwrap the result property (onCall convention). Test for the KEY, not for
  // truthiness: the server always answers { result }, so a handler that
  // legitimately resolves to false/0/null/'' used to fall through to `result`
  // and hand the caller the envelope `{ result: false }` — an object, i.e.
  // truthy — turning every "no" into a "yes".
  return result && typeof result === 'object' && 'result' in result ? result.result : result;
};

/**
 * Standard HTTP GET/POST for non-onCall endpoints (like webhooks or standard REST)
 */
export const apiRequest = async (path, options = {}) => {
  if (!CONFIG.BACKEND_URL || !/^https?:\/\//i.test(CONFIG.BACKEND_URL)) {
    throw new Error(
      'Backend URL is not configured. Set VITE_BACKEND_URL in the client environment (e.g. your Railway URL) and redeploy.'
    );
  }
  const url = `${CONFIG.BACKEND_URL}${path.startsWith('/') ? '' : '/'}${path}`;

  // Same reason as callApi above: without this the request races Firebase's
  // async session restore and goes out unauthenticated on a page load.
  await waitForAuthReady();
  const user = auth.currentUser;
  const token = user ? await user.getIdToken() : null;

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }

  return response.json();
};
