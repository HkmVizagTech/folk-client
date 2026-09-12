import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ArrowRight, Github, Users, Shield, CheckCircle2, Lock, User, Phone, Key } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const Login = () => {
  const { loginGoogle, loginEmail, registerEmail, resetPassword, setupRecaptcha, sendOTP, verifyOTP, user, completeProfile, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [selectedRole, setSelectedRole] = useState(null);
  
  // Auth Modes
  const [authMethod, setAuthMethod] = useState('email'); // 'email' | 'phone'
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  
  // Email Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  // Phone Form States
  const [phone, setPhone] = useState('+91');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  useEffect(() => {
    if (authMethod === 'phone' && !otpSent && !isForgotPassword) {
      setTimeout(() => {
        setupRecaptcha('recaptcha-container');
      }, 500);
    }
  }, [authMethod, otpSent, setupRecaptcha, isForgotPassword]);

  const handleGoogleAuth = async () => {
    setLoading(true); setError(''); setMessage('');
    try { await loginGoogle(); } 
    catch (err) { setError(err.message || 'Failed to sign in with Google'); } 
    finally { setLoading(false); }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    if (!email || (!isForgotPassword && !password) || (!isForgotPassword && isSignUp && !name)) {
      setError('Please fill in all necessary fields');
      return;
    }
    setLoading(true); setError(''); setMessage('');
    try {
      if (isForgotPassword) {
        await resetPassword(email);
        setMessage('Password reset link sent! Check your inbox.');
        setIsForgotPassword(false);
      } else if (isSignUp) {
        await registerEmail(email, password, name);
      } else {
        await loginEmail(email, password);
      }
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') setError('Email already in use. Please sign in instead.');
      else if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') setError('Invalid email or password.');
      else if (err.code === 'auth/weak-password') setError('Password should be at least 6 characters.');
      else setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneAuth = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setMessage('');
    try {
      await sendOTP(phone);
      setOtpSent(true);
      setMessage('OTP sent successfully!');
    } catch (err) {
      if(err.code === 'auth/invalid-phone-number') setError('Invalid phone number format. Include country code (e.g. +91).');
      else setError(err.message || 'Failed to send OTP. Try again.');
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(''), 5000);
    }
  };

  const submitOTP = async (e) => {
    e.preventDefault();
    if (!otp) return;
    setLoading(true); setError(''); setMessage('');
    try {
      await verifyOTP(otp);
    } catch (err) {
      if (err.code === 'auth/invalid-verification-code') setError('Invalid OTP. Please check and try again.');
      else setError(err.message || 'Failed to verify OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteProfile = async () => {
    if (!selectedRole) return;
    
    // Strict domain validation for Folks Head
    if (selectedRole === 'folks_head') {
      if (!user?.email || !user.email.endsWith('@hkmvizag.org')) {
        setError('Folks Head registration strictly requires an @hkmvizag.org email address. Phone registrations are not permitted.');
        return;
      }
    }

    if (isSignUp && !name) {
      setError('Please provide your Full Name to complete registration.');
      return;
    }

    setLoading(true);
    try {
      await completeProfile(selectedRole, name);
    } catch (err) {
      setError('Failed to save role. Please try again.');
    } finally { setLoading(false); }
  };

  const inputWrapperClass = "relative flex items-center bg-gray-50 border border-gray-100 rounded-2xl overflow-hidden focus-within:border-saffron focus-within:ring-2 focus-within:ring-saffron/20 transition-all";
  const inputClass = "w-full py-4 pl-12 pr-4 bg-transparent outline-none text-gray-700 font-medium placeholder:text-gray-400";
  const iconClass = "absolute left-4 text-gray-400";

  return (
    <div className="min-h-screen bg-cream relative flex flex-col items-center justify-center p-4 overflow-hidden font-inter">
      <div className="absolute top-0 left-0 w-full h-full tilak-bg opacity-30 pointer-events-none" />
      <div className="absolute -top-32 -left-32 w-[35rem] h-[35rem] bg-saffron/10 rounded-full blur-[100px] animate-pulse pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[30rem] h-[30rem] bg-gold/10 rounded-full blur-[80px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-white/90 backdrop-blur-2xl border border-white/50 rounded-[2.5rem] shadow-premium-xl p-8 sm:p-10 md:p-12 overflow-hidden">
          
          <div className="text-center mb-8">
            <motion.div 
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="w-24 h-24 mx-auto mb-6 relative group"
            >
              <motion.div 
                animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 bg-saffron/20 rounded-full blur-2xl -z-10"
              />
              <img 
                src="/logo.png" 
                alt="Folkvizag Logo" 
                className="w-full h-full object-contain filter brightness-0 opacity-90 transition-transform group-hover:scale-110 duration-500" 
              />
            </motion.div>
            <h1 className="text-4xl font-black bg-gradient-to-r from-saffron via-gold to-saffron-dark bg-clip-text text-transparent font-cinzel mb-2 tracking-tighter drop-shadow-sm">Folkvizag</h1>
            <p className="text-gray-400 text-sm font-bold uppercase tracking-[0.3em]">The Divine Journey Begins</p>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, y: -10, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} exit={{ opacity: 0, y: -10, height: 0 }} className="bg-red-50 text-red-600 px-5 py-3 rounded-2xl text-xs font-bold mb-6 border border-red-100 flex items-center gap-3 overflow-hidden">
                <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse shrink-0" />
                {error}
              </motion.div>
            )}
            {message && !error && (
              <motion.div initial={{ opacity: 0, y: -10, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} exit={{ opacity: 0, y: -10, height: 0 }} className="bg-green-50 text-green-600 px-5 py-3 rounded-2xl text-xs font-bold mb-6 border border-green-100 flex items-center gap-3 overflow-hidden">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shrink-0" />
                {message}
              </motion.div>
            )}
          </AnimatePresence>

          {user?.requiresRole ? (
            <motion.div initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="space-y-6">
              <div className="text-center">
                <h2 className="text-xl font-bold text-gray-800 mb-1">Identify Your Path</h2>
                <p className="text-gray-400 text-xs">Select your role to continue your journey</p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {[
                  { id: 'devotee', title: 'Devotee', desc: 'Log sadhana, track attendance, and join events.', icon: <Users className="text-saffron" size={20} /> },
                  { id: 'folks_head', title: 'Folks Head', desc: 'Manage devotees, approve stays, create events.', icon: <Shield className="text-gold" size={20} /> }
                ].map((role) => (
                  <button key={role.id} onClick={() => setSelectedRole(role.id)} className={`flex items-start gap-4 p-5 rounded-[2rem] border-2 transition-all text-left group relative overflow-hidden ${selectedRole === role.id ? 'border-saffron bg-saffron/5 shadow-premium scale-[1.02]' : 'border-gray-50 hover:border-gray-100 bg-gray-50/50'}`}>
                    {selectedRole === role.id && <div className="absolute top-0 right-0 w-24 h-24 bg-saffron/5 rounded-full -mr-12 -mt-12 blur-2xl" />}
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 shrink-0 ${selectedRole === role.id ? 'bg-white shadow-md scale-110' : 'bg-gray-100'}`}>{role.icon}</div>
                    <div className="flex-1 relative z-10">
                      <div className="flex justify-between items-center mb-1">
                        <h4 className="font-black text-gray-800 text-sm font-cinzel tracking-tight">{role.title}</h4>
                        {selectedRole === role.id && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}><CheckCircle2 size={16} className="text-saffron" /></motion.div>}
                      </div>
                      <p className="text-[10px] text-gray-400 font-bold leading-relaxed tracking-wide">{role.desc}</p>
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex flex-col gap-3 pt-2">
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} disabled={!selectedRole || loading} onClick={handleCompleteProfile} className="w-full py-5 bg-gradient-to-r from-saffron via-gold to-saffron rounded-[2rem] font-black text-white shadow-premium-xl flex items-center justify-center gap-3 disabled:opacity-50 transition-all uppercase tracking-[0.2em] text-xs font-cinzel">
                  {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <ArrowRight size={18} />}
                  <span>Enter Application</span>
                </motion.button>
              </div>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              {!otpSent && !isForgotPassword && (
                <div className="flex flex-col gap-4">
                  <div className="flex p-1 bg-gray-100/50 rounded-xl mb-2">
                    <button onClick={() => setAuthMethod('email')} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${authMethod === 'email' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
                      <Mail size={14} /> Email
                    </button>
                    <button onClick={() => { setAuthMethod('phone'); setIsSignUp(false); }} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${authMethod === 'phone' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
                      <Phone size={14} /> Phone
                    </button>
                  </div>
                  
                  <div className="flex gap-4 border-b border-gray-100 pb-2 mt-4">
                    <button onClick={() => setIsSignUp(false)} className={`flex-1 text-sm font-bold transition-all ${!isSignUp ? 'text-saffron border-b-2 border-saffron pb-2' : 'text-gray-400 pb-2 hover:text-gray-600'}`}>Log In</button>
                    <button onClick={() => setIsSignUp(true)} className={`flex-1 text-sm font-bold transition-all ${isSignUp ? 'text-saffron border-b-2 border-saffron pb-2' : 'text-gray-400 pb-2 hover:text-gray-600'}`}>Sign Up</button>
                  </div>
                </div>
              )}

              <AnimatePresence mode="wait">
                {isForgotPassword ? (
                  <motion.form key="reset-form" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} onSubmit={handleEmailAuth} className="space-y-4">
                    <div className="text-center mb-4">
                      <h3 className="font-bold text-gray-800 text-lg">Reset Password</h3>
                       <p className="text-xs text-gray-500 mt-1">Enter your email and we&apos;ll send you a link to reset your password.</p>
                    </div>
                    
                    <div className={inputWrapperClass}>
                      <Mail className={iconClass} size={20} />
                      <input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
                    </div>

                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} disabled={loading} type="submit" className="w-full py-4 bg-gradient-to-r from-saffron to-gold rounded-2xl font-bold text-white shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2">
                      {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <span>Send Reset Link</span>}
                    </motion.button>

                    <button type="button" onClick={() => { setIsForgotPassword(false); setError(''); setMessage(''); }} className="w-full text-xs font-bold text-gray-400 hover:text-gray-600 mt-2">Back to Sign In</button>
                  </motion.form>
                ) : authMethod === 'email' ? (
                  <motion.form key="email-form" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} onSubmit={handleEmailAuth} className="space-y-4">
                    <AnimatePresence>
                      {isSignUp && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                          <div className={inputWrapperClass}>
                            <User className={iconClass} size={20} />
                            <input type="text" placeholder="Your Full Name" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className={inputWrapperClass}>
                      <Mail className={iconClass} size={20} />
                      <input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
                    </div>

                    <div className={inputWrapperClass}>
                      <Lock className={iconClass} size={20} />
                      <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} />
                    </div>

                    {!isSignUp && (
                       <div className="flex justify-end">
                          <button type="button" onClick={() => setIsForgotPassword(true)} className="text-xs font-medium text-saffron hover:underline focus:outline-none">Forgot Password?</button>
                       </div>
                    )}

                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} disabled={loading} type="submit" className="w-full py-4 bg-gradient-to-r from-gray-800 to-gray-900 rounded-2xl font-bold text-white shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2">
                      {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>}
                    </motion.button>
                  </motion.form>
                ) : (
                  <motion.form key="phone-form" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                    {!otpSent ? (
                      <>
                        <AnimatePresence>
                          {isSignUp && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-4">
                              <div className={inputWrapperClass}>
                                <User className={iconClass} size={20} />
                                <input type="text" placeholder="Your Full Name" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                        <div className={inputWrapperClass}>
                          <Phone className={iconClass} size={20} />
                          <input type="tel" placeholder="+91 9876543210" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} />
                        </div>
                        <div id="recaptcha-container" className="flex justify-center my-2"></div>
                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} disabled={loading} onClick={handlePhoneAuth} className="w-full py-4 bg-gradient-to-r from-gray-800 to-gray-900 rounded-2xl font-bold text-white shadow-lg flex items-center justify-center gap-2 mt-4">
                          {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <span>{isSignUp ? 'Sign Up with OTP' : 'Send OTP'}</span>}
                        </motion.button>
                      </>
                    ) : (
                      <>
                        <div className="text-center text-sm text-gray-500 mb-2">Code sent to <span className="font-bold text-gray-800">{phone}</span></div>
                        <div className={inputWrapperClass}>
                          <Key className={iconClass} size={20} />
                          <input type="text" placeholder="Enter 6-digit OTP" value={otp} onChange={(e) => setOtp(e.target.value)} className={inputClass} maxLength={6} />
                        </div>
                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} disabled={loading || otp.length < 6} onClick={submitOTP} className="w-full py-4 bg-gradient-to-r from-saffron to-gold rounded-2xl font-bold text-white shadow-lg flex items-center justify-center gap-2">
                          {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <span>Verify Route</span>}
                        </motion.button>
                        <button type="button" onClick={() => setOtpSent(false)} className="w-full text-xs font-bold text-gray-400 hover:text-gray-600 mt-2">Change Phone Number</button>
                      </>
                    )}
                  </motion.form>
                )}
              </AnimatePresence>

              {!otpSent && !isForgotPassword && (
                <>
                  <div className="relative py-4">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
                    <div className="relative flex justify-center text-[10px] uppercase font-bold"><span className="bg-white px-4 text-gray-300 tracking-[0.2em]">or auto</span></div>
                  </div>
                  <motion.button whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }} onClick={handleGoogleAuth} disabled={loading} className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 py-3 rounded-2xl font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-300">
                    <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    <span className="text-sm">Continue with Google</span>
                  </motion.button>
                </>
              )}
            </motion.div>
          )}

          <div className="mt-8 text-center text-[9px] text-gray-400 font-medium px-4 leading-relaxed tracking-wide">
            Access strictly governed by our <span className="text-saffron font-bold cursor-pointer hover:underline mx-1">Privacy Terms</span> and <span className="text-saffron font-bold cursor-pointer hover:underline mx-1">Ethical Guidelines</span>.
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
