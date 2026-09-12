import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Lock, Mail, Loader2, ArrowRight, AlertTriangle, KeyRound } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

/**
 * Dedicated sign-in screen for administrators at /admin.
 *
 * - Email + password only (email is mandatory — no Google/OTP flows here).
 * - Deliberately separate from the devotee login: admins always enter through
 *   this portal and land on the Command Center, never on the member app.
 * - Non-admin credentials still sign in successfully at the Firebase level;
 *   App.jsx then shows them the access notice on /admin instead of the
 *   dashboard, so nothing is leaked and nothing breaks.
 */
const AdminLogin = () => {
  const { loginEmail, resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isForgot, setIsForgot] = useState(false);

  const toEmail = (value) => value.includes('@') ? value : `${value.trim().toLowerCase()}@folkvizag.app`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || (!password && !isForgot)) {
      setError('Please fill in all fields.');
      return;
    }
    setLoading(true);
    setError('');
    setMessage('');
    try {
      if (isForgot) {
        await resetPassword(toEmail(email));
        setMessage('Password reset link sent. Check your inbox.');
        setIsForgot(false);
      } else {
        // Accept either the shared username ("admin") or a full email address.
        await loginEmail(toEmail(email), password);
        // Success: the AuthContext listener picks the session up and App.jsx
        // renders the Command Center (or the access notice for non-admins).
      }
    } catch (err) {
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        setError('Invalid administrator credentials.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many attempts. Please wait and try again.');
      } else {
        setError(err.message || 'Sign-in failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 relative flex flex-col items-center justify-center p-4 overflow-hidden font-inter">
      {/* Ambient background */}
      <div className="absolute top-0 left-0 w-full h-full opacity-[0.07] pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle at 25% 25%, #FF9933 0, transparent 40%), radial-gradient(circle at 75% 75%, #7C3AED 0, transparent 40%)' }}
      />
      <div className="absolute -top-40 -right-40 w-[40rem] h-[40rem] bg-saffron/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-[30rem] h-[30rem] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-gray-900/90 backdrop-blur-2xl border border-gray-800 rounded-[2.5rem] shadow-2xl p-8 sm:p-10">

          <div className="text-center mb-8">
            <motion.div
              initial={{ y: -16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="w-20 h-20 mx-auto mb-5 rounded-3xl bg-gradient-to-br from-saffron via-gold to-saffron-dark p-[2px] shadow-lg shadow-saffron/20"
            >
              <div className="w-full h-full bg-gray-900 rounded-[calc(1.5rem-2px)] flex items-center justify-center">
                <ShieldCheck className="text-saffron" size={34} />
              </div>
            </motion.div>
            <h1 className="text-3xl font-black bg-gradient-to-r from-saffron via-gold to-saffron bg-clip-text text-transparent font-cinzel tracking-tight">
              Administrator
            </h1>
            <p className="text-gray-500 text-xs font-bold uppercase tracking-[0.3em] mt-2">Folkvizag Control Portal</p>
          </div>

          {(error || message) && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`px-5 py-3 rounded-2xl text-xs font-bold mb-6 flex items-center gap-3 ${
                error
                  ? 'bg-red-950/60 text-red-400 border border-red-900'
                  : 'bg-green-950/60 text-green-400 border border-green-900'
              }`}
            >
              {error ? <AlertTriangle size={15} className="shrink-0" /> : <KeyRound size={15} className="shrink-0" />}
              {error || message}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative flex items-center bg-gray-800/70 border border-gray-700/60 rounded-2xl overflow-hidden focus-within:border-saffron/70 focus-within:ring-2 focus-within:ring-saffron/20 transition-all">
              <Mail className="absolute left-4 text-gray-500" size={19} />
              <input
                type="text"
                required
                autoComplete="username"
                inputMode="email"
                placeholder="admin  ·  or  admin@folkvizag.app"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full py-4 pl-12 pr-4 bg-transparent outline-none text-gray-200 font-medium placeholder:text-gray-600 text-sm"
              />
            </div>

            {!isForgot && (
              <div className="relative flex items-center bg-gray-800/70 border border-gray-700/60 rounded-2xl overflow-hidden focus-within:border-saffron/70 focus-within:ring-2 focus-within:ring-saffron/20 transition-all">
                <Lock className="absolute left-4 text-gray-500" size={19} />
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full py-4 pl-12 pr-4 bg-transparent outline-none text-gray-200 font-medium placeholder:text-gray-600 text-sm"
                />
              </div>
            )}

            {!isForgot && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => { setIsForgot(true); setError(''); setMessage(''); }}
                  className="text-xs font-medium text-gray-500 hover:text-saffron transition-colors"
                >
                  Forgot password?
                </button>
              </div>
            )}

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              disabled={loading}
              type="submit"
              className="w-full py-4 bg-gradient-to-r from-saffron to-gold rounded-2xl font-black text-gray-950 shadow-lg shadow-saffron/20 flex items-center justify-center gap-2 disabled:opacity-50 transition-all uppercase tracking-[0.15em] text-xs"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <>
                  <span>{isForgot ? 'Send Reset Link' : 'Enter Control Portal'}</span>
                  {!isForgot && <ArrowRight size={16} />}
                </>
              )}
            </motion.button>

            {isForgot && (
              <button
                type="button"
                onClick={() => { setIsForgot(false); setError(''); setMessage(''); }}
                className="w-full text-xs font-bold text-gray-500 hover:text-gray-300 mt-1"
              >
                Back to sign in
              </button>
            )}
          </form>

          <div className="mt-8 pt-5 border-t border-gray-800/80 text-center">
            <p className="text-[10px] text-gray-600 font-medium leading-relaxed px-4">
              Restricted area. Administrator credentials are required —
              unauthorized access attempts are logged and reviewed.
            </p>
            <a
              href="/"
              className="inline-block mt-3 text-[10px] font-bold text-gray-500 hover:text-saffron uppercase tracking-widest transition-colors"
            >
              ← Member sign-in
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminLogin;
