import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Flame, TrendingUp, Calendar, Zap, Loader2, Plus, CheckCircle2, Circle, Trophy, Star, Target, ShieldCheck, ChevronRight, ArrowRight, Info, Award, Save, Sun } from 'lucide-react'
import Card from '../components/ui/Card'
import CircularProgress from '../components/sadhana/CircularProgress'
import Button from '../components/ui/Button'
import { useAuth } from '../hooks/useAuth'
import { db } from '../lib/firebase'
import { collection, doc, getDoc, getDocs, query, where, orderBy, limit, runTransaction, serverTimestamp } from 'firebase/firestore'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import QRView from '../components/qr/QRView'
import { QrCode } from 'lucide-react'

const SadhanaTracker = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [sadhanaData, setSadhanaData] = useState({ profile: {}, logs: [], attendance: [], prasadam: [] });
  const [inputRounds, setInputRounds] = useState('');
  const [targetInput, setTargetInput] = useState(16);
  const [showSaved, setShowSaved] = useState(false);
  const [showMilestone, setShowMilestone] = useState(false);
  const [indexBuilding, setIndexBuilding] = useState(false);
  const today = new Date().toISOString().split('T')[0];

  const fetchData = async () => {
    if (!user) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      const uData = userSnap.data() || {};

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      let displayStreak = uData.streak || 0;
      if (uData.lastSadhanaDate && uData.lastSadhanaDate !== today && uData.lastSadhanaDate !== yesterdayStr) {
        displayStreak = 0;
      }

      const profileStats = {
        name: uData.fullName || user.displayName || 'Devotee',
        streak: displayStreak,
        score: uData.score || 0,
        longestStreak: uData.longestStreak || 0,
        totalLogs: 0
      };

      try {
        const q = query(
          collection(db, 'sadhana_logs'),
          where('userId', '==', user.uid),
          orderBy('date', 'desc'),
          limit(7)
        );
        const logsSnap = await getDocs(q);
        const logs = logsSnap.docs.map(doc => doc.data());
        profileStats.totalLogs = logs.length;

        // Fetch user's attendance and prasadam logs with in-memory sorting to bypass index requirements
        let attendanceLogs = [];
        let prasadamLogs = [];
        
        try {
          // Alternative: Query only by userId and sort in JS
          const attQ = query(collection(db, 'attendance'), where('userId', '==', user.uid));
          const attSnap = await getDocs(attQ);
          attendanceLogs = attSnap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .sort((a, b) => {
               const timeA = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
               const timeB = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
               return timeB - timeA;
            })
            .slice(0, 5);
        } catch (attError) {
          console.error("Error fetching attendance logs:", attError.message);
        }

        try {
          // Alternative: Query only by userId and sort in JS
          const prasQ = query(collection(db, 'prasadam_logs'), where('userId', '==', user.uid));
          const prasSnap = await getDocs(prasQ);
          prasadamLogs = prasSnap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .sort((a, b) => {
               const timeA = a.timestamp?.toDate?.() || new Date(a.timestamp || 0);
               const timeB = b.timestamp?.toDate?.() || new Date(b.timestamp || 0);
               return timeB - timeA;
            })
            .slice(0, 5);
        } catch (prasError) {
          console.error("Error fetching prasadam logs:", prasError.message);
        }
        
        setSadhanaData({ 
          profile: profileStats, 
          logs: logs.reverse(),
          attendance: attendanceLogs,
          prasadam: prasadamLogs
        });
        setIndexBuilding(false);
      } catch (innerError) {
        if (innerError.message?.includes('index') || innerError.code === 'failed-precondition') {
          setIndexBuilding(true);
          const qSimple = query(
            collection(db, 'sadhana_logs'),
            where('userId', '==', user.uid),
            limit(7)
          );
          const logsSnapSimple = await getDocs(qSimple);
          const logsSimple = logsSnapSimple.docs.map(doc => doc.data());
          profileStats.totalLogs = logsSimple.length;
          setSadhanaData({ 
            profile: profileStats, 
            logs: logsSimple.sort((a,b) => a.date.localeCompare(b.date)) 
          });
        } else {
          throw innerError;
        }
      }
    } catch (error) {
      console.error("Critical error fetching sadhana data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      setLoading(true);
      fetchData();
    } else {
      setSadhanaData({ profile: {}, logs: [] });
      setLoading(false);
    }
  }, [user?.uid]);

  const todayLog = sadhanaData.logs.find(log => log.date === today);
  const currentTarget = todayLog ? todayLog.target : 0;
  const currentRounds = todayLog ? todayLog.roundsCompleted : 0;

  useEffect(() => {
    if (todayLog && todayLog.roundsCompleted !== undefined && !inputRounds) {
      setInputRounds(String(todayLog.roundsCompleted));
    }
  }, [todayLog]);

  const handleSetTarget = async () => {
    if (targetInput < 8 || targetInput > 64) {
      alert("Target must be between 8 and 64 rounds.");
      return;
    }

    setSubmitting(true);
    const logId = `${user.uid}_${today}`;
    const logRef = doc(db, 'sadhana_logs', logId);

    try {
      await runTransaction(db, async (transaction) => {
        const logDoc = await transaction.get(logRef);
        if (logDoc.exists()) throw new Error("Target already set for today.");

        transaction.set(logRef, {
          userId: user.uid,
          date: today,
          target: targetInput,
          roundsCompleted: 0,
          progressPercentage: 0,
          streak: 0,
          score: 0,
          status: 'locked',
          createdAt: serverTimestamp()
        });
      });
      await fetchData();
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 2000);
    } catch (error) {
      alert(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogSadhana = async () => {
    const rounds = parseInt(inputRounds);
    if (isNaN(rounds) || rounds < 0 || rounds > 200) {
      alert("Please enter a valid number of rounds.");
      return;
    }

    setSubmitting(true);
    const logId = `${user.uid}_${today}`;
    const logRef = doc(db, 'sadhana_logs', logId);
    const userRef = doc(db, 'users', user.uid);

    try {
      await runTransaction(db, async (transaction) => {
        const uDoc = await transaction.get(userRef);
        const lDoc = await transaction.get(logRef);
        
        if (!lDoc.exists()) {
          throw new Error("Please set your target first!");
        }

        const uData = uDoc.data() || {};
        const oldLogData = lDoc.data();
        let target = oldLogData.target || 16;
        
        // Admins must complete 16 rounds for streak
        if (uData.role === 'admin' || uData.role === 'folks_head') {
          target = 16;
        }

        let currentStreak = uData.streak || 0;
        const yesterdayDate = new Date();
        yesterdayDate.setDate(yesterdayDate.getDate() - 1);
        const yesterdayString = yesterdayDate.toISOString().split('T')[0];

        if (uData.lastSadhanaDate && uData.lastSadhanaDate !== today && uData.lastSadhanaDate !== yesterdayString) {
          currentStreak = 0;
        }

        if (rounds >= target) {
          if (!oldLogData.completed) {
            if (uData.lastSadhanaDate === yesterdayString || currentStreak === 0) {
              currentStreak = (currentStreak) + 1;
            } else if (uData.lastSadhanaDate !== today) {
              currentStreak = 1;
            }
          }
        } else {
           currentStreak = 0;
        }

        let logScore = rounds * 2;
        if (rounds >= target) {
          logScore += 10;
          if (currentStreak === 3 && (!oldLogData.bonusClaimed || !oldLogData.bonusClaimed.includes(3))) logScore += 20;
          if (currentStreak === 7 && (!oldLogData.bonusClaimed || !oldLogData.bonusClaimed.includes(7))) logScore += 50;
          if (currentStreak === 30 && (!oldLogData.bonusClaimed || !oldLogData.bonusClaimed.includes(30))) logScore += 200;
        }

        const scoreDiff = logScore - (oldLogData.score || 0);
        const newLongestStreak = Math.max(uData.longestStreak || 0, currentStreak);

        transaction.update(lDoc.ref, {
          roundsCompleted: rounds,
          progressPercentage: Math.min(100, Math.round((rounds / target) * 100)),
          streak: currentStreak,
          score: logScore,
          completed: rounds >= target,
          updatedAt: serverTimestamp()
        });

        transaction.update(userRef, {
          streak: currentStreak,
          longestStreak: newLongestStreak,
          score: Math.max(0, (uData.score || 0) + scoreDiff),
          lastSadhanaDate: today,
          updatedAt: serverTimestamp()
        });
      });

      if (rounds >= currentTarget && !todayLog?.completed) {
        setShowMilestone(true);
      } else {
        setShowSaved(true);
      }
      
      setTimeout(() => {
        setShowMilestone(false);
        setShowSaved(false);
      }, 3000);
      
      await fetchData();
    } catch (error) {
      alert(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const chartData = sadhanaData.logs.map(log => ({
    day: new Date(log.date).toLocaleDateString('en-US', { weekday: 'short' }),
    rounds: log.roundsCompleted,
    target: log.target,
    date: log.date
  }));

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <Loader2 className="animate-spin text-saffron" size={48} />
            <motion.div initial={{scale:0}} animate={{scale:1}} className="absolute inset-0 flex items-center justify-center">
               <div className="w-2 h-2 bg-saffron rounded-full" />
            </motion.div>
          </div>
          <p className="text-gray-400 font-bold animate-pulse uppercase tracking-[0.3em] text-[10px]">Spirituality Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] p-4 lg:p-10 relative overflow-x-hidden">
      {/* Background Decorative Elements */}
      <div className="fixed top-0 right-0 w-[600px] h-[600px] bg-saffron/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[600px] h-[600px] bg-gold/5 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/3 pointer-events-none" />

      {/* Floating Status Toasts */}
      <AnimatePresence>
        {showSaved && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.8 }}
            className="fixed bottom-24 lg:bottom-10 left-1/2 -translate-x-1/2 z-[110] flex items-center gap-3 bg-gray-900 text-white px-6 py-3.5 rounded-2xl shadow-premium-xl border border-white/10"
          >
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
               <CheckCircle2 size={14} className="text-white" />
            </div>
            <span className="text-sm font-black uppercase tracking-widest text-white/90">Progress Recorded</span>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 max-w-7xl mx-auto space-y-12"
      >
        {/* Daily Target Modal - Mandatory Check */}
        <AnimatePresence>
          {!todayLog && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[120] flex items-center justify-center bg-gray-900/60 backdrop-blur-xl p-4"
            >
              <motion.div
                initial={{ scale: 0.9, y: 50 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 50 }}
                className="bg-white rounded-[4rem] p-12 text-center shadow-premium-xl max-w-lg w-full border border-saffron/20 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-8 opacity-5">
                   <Target size={180} />
                </div>
                <div className="relative z-10">
                  <div className="w-20 h-20 bg-saffron/10 rounded-3xl flex items-center justify-center mx-auto mb-8">
                     <Sun size={40} className="text-saffron animate-pulse" />
                  </div>
                  <div className="space-y-2 mb-8">
                     <span className="text-[10px] font-black text-saffron uppercase tracking-[0.4rem]">Step 1: Set your daily target</span>
                     <h2 className="text-4xl font-black text-gray-900 tracking-tighter uppercase italic leading-none">Morning Vow</h2>
                  </div>
                  <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mb-10">Commit to your daily rounds</p>
                  
                  <div className="bg-gray-50 p-10 rounded-[3rem] border border-gray-100 shadow-inner mb-10">
                     <div className="flex items-center justify-between mb-8">
                        <button onClick={() => setTargetInput(p => Math.max(8, p - 8))} className="w-16 h-16 rounded-2xl bg-white border border-gray-200 flex items-center justify-center text-3xl font-black shadow-lg hover:bg-saffron hover:text-white transition-all active:scale-95">-</button>
                        <div className="text-7xl font-black text-gray-900 tracking-tighter tabular-nums">{targetInput}</div>
                        <button onClick={() => setTargetInput(p => Math.min(64, p + 8))} className="w-16 h-16 rounded-2xl bg-white border border-gray-200 flex items-center justify-center text-3xl font-black shadow-lg hover:bg-saffron hover:text-white transition-all active:scale-95">+</button>
                     </div>
                     <p className="text-xs text-gray-400 font-medium">Sacred Goal for {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</p>
                  </div>
                  
                  <Button onClick={handleSetTarget} disabled={submitting} className="w-full py-6 bg-gray-900 text-white font-black rounded-[2.5rem] shadow-2xl hover:bg-black group relative overflow-hidden">
                     {submitting ? <Loader2 className="animate-spin mx-auto" /> : (
                       <div className="flex items-center justify-center gap-3 tracking-widest uppercase text-xs">
                           BEGIN TODAY&apos;S JOURNEY <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
                       </div>
                     )}
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Milestone Overlay Modal */}
        <AnimatePresence>
          {showMilestone && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-md p-4"
            >
              <motion.div
                initial={{ scale: 0.9, rotateY: 90 }}
                animate={{ scale: 1, rotateY: 0 }}
                exit={{ scale: 0.9, rotateY: -90 }}
                className="bg-white rounded-[3.5rem] p-12 text-center shadow-premium-xl max-w-sm w-full border border-saffron/20 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-saffron/10 to-transparent" />
                <div className="relative z-10 flex flex-col items-center">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 4 }}
                    className="w-24 h-24 bg-gradient-to-br from-saffron to-gold rounded-[2rem] flex items-center justify-center shadow-xl mb-6"
                  >
                    <Flame size={56} fill="white" className="text-white" />
                  </motion.div>
                  <h2 className="text-4xl font-black text-gray-900 mb-2 tracking-tighter italic uppercase">Day {sadhanaData.profile.streak}</h2>
                  <p className="text-xl font-bold text-saffron mb-6">STREAK SECURED!</p>
                  <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mb-8" />
                   <p className="text-gray-500 font-medium mb-10 text-sm leading-relaxed italic">&ldquo;Consistent practice is the foundation of spiritual success.&rdquo;</p>
                  <button 
                    onClick={() => setShowMilestone(false)}
                    className="w-full py-4 rounded-2xl bg-gray-900 text-white font-black hover:bg-black transition-all active:scale-95 shadow-xl uppercase tracking-widest text-xs"
                  >
                    Keep Going
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header Section */}
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-10 pt-10">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-3 px-5 py-2 bg-saffron/10 text-saffron rounded-full border border-saffron/20 shadow-sm">
               <TrendingUp size={16} />
               <span className="text-[11px] font-black uppercase tracking-[0.2em]">Sadhana Tracker v2.0</span>
            </div>
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-gray-900 tracking-tighter leading-[0.8]">
              SADHANA <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-saffron to-gold">TRACKER</span>
            </h1>
            <p className="text-xl font-bold text-gray-400 mt-4 uppercase tracking-widest italic">
               Welcome Home, <span className="text-gray-900">{sadhanaData.profile.name}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 sm:gap-8">
            {[
              { label: 'Current Streak', val: sadhanaData.profile.streak, unit: 'Days', icon: Flame, color: 'text-saffron', bg: 'bg-saffron/5' },
              { label: 'Longest Record', val: sadhanaData.profile.longestStreak, unit: 'Days', icon: Trophy, color: 'text-gold-dark', bg: 'bg-gold/5' },
              { label: 'Divine Score', val: Math.max(0, sadhanaData.profile.score || 0), unit: 'Pts', icon: Star, color: 'text-blue-600', bg: 'bg-blue-50' }
            ].map((stat, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -8, scale: 1.02 }}
                className={`flex items-center gap-4 sm:gap-6 ${stat.bg} px-4 py-4 sm:px-8 sm:py-5 rounded-[2rem] sm:rounded-[2.5rem] border border-white shadow-premium group transition-all`}
              >
                <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-white border border-gray-100 flex items-center justify-center shadow-lg group-hover:rotate-12 transition-all">
                   <stat.icon className={stat.color} fill={stat.color === 'text-saffron' ? '#FF9933' : 'transparent'} size={20} />
                </div>
                <div>
                  <span className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">{stat.label}</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-black text-gray-900 tabular-nums leading-none tracking-tighter">{stat.val}</span>
                    <span className="text-[11px] font-bold text-gray-400 capitalize">{stat.unit}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Main Interface */}
          <Card className="lg:col-span-12 xl:col-span-4 p-6 sm:p-14 bg-white border-none shadow-premium-xl rounded-[3rem] sm:rounded-[4rem] relative overflow-hidden flex flex-col justify-center min-h-[400px] sm:min-h-[650px] group">
             <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-all duration-700 group-hover:rotate-12 group-hover:scale-125">
                <Target size={200} />
             </div>

             <div className="flex flex-col items-center relative z-10">
                <div className="relative mb-14 flex items-center justify-center">
                   <CircularProgress current={currentRounds} total={currentTarget || 16} />
                   <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <motion.span 
                        key={currentRounds}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-5xl font-black text-gray-900 tracking-tighter leading-none shadow-sm pb-1"
                      >
                        {currentRounds}
                      </motion.span>
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mt-1 bg-white/50 px-3 py-1 rounded-full">of {currentTarget || '--'} Rounds</span>
                   </div>

                </div>

                <div className="w-full max-w-sm space-y-12">
                   {todayLog && (
                     <div className="space-y-12 text-center">
                        <div className="space-y-2">
                           <span className="text-[10px] font-black text-saffron uppercase tracking-[0.4em]">Step 2: Log your progress</span>
                           <h3 className="text-xl font-black text-gray-900 uppercase italic">Daily Recording</h3>
                        </div>
                        
                        <div className="bg-white p-4 rounded-[3.5rem] border border-gray-100 shadow-2xl relative group/input overflow-hidden">
                           <div className="flex items-center justify-between relative z-10">
                             <button onClick={() => setInputRounds(prev => Math.max(0, (parseInt(prev) || 0) - 1).toString())} className="w-14 h-14 sm:w-20 sm:h-20 rounded-2xl sm:rounded-[2.5rem] bg-gray-50 flex items-center justify-center text-gray-400 font-black text-2xl sm:text-3xl hover:bg-saffron/10 hover:text-saffron transition-all active:scale-90">-</button>
                              <div className="text-center">
                                 <AnimatePresence mode="wait">
                                    <motion.span key={inputRounds} initial={{y:20, opacity:0}} animate={{y:0, opacity:1}} exit={{y:-20, opacity:0}} className="text-5xl sm:text-7xl font-black text-gray-900 block tabular-nums leading-none mb-1">{inputRounds || 0}</motion.span>
                                 </AnimatePresence>
                                 <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] block">Rounds Logged</span>
                              </div>
                             <button onClick={() => setInputRounds(prev => Math.min(200, (parseInt(prev) || 0) + 1).toString())} className="w-14 h-14 sm:w-20 sm:h-20 rounded-2xl sm:rounded-[2.5rem] bg-gray-50 flex items-center justify-center text-gray-400 font-black text-2xl sm:text-3xl hover:bg-saffron/10 hover:text-saffron transition-all active:scale-90">+</button>
                           </div>
                           <div className="absolute inset-0 bg-saffron/5 translate-y-full group-hover/input:translate-y-0 transition-transform duration-700 pointer-events-none" />
                        </div>

                        <div className="space-y-6">
                           <div className="space-y-4">
                              <Button onClick={handleLogSadhana} disabled={submitting} className="w-full py-7 bg-gradient-to-r from-saffron to-gold text-white font-black rounded-[3rem] shadow-premium-xl relative overflow-hidden group">
                                 <div className="relative z-10 flex items-center justify-center gap-4 group-hover:scale-105 transition-transform uppercase tracking-[0.2em] text-xs">
                                    <ShieldCheck size={24} /> {todayLog.roundsCompleted > 0 ? 'Update Record' : 'Submit Entry'}
                                 </div>
                                 <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                              </Button>
                              <div className="flex items-center justify-center gap-2 text-xs font-black text-gray-300 uppercase tracking-widest">
                                 <Target size={14} className="opacity-50" /> Vow: {currentTarget} Rounds
                              </div>
                           </div>

                           {todayLog.score > 0 && (
                              <motion.div initial={{ opacity:0, scale: 0.9 }} animate={{ opacity:1, scale: 1 }} className="flex gap-4">
                                 <div className="flex-1 flex items-center gap-4 py-5 px-6 bg-green-50 rounded-[2.5rem] border border-green-100/50">
                                    <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                                    <span className="text-[11px] font-black text-green-700 uppercase tracking-widest">SECURED</span>
                                 </div>
                                 <div className="flex-1 flex items-center justify-center gap-3 py-5 px-6 bg-gold/5 rounded-[2.5rem] border border-gold/10">
                                    <Star size={18} fill="#FFD700" className="text-gold" />
                                    <span className="text-lg font-black text-gold-dark tabular-nums">+{todayLog.score}</span>
                                 </div>
                              </motion.div>
                           )}
                        </div>
                     </div>
                   )}
                </div>
             </div>
          </Card>

          {/* Right Column */}
          <div className="lg:col-span-12 xl:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-12 h-full">
            {/* Analytics */}
            <Card className="md:col-span-2 p-12 sm:p-14 bg-white border-none shadow-premium-xl rounded-[4rem] h-full flex flex-col min-h-[500px]">
               <div className="flex flex-col sm:flex-row items-start justify-between gap-8 mb-16">
                  <div className="space-y-2">
                     <h2 className="text-4xl font-black text-gray-900 tracking-tighter flex items-center gap-5 italic uppercase leading-none">
                        <TrendingUp className="text-saffron" size={36} /> PERFORMANCE
                     </h2>
                     <p className="text-[11px] text-gray-400 font-bold uppercase tracking-[0.3em] pl-14">Your Weekly Discipline Pulse</p>
                  </div>
                  {indexBuilding && (
                    <div className="flex items-center gap-3 text-[10px] font-black text-blue-600 bg-blue-50 px-6 py-3 rounded-full animate-pulse border border-blue-100">
                      <Loader2 size={14} className="animate-spin" />
                      <span>OPTIMIZING CORE ENGINE...</span>
                    </div>
                  )}
               </div>

               <div className="flex-1 w-full min-h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                       <defs>
                          <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                             <stop offset="0%" stopColor="#FF9933" />
                             <stop offset="100%" stopColor="#FFD700" />
                          </linearGradient>
                       </defs>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#00000008" />
                       <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill:'#9CA3AF', fontSize:11, fontWeight:900}} dy={20} />
                       <YAxis axisLine={false} tickLine={false} tick={{fill:'#9CA3AF', fontSize:11, fontWeight:900}} dx={-10} />
                       <Tooltip 
                        cursor={{fill: '#00000005', radius: 20}}
                        contentStyle={{ borderRadius: '2.5rem', border: 'none', boxShadow: '0 35px 70px -15px rgba(0,0,0,0.2)', padding: '28px' }}
                       />
                       <Bar dataKey="rounds" radius={[20, 20, 20, 20]} barSize={50}>
                          {chartData.map((entry, index) => (
                             <Cell key={`cell-${index}`} fill={entry.rounds >= entry.target ? "url(#barGradient)" : "#F3F4F6"} />
                          ))}
                       </Bar>
                    </BarChart>
                  </ResponsiveContainer>
               </div>
            </Card>

             <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12">
               {/* Digital Identity QR */}
               <Card className="md:col-span-5 p-10 sm:p-12 bg-white border-none shadow-premium-xl rounded-[3.5rem] relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-8 opacity-5 -mr-10 -mt-10 group-hover:opacity-10 transition-all duration-700">
                     <QrCode size={180} />
                  </div>
                  <div className="relative z-10 h-full flex flex-col items-center">
                    <div className="text-center mb-8">
                      <span className="text-[10px] font-black text-saffron uppercase tracking-[0.4rem] block mb-2 font-cinzel">VAIKUNTHA PASS</span>
                      <h4 className="text-3xl font-black text-gray-900 tracking-tighter leading-none uppercase italic">Your ID</h4>
                    </div>
                    
                    <div className="bg-cream/50 p-6 rounded-[2.5rem] border border-saffron/10 mb-8 w-full flex justify-center">
                       {user?.qrToken && (
                         <QRView value={user.qrToken} name={user.fullName || user.displayName || 'Devotee'} size={150} />
                       )}
                    </div>

                    <p className="text-[10px] font-bold text-gray-400 text-center uppercase tracking-widest leading-relaxed">
                      Permanent code for Attendance & <br/> Prasadam distribution
                    </p>
                  </div>
               </Card>

               {/* Sacred Rules Info Grid */}
               <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8 min-h-[400px]">
                   {[
                      { l: 'EARNINGS', v: '2 pts', d: 'Every round counts', c: 'text-blue-500', bg: 'bg-blue-50/70', icon: ShieldCheck },
                      { l: 'BONUS', v: '+10 pts', d: 'When goal reached', c: 'text-green-600', bg: 'bg-green-50/70', icon: CheckCircle2 },
                      { l: 'STREAK', v: 'BOOST', d: 'Higher streaks = More pts', c: 'text-purple-600', bg: 'bg-purple-50/70', icon: TrendingUp },
                      { l: 'RULE', v: 'STRICT', d: 'Miss 1 day = Streak 0', c: 'text-red-500', bg: 'bg-red-50/70', icon: Zap }
                   ].map((item, i) => (
                      <div key={i} className={`${item.bg} p-8 rounded-[2.5rem] transition-all hover:scale-[1.03] hover:bg-white hover:shadow-2xl border border-transparent hover:border-gray-100 group relative overflow-hidden flex flex-col justify-between`}>
                         <div className="flex items-center justify-between mb-4 relative z-10">
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 group-hover:text-gray-900 transition-colors uppercase">{item.l}</span>
                            <div className={`text-[9px] font-black ${item.c} bg-white shadow-md px-3 py-1 rounded-full border border-gray-50`}>{item.v}</div>
                         </div>
                         <p className="text-xs font-bold text-gray-700 leading-tight group-hover:translate-x-2 transition-transform relative z-10">{item.d}</p>
                         <item.icon className={`absolute -bottom-4 -right-4 opacity-5 group-hover:opacity-10 transition-opacity ${item.c}`} size={80} />
                      </div>
                   ))}
               </div>
             </div>

             {/* Vaikuntha History */}
             <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
                <Card className="p-10 bg-white border-none shadow-premium-xl rounded-[3.5rem] relative overflow-hidden group">
                   <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-4">
                         <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-600">
                            <CheckCircle2 size={24} />
                         </div>
                         <h3 className="text-xl font-black text-gray-900 tracking-tight uppercase italic">Attendance History</h3>
                      </div>
                   </div>
                   <div className="space-y-4">
                      {sadhanaData.attendance?.length > 0 ? sadhanaData.attendance.map((att, i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-transparent hover:border-green-100 transition-all">
                           <div className="flex flex-col">
                              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{att.session}</span>
                              <span className="text-sm font-bold text-gray-900">{new Date(att.createdAt?.toDate?.() || att.createdAt).toLocaleDateString()}</span>
                           </div>
                           <div className="text-right">
                              <span className="text-[10px] font-black text-green-600 bg-green-100/50 px-3 py-1 rounded-full uppercase tracking-tighter">Verified</span>
                           </div>
                        </div>
                      )) : (
                        <p className="text-gray-400 text-xs font-bold uppercase tracking-widest text-center py-6">No records found</p>
                      )}
                   </div>
                </Card>

                <Card className="p-10 bg-white border-none shadow-premium-xl rounded-[3.5rem] relative overflow-hidden group">
                   <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-4">
                         <div className="w-12 h-12 bg-saffron/10 rounded-2xl flex items-center justify-center text-saffron">
                            <Zap size={24} />
                         </div>
                         <h3 className="text-xl font-black text-gray-900 tracking-tight uppercase italic">Prasadam Log</h3>
                      </div>
                   </div>
                   <div className="space-y-4">
                      {sadhanaData.prasadam?.length > 0 ? sadhanaData.prasadam.map((p, i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-transparent hover:border-saffron/10 transition-all">
                           <div className="flex flex-col">
                              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{p.eventTitle}</span>
                              <span className="text-sm font-bold text-gray-900">{new Date(p.timestamp?.toDate?.() || p.timestamp).toLocaleDateString()}</span>
                           </div>
                           <div className="text-right">
                              <span className="text-[10px] font-black text-saffron bg-saffron/10 px-3 py-1 rounded-full uppercase tracking-tighter">Received</span>
                           </div>
                        </div>
                      )) : (
                        <p className="text-gray-400 text-xs font-bold uppercase tracking-widest text-center py-6">No records found</p>
                      )}
                   </div>
                </Card>
             </div>
          </div>
        </div>
      </motion.div>
      <div className="h-40" />
    </div>
  )
}

export default SadhanaTracker
