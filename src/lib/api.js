import { auth } from './firebase';
import { CONFIG } from '../config';

/**
 * Utility to call the Cloud Run backend functions.
 * Handles authentication and onCall style data wrapping.
 */
export const callApi = async (functionName, data = {}) => {
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
          : 'The server is running an outdated build without this route — redeploy the backend.'}`
      );
    }
    throw new Error(errorData.error?.message || `API Error: ${response.status} ${response.statusText}`);
  }

  const result = await response.json();
  
  // Unwrap the result property (onCall convention)
  return result.result || result;
};

/**
 * Standard HTTP GET/POST for non-onCall endpoints (like webhooks or standard REST)
 */
export const apiRequest = async (path, options = {}) => {
  const url = `${CONFIG.BACKEND_URL}${path.startsWith('/') ? '' : '/'}${path}`;
  
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
