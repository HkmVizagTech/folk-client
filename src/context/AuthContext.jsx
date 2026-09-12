import { useState, useEffect, createContext, useContext } from 'react';
import { auth, db } from '../lib/firebase';
import { 
  onAuthStateChanged, 
  GoogleAuthProvider, 
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  sendPasswordResetEmail,
  signOut
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getSafeProfileImage } from '../lib/imageUtils';


export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const cached = localStorage.getItem('fast_load_cache');
      return cached ? JSON.parse(cached) : null;
    } catch (e) {
      console.error("Cache parsing error:", e);
      return null;
    }
  });
  const [loading, setLoading] = useState(() => !localStorage.getItem('fast_load_cache'));
  const [profileLoaded, setProfileLoaded] = useState(() => !!localStorage.getItem('fast_load_cache'));

  const loginGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const loginEmail = async (email, password) => {
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (error) {
      console.error("Firebase Login Error Details:", {
        code: error.code,
        message: error.message,
        customData: error.customData,
        email: email ? email.substring(0, 3) + '...' : 'none'
      });
      throw error;
    }
  };

  const registerEmail = async (email, password, name) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });
  };

  const resetPassword = async (email) => {
    await sendPasswordResetEmail(auth, email);
  };

  const setupRecaptcha = (containerId) => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
        size: 'invisible'
      });
    }
  };

  const sendOTP = async (phoneNumber) => {
    const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, window.recaptchaVerifier);
    window.confirmationResult = confirmationResult;
    return confirmationResult;
  };

  const verifyOTP = async (otp) => {
    await window.confirmationResult.confirm(otp);
  };

  const completeProfile = async (role, providedName) => {
    if (!auth.currentUser) return;
    
    // Supreme Admin Escalation Check
    const isRootAdmin = auth.currentUser.uid === 'wRbvUaFiBOYeXEEtF8OuXnzGWXs2';
    const assignedRole = isRootAdmin ? 'admin' : role;
    
    const userRef = doc(db, 'users', auth.currentUser.uid);
    try {
      const finalName = providedName || auth.currentUser.displayName || 'Devotee';
      const qrToken = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
      
      const profileData = {
        uid: auth.currentUser.uid,
        email: auth.currentUser.email || '',
        name: finalName,
        photo: getSafeProfileImage(auth.currentUser.photoURL, auth.currentUser.displayName),
        role: assignedRole, 
        qrToken,
        createdAt: serverTimestamp()
      };

      // Optimistic update: Update local state immediately
      const optimisticUser = { ...auth.currentUser, ...profileData, requiresRole: false };
      setUser(optimisticUser);
      localStorage.setItem('fast_load_cache', JSON.stringify(optimisticUser));

      // Fire and forget (or handle in background) to keep UI snappy
      setDoc(userRef, profileData, { merge: true }).catch(err => {
        console.error("Delayed profile save error:", err);
      });
      
      if (providedName && !auth.currentUser.displayName) {
        updateProfile(auth.currentUser, { displayName: finalName }).catch(() => {});
      }
    } catch (error) {
      console.error("Error completing profile:", error);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('fast_load_cache');
    } catch (error) {
      console.error("Logout error", error);
    }
  };

  useEffect(() => {
    let isInitialLoad = true;
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      // If we already have a cached user and it's the initial load, don't show loading spinner again
      if (isInitialLoad && user) {
        setLoading(false);
        isInitialLoad = false;
      } else {
        setLoading(true);
      }
      if (authUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', authUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            let liveRole = userData.role;
            
            // Auto-generate qrToken if missing
            if (!userData.qrToken) {
              const newToken = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
              await setDoc(doc(db, 'users', authUser.uid), { qrToken: newToken }, { merge: true });
              userData.qrToken = newToken;
            }

            if (authUser.uid === 'wRbvUaFiBOYeXEEtF8OuXnzGWXs2' && liveRole !== 'admin') {
               await setDoc(doc(db, 'users', authUser.uid), { role: 'admin' }, { merge: true });
               liveRole = 'admin';
            }
            const finalUser = { ...authUser, ...userData, role: liveRole, requiresRole: false };
            setUser(finalUser);
            localStorage.setItem('fast_load_cache', JSON.stringify(finalUser));
          } else {
            setUser({ ...authUser, requiresRole: true });
          }
        } catch (error) {
          if (error.code === 'permission-denied') {
            setUser({ ...authUser, requiresRole: true });
          } else {
            console.error("Auth Firestore Error:", error);
          }
        } finally {
          setProfileLoaded(true);
        }
      } else {
        setUser(null);
        setProfileLoaded(true);
        localStorage.removeItem('fast_load_cache');
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading: loading || (!user && !profileLoaded), loginGoogle, loginEmail, registerEmail, resetPassword, setupRecaptcha, sendOTP, verifyOTP, logout, completeProfile }}>
      {(loading || (!user && !profileLoaded)) ? (
        <div className="min-h-screen bg-cream flex items-center justify-center">
          <div className="w-16 h-16 border-4 border-saffron border-t-transparent rounded-full animate-spin" />
        </div>
      ) : children}
    </AuthContext.Provider>
  );
};
