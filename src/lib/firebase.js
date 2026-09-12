import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";
import { getAnalytics } from "firebase/analytics";
import { getStorage } from "firebase/storage";

// Firebase configuration (override via VITE_FIREBASE_* env vars, e.g. in Vercel)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyB8UsgVIkTss7yZ_fKyDVIoykGELgrMrqA",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "folkvizag-b6830.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "folkvizag-b6830",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "folkvizag-b6830.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "95883020949",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:95883020949:web:343a5294bcad79dd51e99c",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-ENQE6EDS0T"
};

// Singleton initialization
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);

// Use long polling to avoid WebChannel assertion crashes with Vite HMR on localhost
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});

export const functions = getFunctions(app);
export const storage = getStorage(app);
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

export default app;
