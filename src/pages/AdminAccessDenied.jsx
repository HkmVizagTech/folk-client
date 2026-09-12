import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, LogOut, ArrowRight, Loader2, KeyRound, ChevronDown } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { callApi } from '../lib/api';

/**
 * Shown on /admin to a signed-in user whose role is not staff. Their
 * credentials authenticated fine, but they don't get the Command Center.
 * Offers a clean hop to the member app, a sign-out to try another account,
 * and — for a brand-new site with no admin yet — the one-time bootstrap that
 * provisions the shared admin login (the server only allows it while no
 * admin profile exists).
 */
const AdminAccessDenied = () => {
  const { user, logout } = useAuth();
  const [showBootstrap, setShowBootstrap] = useState(false);
  const [setupState, setSetupState] = useState({ status: 'idle', message: '' });

  const createSiteAdmin = async () => {
    setSetupState({ status: 'working', message: 'Provisioning the shared admin login…' });
    try {
      const result = await callApi('createAdmin');
      setSetupState({
        status: 'done',
        message: `Admin login ready → username: ${result.username} · password: admin@folk123. Sign out and sign in with those credentials.`,
      });
    } catch (error) {
      console.error('createAdmin failed:', error);
      const msg = error?.message || 'Failed to create admin login';
      setSetupState({
        status: 'error',
        message: /admins only/i.test(msg)
          ? 'An admin already exists on this site — ask them to sign in instead.'
          : msg,
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 relative flex flex-col items-center justify-center p-4 overflow-hidden font-inter">
      <div className="absolute top-0 left-0 w-full h-full opacity-[0.06] pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle at 25% 25%, #FF9933 0, transparent 40%), radial-gradient(circle at 75% 75%, #7C3AED 0, transparent 40%)' }}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-gray-900/90 backdrop-blur-2xl border border-gray-800 rounded-[2.5rem] shadow-2xl p-8 sm:p-10 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-red-950/60 border border-red-900/60 flex items-center justify-center">
            <ShieldAlert className="text-red-400" size={32} />
          </div>

          <h1 className="text-2xl font-black text-gray-100 tracking-tight mb-2">Access Restricted</h1>
          <p className="text-sm text-gray-400 leading-relaxed mb-2">
            This portal is for administrators only.
          </p>
          <p className="text-xs text-gray-600 leading-relaxed mb-8">
            You are signed in as <span className="font-bold text-gray-400">{user?.email || user?.name || 'a member'}</span>{' '}
            (<span className="font-bold text-gray-500">{user?.role || 'devotee'}</span>). Use the member app instead,
            or sign out and enter administrator credentials.
          </p>

          <div className="space-y-3">
            <motion.a
              href="/"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-4 bg-gradient-to-r from-saffron to-gold rounded-2xl font-black text-gray-950 shadow-lg shadow-saffron/20 flex items-center justify-center gap-2 uppercase tracking-[0.15em] text-xs"
            >
              <span>Go to Member App</span>
              <ArrowRight size={16} />
            </motion.a>

            <button
              onClick={logout}
              className="w-full py-3.5 bg-gray-800/70 border border-gray-700/60 rounded-2xl font-bold text-gray-400 hover:text-red-400 hover:border-red-900/60 flex items-center justify-center gap-2 transition-all text-xs uppercase tracking-[0.15em]"
            >
              <LogOut size={15} />
              Sign out
            </button>
          </div>

          {/* First-time setup: on a fresh site no admin exists yet, so whoever
              signs in first provisions the shared admin login. Once an admin
              profile exists the server rejects this, so it stays safe. */}
          <div className="mt-8 pt-5 border-t border-gray-800/80 text-left">
            <button
              type="button"
              onClick={() => setShowBootstrap(!showBootstrap)}
              className="w-full flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 hover:text-gray-300 transition-colors"
            >
              <span>First time? Create the admin login</span>
              <ChevronDown size={14} className={`transition-transform ${showBootstrap ? 'rotate-180' : ''}`} />
            </button>

            {showBootstrap && (
              <div className="mt-4">
                <p className="text-[11px] text-gray-500 leading-relaxed mb-4">
                  This creates the shared administrator account (username{' '}
                  <span className="font-bold text-gray-300">admin</span>, password{' '}
                  <span className="font-bold text-gray-300">admin@folk123</span>). It only works while
                  no admin exists yet.
                </p>
                <button
                  onClick={createSiteAdmin}
                  disabled={setupState.status === 'working'}
                  className="w-full py-3.5 bg-gradient-to-r from-celestial to-purple-500 rounded-2xl font-black text-white flex items-center justify-center gap-2 disabled:opacity-50 transition-all text-xs uppercase tracking-[0.15em]"
                >
                  {setupState.status === 'working' ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <>
                      <KeyRound size={15} />
                      Create Admin Login
                    </>
                  )}
                </button>
                {setupState.status !== 'idle' && (
                  <p className={`mt-3 text-[11px] font-bold leading-relaxed ${
                    setupState.status === 'error' ? 'text-red-400' : 'text-green-400'
                  }`}>
                    {setupState.message}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminAccessDenied;
