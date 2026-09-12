import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Flame, Calendar, ChevronRight, Loader2, Sparkles, Quote, ShieldCheck, Plus, Bell, Users, Home, CheckSquare, Trophy, Heart, X, IndianRupee } from 'lucide-react'
import Button from '../components/ui/Button'
import StatCard from '../components/dashboard/StatCard'
import CircularProgress from '../components/sadhana/CircularProgress'
import TaskItem from '../components/sadhana/TaskItem'
import Card from '../components/ui/Card'
import QRView from '../components/qr/QRView'
import { useAuth } from '../hooks/useAuth'
import { useFirestore } from '../hooks/useFirestore'
import { collection, query, where, getDocs, limit, doc, updateDoc } from 'firebase/firestore'
import { getSafeProfileImage } from '../lib/imageUtils'
import { functions, db } from '../lib/firebase'
import { httpsCallable } from 'firebase/functions'
import { callApi } from '../lib/api'
import { handlePayment } from '../lib/razorpay'

const AdminDashboard = ({ setActiveTab, onOpenScanner }) => {
  const { user } = useAuth();
  const today = new Date().toISOString().split('T')[0];
  
  // Real-time data hooks (Memoized to prevent SDK crashes)
  const requestsQuery = React.useMemo(() => [where('status', '==', 'Pending')], []);
  const sadhanaQuery = React.useMemo(() => [
    where('userId', '==', user?.uid || ''),
    where('date', '==', today)
  ], [user?.uid, today]);

  const { data: allUsers, loading: usersLoading } = useFirestore('users');
  const { data: allEvents, loading: eventsLoading } = useFirestore('events');
  const { data: allRequests, loading: requestsLoading } = useFirestore('accommodation_requests', requestsQuery);
  const { data: sadhanaLogs, loading: sadhanaLoading } = useFirestore('sadhana_logs', sadhanaQuery);
  const { data: allSevas, loading: sevasLoading } = useFirestore('sevas');

  const currentUserData = allUsers.find(u => u.id === user?.uid) || {};
  let realTimeStreak = currentUserData.streak || 0;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  
  if (currentUserData.lastSadhanaDate && currentUserData.lastSadhanaDate !== today && currentUserData.lastSadhanaDate !== yesterdayStr) {
    realTimeStreak = 0;
  }

  const stats = [
    { 
      label: 'Sadhana Score', 
      value: `${Math.min(sadhanaLogs[0]?.score || 0, 100)}%`, 
      sub: sadhanaLogs[0]?.score >= 100 ? 'Perfect!' : (sadhanaLogs[0]?.score >= 80 ? 'Excellent!' : 'Focus needed'), 
      color: 'saffron' 
    },
    { 
      label: 'Total Devotees', 
      value: allUsers.length.toLocaleString(), 
      sub: `+${allUsers.filter(u => u.createdAt?.toMillis() > Date.now() - 604800000).length} this week`, 
      color: 'gold',
      onClick: () => setActiveTab('devotees')
    },
    { 
      label: 'Upcoming Events', 
      value: allEvents.length.toString(), 
      sub: allEvents[0] ? `Next: ${allEvents[0].title}` : 'No events scheduled', 
      color: 'celestial',
      onClick: () => setActiveTab('events')
    },
    { 
      label: 'Pending Requests', 
      value: allRequests.length.toString(), 
      sub: 'Action Required', 
      color: 'saffron',
      onClick: () => setActiveTab('accommodation')
    },
    { 
      label: 'Seva Volunteers', 
      value: allSevas.reduce((acc, s) => acc + (s.countRegistered || 0), 0).toString(), 
      sub: `${allSevas.length} Active Sevas`, 
      color: 'gold',
      onClick: () => setActiveTab('seva')
    },
  ];

  const tasks = [
    { id: 'japa', label: 'Morning Japa', done: sadhanaLogs[0]?.tasks?.japa || false },
    { id: 'reading', label: 'Bhagavad Gita Study', done: sadhanaLogs[0]?.tasks?.reading || false },
    { id: 'aarti_m', label: 'Morning Aarti', done: sadhanaLogs[0]?.tasks?.aarti_m || false },
  ];

  const [backendStatus, setBackendStatus] = useState('checking');
  const [showDigitalId, setShowDigitalId] = useState(false);
  const [donation, setDonation] = useState(null);
  const [donationAmount, setDonationAmount] = useState(501);
  const [adminSetupState, setAdminSetupState] = useState({ status: 'idle', message: '' });

  const generateGrowthAudit = () => {
    const headers = ['Name', 'Role', 'Level', 'Streak', 'Longest Streak', 'Score', 'Phone', 'QR Token'];
    const rows = allUsers.map((u) => [u.name, u.role, u.level, u.streak || 0, u.longestStreak || 0, u.score || 0, u.phone || '', u.qrToken || '']);
    const csv = [headers, ...rows]
      .map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `growth_audit_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generateDigitalToken = async () => {
    if (user?.qrToken) return;
    try {
      const qrToken = `FOLK-${user.uid?.slice(0, 6) || 'ADMIN'}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
      await updateDoc(doc(db, 'users', user.uid), { qrToken });
    } catch (error) {
      console.error("Error generating digital ID token:", error);
    }
  };

  const confirmDonation = async () => {
    if (!donation) return;
    await handlePayment(user, donationAmount, donation.title, null);
    setDonation(null);
    setDonationAmount(501);
  };

  const createSiteAdmin = async () => {
    setAdminSetupState({ status: 'working', message: 'Setting up the shared admin login…' });
    try {
      const result = await callApi('createAdmin');
      setAdminSetupState({
        status: 'done',
        message: `Admin login ready → username: ${result.username}  ·  password: admin@folk123`,
      });
    } catch (error) {
      console.error("createAdmin failed:", error);
      setAdminSetupState({ status: 'error', message: error?.message || 'Failed to create admin login' });
    }
  };

  useEffect(() => {
    const checkBackend = async () => {
      try {
        const { message } = await callApi('ping');
        if (message === 'pong') setBackendStatus('online');
        else setBackendStatus('error');
      } catch (err) {
        console.error("Backend ping failed:", err);
        setBackendStatus('offline');
      }
    };
    checkBackend();
  }, []);

  if (usersLoading || eventsLoading || requestsLoading || sadhanaLoading || sevasLoading) {
    return (
      <div className="h-[70vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-saffron" size={48} />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="pb-10"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-3xl font-bold font-poppins text-saffron-dark">Haribol, {user?.name || user?.displayName?.split(' ')[0] || 'Devotee'} 👋</h1>
            <Sparkles className="text-gold animate-pulse" size={24} />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-gray-500 italic min-w-0">
              <Quote size={14} className="text-saffron opacity-50 shrink-0" />
               <p className="text-sm">&ldquo;The soul is the same in all, but the quality of devotion shines uniquely.&rdquo;</p>
            </div>
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shrink-0 ${
              backendStatus === 'online' ? 'bg-green-100 text-green-600' : 
              backendStatus === 'offline' ? 'bg-red-100 text-red-600' : 
              'bg-gray-100 text-gray-400'
            }`}>
              <div className={`w-1.5 h-1.5 rounded-full ${backendStatus === 'online' ? 'bg-green-500 animate-pulse' : 'bg-current'}`} />
              Backend: {backendStatus}
            </div>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <motion.div whileHover={{ scale: 1.05 }} className="w-full sm:w-auto">
            <Card className="px-6 py-3 flex items-center gap-4 bg-white shadow-premium border-none" hover={false}>
              <div className="w-10 h-10 bg-saffron/10 rounded-xl flex items-center justify-center shrink-0">
                <Flame className="text-saffron" fill="#FF9933" size={20} />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest leading-none mb-1">STREAK</p>
                <p className="text-lg font-bold leading-none text-saffron-dark">{realTimeStreak} Days</p>
              </div>
            </Card>
          </motion.div>
          <Button
               onClick={() => setShowDigitalId(true)}
               className="w-full sm:w-auto bg-gradient-to-r from-saffron to-gold shadow-lg shadow-saffron/20 border-none px-8 font-bold rounded-xl flex items-center justify-center"
             >
              Digital ID
            </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {stats.map((stat, i) => (
          <StatCard key={i} {...stat} />
        ))}
      </div>

      {/* Quick Actions Row */}
      <div className="mb-10">
        <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.3em] mb-4">Command Center</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Add Devotee', icon: <Plus size={20} />, tab: 'devotees', color: 'bg-saffron text-white shadow-saffron/20' },
            { label: 'New Event', icon: <Calendar size={20} />, tab: 'events', color: 'bg-gold text-white shadow-gold/20' },
            { label: 'Manage Seva', icon: <Heart size={20} />, tab: 'seva', color: 'bg-orange-500 text-white shadow-orange-200' },
            { label: 'Verify Stay', icon: <Home size={20} />, tab: 'accommodation', color: 'bg-celestial text-white shadow-celestial/20' },
            { label: 'Scan Check-in', icon: <CheckSquare size={20} />, tab: 'attendance', color: 'bg-purple-600 text-white shadow-purple-200' },
          ].map((action, i) => (
            <motion.button
              key={i}
              whileHover={{ y: -5, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                if (action.tab === 'attendance') {
                  onOpenScanner('attendance');
                } else {
                  setActiveTab(action.tab);
                }
              }}
              className={`flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-2xl font-bold text-xs sm:text-sm shadow-lg transition-all ${action.color}`}
            >
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                {action.icon}
              </div>
              {action.label}
            </motion.button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="p-8 border-none shadow-premium bg-white">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-3">
                <Calendar className="text-saffron" size={24} />
                Upcoming Spiritual Gatherings
              </h2>
              <button onClick={() => setActiveTab('events')} className="text-saffron font-bold hover:translate-x-1 transition-transform text-xs uppercase tracking-widest">View All</button>
            </div>
            <div className="space-y-4">
              {allEvents.length > 0 ? allEvents.slice(0, 3).map((event) => (
                <motion.div 
                   key={event.id} 
                   whileHover={{ x: 10 }}
                   className="flex flex-col sm:flex-row gap-5 p-5 rounded-2xl bg-cream/20 hover:bg-cream/40 transition-all border border-transparent hover:border-saffron/10 group cursor-pointer shadow-sm hover:shadow-md"
                >
                  <div className="w-full sm:w-36 h-24 rounded-2xl overflow-hidden relative shadow-md">
                    <img src={event.img} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={event.title} />
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                       <span className="text-[10px] font-black tracking-[0.2em] text-saffron uppercase bg-white px-2 py-0.5 rounded-md shadow-sm">{event.category}</span>
                       <span className="text-[10px] text-green-500 font-bold">• {event.attendingCount || 0} Attending</span>
                       <span className="text-[10px] text-red-400 font-bold">• {event.declinedCount || 0} Declined</span>
                    </div>
                    <h4 className="font-bold text-xl text-gray-800 group-hover:text-saffron transition-colors">{event.title}</h4>
                    <div className="flex items-center gap-4 mt-3 text-sm text-gray-500 font-medium">
                      <span className="flex items-center gap-2"><Calendar size={16} className="text-gold" /> {event.date}</span>
                      <span className="hidden sm:inline text-gray-300">•</span>
                      <span className="truncate max-w-[150px]">{event.location}</span>
                    </div>
                  </div>
                  <button className="hidden sm:flex self-center w-10 h-10 rounded-full bg-white shadow-sm border border-gray-100 items-center justify-center text-saffron group-hover:bg-saffron group-hover:text-white transition-all">
                    <ChevronRight size={20} />
                  </button>
                </motion.div>
              )) : (
                <div className="p-10 text-center text-gray-400 italic">No upcoming events scheduled.</div>
              )}
            </div>
            <div className="mt-8 pt-8 border-t border-gray-50 flex justify-center">
               <Button onClick={() => { window.location.hash = '#new'; setActiveTab('events'); }} className="bg-saffron/10 text-saffron-dark border-none hover:bg-saffron hover:text-white transition-all px-10 font-bold rounded-xl flex items-center gap-2">
                 <Plus size={18} />
                 Create New Event
               </Button>
            </div>
          </Card>

          <Card className="p-8 border-none shadow-premium bg-white overflow-hidden">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-3">
                <ShieldCheck className="text-saffron" size={24} />
                Recent Accommodation Requests
              </h2>
              <span className="px-3 py-1 bg-saffron/10 text-saffron text-[10px] font-black rounded-lg uppercase tracking-wider">
                {allRequests.length} Pending Actions
              </span>
            </div>
            
            <div className="-mx-4 sm:mx-0 overflow-x-auto pb-4 scrollbar-hide">
              <div className="min-w-[600px] sm:min-w-full px-4 sm:px-0">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-50">
                      <th className="pb-4 font-black">Devotee</th>
                      <th className="pb-4 font-black">Type</th>
                      <th className="pb-4 font-black">Date Range</th>
                      <th className="pb-4 font-black">Status</th>
                      <th className="pb-4 font-black">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {allRequests.length > 0 ? allRequests.map((req) => (
                      <tr key={req.id} className="group hover:bg-gray-50/50 transition-colors">
                        <td className="py-4 font-bold text-gray-700">{req.userName || 'Unknown'}</td>
                        <td className="py-4 text-sm text-gray-500">{req.type}</td>
                        <td className="py-4 text-sm text-gray-400 font-medium">
                          {req.arrivalDate} → {req.departureDate}
                        </td>
                        <td className="py-4">
                          <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-[10px] font-bold rounded-lg uppercase tracking-wider">
                            {req.status}
                          </span>
                        </td>
                        <td className="py-4 text-right">
                          <Button
                            onClick={() => setActiveTab('accommodation')}
                            className="py-2 px-4 text-[10px] bg-saffron/10 text-saffron-dark font-bold rounded-lg border-none hover:bg-saffron hover:text-white transition-all"
                          >
                            Manage
                          </Button>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="5" className="py-20 text-center space-y-4">
                           <div className="flex flex-col items-center justify-center text-gray-300">
                             <ShieldCheck size={40} className="mb-4 opacity-20" />
                             <p className="text-sm font-bold uppercase tracking-widest text-gray-400">All caught up!</p>
                             <p className="text-xs mt-1">No pending accommodation requests.</p>
                             <Button 
                              variant="secondary" 
                              onClick={() => setActiveTab('accommodation')}
                              className="mt-6 border-saffron/20 text-saffron-dark hover:bg-saffron/5"
                             >
                               Create New Request
                             </Button>
                           </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>

          <Card className="p-8 border-none shadow-premium bg-white overflow-hidden">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-3">
                <Heart className="text-orange-500" size={24} />
                Seva Opportunity Monitoring
              </h2>
              <button onClick={() => setActiveTab('seva')} className="text-orange-500 font-bold hover:underline text-xs uppercase tracking-widest">Manage All</button>
            </div>
            
            <div className="space-y-4">
              {allSevas.length > 0 ? allSevas.slice(0, 5).map((seva) => (
                <div key={seva.id} className="p-4 rounded-2xl bg-gray-50 border border-transparent hover:border-orange-100 transition-all">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-bold text-gray-800">{seva.title}</h4>
                    <span className="text-[10px] font-black text-orange-500 bg-orange-50 px-2 py-1 rounded-lg uppercase">
                      {seva.sevaType}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                    <span className="flex items-center gap-1"><Calendar size={12} /> {seva.date}</span>
                    <span className="flex items-center gap-1"><Users size={12} /> {seva.countRegistered || 0} / {seva.maxVolunteers} Joined</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-orange-500 transition-all duration-500" 
                      style={{ width: `${Math.min(100, ((seva.countRegistered || 0) / (seva.maxVolunteers || 1)) * 100)}%` }}
                    />
                  </div>
                </div>
              )) : (
                <div className="p-10 text-center text-gray-300 italic">No active sevas to monitor.</div>
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="p-8 bg-gradient-to-br from-white to-saffron/5 border-none shadow-premium">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold text-gray-800">My Sadhana</h2>
              <div className="px-3 py-1 bg-saffron/10 rounded-lg text-[10px] font-black text-saffron uppercase">Today</div>
            </div>
            <div className="flex flex-col items-center">
              <CircularProgress current={sadhanaLogs[0]?.rounds || 0} total={16} label="Daily Rounds" />
              <div className="mt-10 w-full space-y-4">
                {tasks.map((task, i) => (
                  <TaskItem key={i} {...task} />
                ))}
              </div>
              <Button 
                variant="secondary" 
                className="w-full mt-8 py-4 font-bold border-saffron/20 text-saffron-dark hover:bg-saffron/5 rounded-xl transition-all"
              >
                Detailed Tracker
              </Button>
            </div>
          </Card>

          <Card className="p-8 border-none shadow-premium bg-white">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Trophy size={20} className="text-gold" />
                Top Performers
              </h3>
              <button 
                onClick={() => setActiveTab('devotees')} 
                className="text-xs font-bold text-saffron uppercase tracking-widest hover:underline"
              >
                View All
              </button>
            </div>
            <div className="max-h-[410px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-saffron/20 scrollbar-track-transparent">
              <div className="space-y-4">
                {[...allUsers]
                  .sort((a, b) => (b.score || 0) - (a.score || 0))
                  .slice(0, 20)
                  .map((d, i) => (
                    <div key={d.id} className="flex items-center justify-between p-3 rounded-2xl bg-gray-50/50 hover:bg-white hover:shadow-md transition-all group border border-transparent hover:border-saffron/10">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-saffron/10 to-gold/10 flex items-center justify-center font-bold text-saffron-dark overflow-hidden">
                          {d.photo ? (
                            <img 
                              src={getSafeProfileImage(d.photo, d.name)} 
                              alt="" 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span>{d.name?.charAt(0) || 'D'}</span>
                          )}
                        </div>
                        {i < 3 && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-gold text-[8px] flex items-center justify-center text-white border-2 border-white font-black">
                            {i + 1}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-gray-800 text-sm truncate max-w-[100px] xs:max-w-[150px] lg:max-w-none">{d.name}</p>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400">
                           <Flame size={10} className="text-saffron" />
                           <span>{d.streak || 0}d Streak</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                       <p className="font-black text-saffron-dark text-sm">{Math.max(0, d.score || 0)}</p>
                       <p className="text-[10px] font-bold text-gray-300 uppercase">Points</p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </Card>

          <Card className="p-8 border-none shadow-premium bg-white">
            <h3 className="text-xl font-bold mb-6 text-gray-800 flex items-center gap-2">
              <Users size={20} className="text-saffron" />
              Devotee Reports
            </h3>
            <div className="space-y-6">
              {[
                { label: 'Folks Heads', count: allUsers.filter(u => u.role === 'folks_head').length, color: 'bg-saffron' },
                { label: 'Devotees', count: allUsers.filter(u => u.role === 'devotee').length, color: 'bg-gold' },
                { label: 'Administrators', count: allUsers.filter(u => u.role === 'admin').length, color: 'bg-celestial' },
              ].map((report, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-gray-500">
                    <span>{report.label}</span>
                    <span>{report.count}</span>
                  </div>
                  <div className="w-full h-2 bg-gray-50 rounded-full overflow-hidden">
                     <div 
                      className={`h-full ${report.color} transition-all duration-1000`} 
                      style={{ width: `${(report.count / (allUsers.length || 1)) * 100}%` }} 
                     />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-8 border-t border-gray-50">
               <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] mb-4">Devotee Levels (1-5)</h4>
               <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((lvl) => {
                    const count = allUsers.filter(u => u.level === String(lvl)).length;
                    const pct = (count / (allUsers.length || 1)) * 100;
                    return (
                      <div 
                        key={lvl} 
                        className={`h-1.5 rounded-full transition-all duration-700 ${
                          lvl === 1 ? 'bg-saffron' : lvl === 2 ? 'bg-gold' : lvl === 3 ? 'bg-celestial' : lvl === 4 ? 'bg-purple-400' : 'bg-green-400'
                        }`}
                        style={{ width: `${pct}%`, minWidth: count > 0 ? '4px' : '0' }}
                        title={`Level ${lvl}: ${count} devotees`}
                      />
                    )
                  })}
               </div>
               <div className="flex justify-between mt-3">
                  <span className="text-[9px] font-bold text-gray-300 uppercase">Foundation</span>
                  <span className="text-[9px] font-bold text-gray-300 uppercase">Expert</span>
               </div>
            </div>
            <div className="mt-8 pt-6 border-t border-gray-50">
               <div className="p-4 bg-cream/30 rounded-2xl border border-saffron/10 mb-4">
                  <p className="text-[10px] font-black uppercase text-saffron mb-1">Total Active Community</p>
                  <p className="text-2xl font-black text-saffron-dark">{allUsers.length}</p>
               </div>
               <Button variant="secondary" onClick={generateGrowthAudit} className="w-full py-3 border-gray-100 text-gray-400 text-xs font-bold uppercase tracking-widest hover:text-saffron hover:border-saffron/20">
                Generate Growth Audit
               </Button>
            </div>
          </Card>

          <Card className="p-8 border-none shadow-premium bg-gradient-to-br from-white to-gold/10 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10">
                <Sparkles size={40} className="text-gold" />
             </div>
             <h3 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
              Seva & Donations
            </h3>
            <p className="text-xs text-gray-500 mb-6 leading-relaxed">Your contributions fuel the mission of spreading devotion and community growth.</p>
            <div className="space-y-3">
               <button onClick={() => { setDonation({ sevaId: 'temple_construction', title: 'Temple Construction Seva' }); setDonationAmount(501); }} className="w-full py-4 px-6 bg-white border border-gold/20 rounded-2xl flex items-center justify-between group hover:bg-gold hover:text-white transition-all shadow-sm">
                  <span className="font-bold text-sm">Temple Construction Seva</span>
                  <ChevronRight size={16} />
               </button>
               <button onClick={() => { setDonation({ sevaId: 'annadan', title: 'Annadan (Feed the Needy)' }); setDonationAmount(501); }} className="w-full py-4 px-6 bg-white border border-gold/20 rounded-2xl flex items-center justify-between group hover:bg-gold hover:text-white transition-all shadow-sm">
                  <span className="font-bold text-sm">Annadan (Feed the Needy)</span>
                  <ChevronRight size={16} />
               </button>
            </div>
            <Button onClick={() => { setDonation({ sevaId: 'general', title: 'General Donation' }); setDonationAmount(501); }} className="w-full mt-6 bg-gradient-to-r from-gold to-saffron border-none font-bold py-4 rounded-xl shadow-lg">
               Donate with Razorpay
            </Button>
          </Card>

          <Card className="p-8 border-none shadow-premium bg-gradient-to-br from-white to-celestial/10 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10">
                <ShieldCheck size={40} className="text-celestial" />
             </div>
             <h3 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
              Site Admin Access
            </h3>
            <p className="text-xs text-gray-500 mb-6 leading-relaxed">Authorize a dedicated administrator login for managing the whole site. The shared login uses username <span className="font-bold text-gray-700">admin</span> and password <span className="font-bold text-gray-700">admin@folk123</span>.</p>
            <div className="flex flex-wrap gap-2 mb-6">
               <span className="px-3 py-1.5 rounded-full bg-celestial/10 text-celestial text-[10px] font-black uppercase tracking-widest">Username: admin</span>
               <span className="px-3 py-1.5 rounded-full bg-saffron/10 text-saffron text-[10px] font-black uppercase tracking-widest">Password: admin@folk123</span>
            </div>
            <Button
              onClick={createSiteAdmin}
              disabled={adminSetupState.status === 'working'}
              className="w-full bg-gradient-to-r from-celestial to-purple-500 border-none font-bold py-4 rounded-xl shadow-lg"
            >
              {adminSetupState.status === 'working' ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'Create / Reset Admin Login'}
            </Button>
            {adminSetupState.status !== 'idle' && (
              <p className={`mt-4 text-xs font-bold text-center ${adminSetupState.status === 'error' ? 'text-red-500' : 'text-green-600'}`}>
                {adminSetupState.message}
              </p>
            )}
          </Card>
        </div>
      </div>

      {/* Digital ID Modal */}
      <AnimatePresence>
        {showDigitalId && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDigitalId(false)}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm max-h-[90vh] overflow-y-auto overflow-x-hidden bg-white rounded-[2.5rem] sm:rounded-[3.5rem] shadow-premium-xl p-6 sm:p-10 text-center border border-white"
            >
              <button
                onClick={() => setShowDigitalId(false)}
                aria-label="Close"
                className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
              >
                <X size={20} />
              </button>

              <div className="mb-6">
                <span className="text-[10px] font-black text-saffron uppercase tracking-[0.4rem] block mb-2">Vaikuntha ID Card</span>
                <h2 className="text-3xl font-black text-gray-900 tracking-tighter uppercase italic leading-none">
                  {user?.name || user?.displayName || 'Devotee'}
                </h2>
              </div>

              {user?.qrToken ? (
                <QRView value={user.qrToken} name={user?.name || user?.displayName || 'Devotee'} />
              ) : (
                <div className="py-10 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-100">
                  <p className="text-gray-400 font-bold uppercase tracking-widest text-xs mb-4">No ID token yet</p>
                  <button
                    onClick={generateDigitalToken}
                    className="px-6 py-3 bg-saffron text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-saffron-dark transition-all"
                  >
                    Generate Digital ID
                  </button>
                </div>
              )}

              <p className="mt-8 text-[11px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed">
                Scan for Attendance & Prasadam <br/>
                <span className="text-saffron-dark/40 font-black">Folkvizag Devotee Management</span>
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Donation Modal */}
      <AnimatePresence>
        {donation && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDonation(null)}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md max-h-[90vh] overflow-y-auto bg-white rounded-3xl shadow-premium-xl p-6 sm:p-8"
            >
              <button
                onClick={() => setDonation(null)}
                aria-label="Close"
                className="absolute top-5 right-5 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
              >
                <X size={18} />
              </button>

              <div className="w-12 h-12 bg-gradient-to-br from-gold to-saffron rounded-2xl flex items-center justify-center mb-5 shadow-lg">
                <IndianRupee size={22} className="text-white" />
              </div>
              <h3 className="text-2xl font-black text-gray-900 tracking-tight">{donation.title}</h3>
              <p className="text-sm text-gray-500 mt-1 mb-8">Choose an amount for your contribution.</p>

              <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-6">
                {[101, 501, 1001, 5001, 10001].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setDonationAmount(amt)}
                    className={`py-3 px-1 rounded-2xl font-black text-xs sm:text-sm transition-all border-2 ${
                      donationAmount === amt
                        ? 'bg-saffron/5 border-saffron text-saffron'
                        : 'bg-gray-50 border-transparent text-gray-500 hover:border-saffron/30'
                    }`}
                  >
                    ₹{amt.toLocaleString('en-IN')}
                  </button>
                ))}
              </div>

              <div className="relative mb-8">
                <IndianRupee size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="number"
                  min={1}
                  value={donationAmount}
                  onChange={(e) => setDonationAmount(parseInt(e.target.value) || 0)}
                  className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:bg-white focus:border-saffron font-black text-gray-900 transition-all"
                  placeholder="Custom amount"
                />
              </div>

              <Button
                onClick={confirmDonation}
                disabled={donationAmount <= 0}
                className="w-full py-4 bg-gradient-to-r from-gold to-saffron border-none font-black rounded-2xl disabled:opacity-50"
              >
                Donate ₹{donationAmount.toLocaleString('en-IN')} via Razorpay
              </Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default AdminDashboard
