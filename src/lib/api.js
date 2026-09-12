import { auth } from './firebase';
import { CONFIG } from '../config';

/**
 * Utility to call the Cloud Run backend functions.
 * Handles authentication and onCall style data wrapping.
 */
export const callApi = async (functionName, data = {}) => {
  const user = auth.currentUser;
  const token = user ? await user.getIdToken() : null;

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
