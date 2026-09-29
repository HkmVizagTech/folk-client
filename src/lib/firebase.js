import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFunctions } from "firebase/functions";
import { getAnalytics } from "firebase/analytics";
import { getStorage } from "firebase/storage";

// Development only: http://localhost:3001/?emulator=1 signs in against the
// local Firebase Auth emulator (:9099, fake "demo-folk" project) instead of
// production; pair it with a local server (VITE_BACKEND_URL). Remembered for the browser tab. Vite
// compiles this away in production builds (import.meta.env.DEV is false).
const USE_EMULATOR = (() => {
  if (!import.meta.env.DEV || typeof window === 'undefined') return false;
  if (!/^(localhost|127\.0\.0\.1)$/.test(window.location.hostname)) return false;
  try {
    const flag = new URLSearchParams(window.location.search).get('emulator');
    if (flag === '1') sessionStorage.setItem('use_emulator', '1');
    if (flag === '0') sessionStorage.removeItem('use_emulator');
    return sessionStorage.getItem('use_emulator') === '1';
  } catch {
    return false;
  }
})();

// Firebase configuration (override via VITE_FIREBASE_* env vars, e.g. in Vercel)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyB8UsgVIkTss7yZ_fKyDVIoykGELgrMrqA",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "folkvizag-b6830.firebaseapp.com",
  projectId: USE_EMULATOR ? 'demo-folk' : (import.meta.env.VITE_FIREBASE_PROJECT_ID || "folkvizag-b6830"),
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "folkvizag-b6830.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "95883020949",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:95883020949:web:343a5294bcad79dd51e99c",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-ENQE6EDS0T"
};

// Singleton initialization
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);

// Data lives in Postgres behind the FOLK server now (see ./pgstore.js); `db`
// is kept so existing collection(db, ...) / doc(db, ...) calls read the same.
export const db = { type: 'folk-postgres' };

if (USE_EMULATOR) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  console.info('[firebase] Using local emulators (demo-folk).');
}

export const isEmulator = USE_EMULATOR;
export const functions = getFunctions(app);
export const storage = getStorage(app);
export const analytics = typeof window !== 'undefined' && !USE_EMULATOR ? getAnalytics(app) : null;

export default app;
