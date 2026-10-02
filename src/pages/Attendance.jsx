import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, 
  Clock, 
  MapPin, 
  Users, 
  QrCode as QrIcon,
  Ticket,
  CheckCircle2,
  XCircle,
  Info,
  Home
} from 'lucide-react'
import { db } from '../lib/firebase'
// Postgres-backed shim, NOT the real Firebase SDK: `db` is only a marker
// object now, so firebase/firestore helpers throw on it - and useFirestore
// swallows that, leaving the screen silently empty instead of erroring.
import { collection, query, where, getDocs, serverTimestamp, doc, runTransaction } from '../lib/pgstore'
import Card from '../components/ui/Card'
import { useFirestore } from '../hooks/useFirestore'
import RollCall from '../components/attendance/RollCall'
import { useAuth } from '../hooks/useAuth'

/** A profile's display name, in the order the data actually uses. */
export const devoteeName = (profile) =>
  (profile?.name || profile?.fullName || profile?.displayName || '').trim() || 'Devotee';

/**
 * Which event an "auto-detect" scan belongs to.
 *
 * Events are created without a `status` field (Events.jsx writes title,
 * category, date, dateISO, location, ...), so looking only for status ===
 * 'active' never matched and the fallback silently used events[0] — whatever
 * the backend happened to return first, typically the oldest event. Prefer an
 * explicitly active event, otherwise the one closest to right now, with
 * today/upcoming winning ties over a past one.
 */
export const pickActiveEvent = (events) => {
  const list = (events || []).filter(Boolean);
  if (!list.length) return null;
  const active = list.find((e) => String(e.status || '').toLowerCase() === 'active');
  if (active) return active;

  const now = Date.now();
  const scored = list
    .map((e) => {
      const t = Date.parse(e.dateISO || e.date || '');
      return Number.isNaN(t) ? null : { event: e, delta: t - now };
    })
    .filter(Boolean);
  if (!scored.length) return list[0];

  // Soonest upcoming (or in progress today); if everything is in the past,
  // the most recent one.
  const upcoming = scored.filter((s) => s.delta >= -12 * 3600000);
  const pool = upcoming.length ? upcoming : scored;
  pool.sort((a, b) => (upcoming.length ? a.delta - b.delta : b.delta - a.delta));
  return pool[0].event;
};

const Attendance = ({ onOpenScanner }) => {
  const { user } = useAuth();
  const attendanceQuery = React.useMemo(() => [], []);
  const { data: checkins, loading } = useFirestore('attendance', attendanceQuery);
  const [searchTerm, setSearchTerm] = useState('');
  // Local verification only for Manual Token Input
  const [tokenInput, setTokenInput] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState(null);
  
  const [scanMode, setScanMode] = useState('attendance'); 
  const [selectedEventId, setSelectedEventId] = useState('');
  
  const { data: events } = useFirestore('events');

  const { data: myRegistrations } = useFirestore('registrations', React.useMemo(() => [
    where('userId', '==', user?.uid || '')
  ], [user?.uid]));

  // Check-ins for whichever event is selected. Quick Stats used to count every
  // check-in ever recorded while the table beside it showed only the selected
  // event's, so the two never agreed.
  const eventCheckins = selectedEventId
    ? checkins.filter(c => c.eventId === selectedEventId)
    : checkins;

  const term = searchTerm.trim().toLowerCase();
  const filteredCheckins = eventCheckins.filter(c =>
    !term ||
    c.name?.toLowerCase().includes(term) ||
    c.session?.toLowerCase().includes(term)
  );

  const onTimeCount = eventCheckins.filter(c => c.status === 'On-time').length;
  const onTimeRate = eventCheckins.length
    ? `${Math.round((onTimeCount / eventCheckins.length) * 100)}%`
    : '—';


  const handleVerifyToken = async (e) => {
    e.preventDefault();
    const rawToken = tokenInput.trim();
    if (!rawToken) return;
    setVerifying(true);
    setVerifyResult(null);
    try {
      // Registration tokens are generated uppercase; a devotee's qrToken is
      // mixed case (it embeds the document id), so each lookup below uses the
      // casing that matches what was written.
      const input = rawToken.toUpperCase();
      let targetEventId = selectedEventId;
      let targetEventTitle = events.find(e => e.id === selectedEventId)?.title || '';

      // Auto-event fallback when the picker is left on "Auto-Detect Active
      // Event". This used to be unreachable: the handler bailed out with
      // "Select an event first!" before ever getting here, so the option the
      // UI offers could never actually be used.
      if (!targetEventId) {
        const auto = pickActiveEvent(events);
        if (auto) {
          targetEventId = auto.id;
          targetEventTitle = auto.title;
        }
      }

      if (!targetEventId) throw new Error('No events available to mark attendance.');
      if (!targetEventTitle) targetEventTitle = 'Current Event';

      // 1. Try Registrations first (standard token)
      const regQ = query(collection(db, 'registrations'), where('token', '==', input));
      const regSnap = await getDocs(regQ);
      
      let devoteeData = null;
      let notice = null;

      if (!regSnap.empty) {
        const regDoc = regSnap.docs[0].data();
        devoteeData = { id: regDoc.userId, name: regDoc.userName };
        if (regDoc.eventId !== targetEventId) {
          notice = `Note: Registered for "${regDoc.eventTitle || 'another event'}"`;
        }
      } else {
        // 2. Try Universal ID (QR Token or UID prefix)
        // Profiles store the devotee's name in `name` (Devotees.jsx, the
        // signup flow and useMembers all use it); `fullName`/`displayName` are
        // only ever fallbacks. Reading them first meant every QR-token scan
        // resolved to the literal string "Devotee" — on screen AND in the
        // attendance record that gets written below.
        const userQ = query(collection(db, 'users'), where('qrToken', '==', rawToken));
        const userSnap = await getDocs(userQ);

        if (!userSnap.empty) {
          const userDoc = userSnap.docs[0].data();
          devoteeData = { id: userSnap.docs[0].id, name: devoteeName(userDoc) };
          notice = "Verified via Universal Vaikuntha ID";
        } else {
          // 3. Try fallback to finding by UID directly if it looks like one (simple check)
          if (input.length >= 8) {
             const uidQ = query(collection(db, 'users'), where('uid', '==', rawToken)); // or use doc() if it's exact
             const uidSnap = await getDocs(uidQ);
             if (!uidSnap.empty) {
                const ud = uidSnap.docs[0].data();
                devoteeData = { id: uidSnap.docs[0].id, name: devoteeName(ud) };
                notice = "Verified via System UID";
             }
          }
        }
      }

      if (!devoteeData) throw new Error('No registration or devotee found with this code.');

      if (scanMode === 'attendance') {
        // A deterministic doc id + transaction (instead of a separate
        // "already checked in?" read followed by a separate write) closes a
        // race where two near-simultaneous scans of the same devotee (two
        // scanner stations, a flaky retry, a double-tap) could both see
        // "not checked in yet" and both write a duplicate record.
        const attendanceRef = doc(db, 'attendance', `${targetEventId}_${devoteeData.id}`);
        let alreadyCheckedIn = false;
        try {
          await runTransaction(db, async (transaction) => {
            const existing = await transaction.get(attendanceRef);
            if (existing.exists()) {
              alreadyCheckedIn = true;
              return;
            }
            transaction.set(attendanceRef, {
              userId: devoteeData.id,
              name: devoteeData.name,
              eventId: targetEventId,
              session: targetEventTitle,
              status: 'On-time',
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              createdAt: serverTimestamp()
            });
          });
        } catch (txError) {
          throw new Error(txError.message || 'Failed to record attendance.');
        }

        if (alreadyCheckedIn) {
          setVerifyResult({ success: false, message: 'Already checked in for this event!' });
        } else {
          // Check for Accommodation
          let accInfo = null;
          try {
            const accQ = query(collection(db, 'accommodation_requests'),
              where('userId', '==', devoteeData.id),
              where('status', '==', 'approved')
            );
            const accSnap = await getDocs(accQ);
            if (!accSnap.empty) accInfo = accSnap.docs[0].data();
          } catch (e) { console.error("Acc fetch error", e); }

          setVerifyResult({ 
            success: true, 
            message: `Entry Allowed for ${targetEventTitle}`,
            devotee: devoteeData,
            notice: notice,
            accommodation: accInfo
          });
          setTokenInput('');
        }
      } else {
        // Universal Manual Token for Prasadam - same deterministic-id +
        // transaction approach as attendance above, to avoid duplicate
        // prasadam records from near-simultaneous submissions.
        const prasadamRef = doc(db, 'prasadam_logs', `${targetEventId}_${devoteeData.id}`);
        let alreadyReceived = false;
        try {
          await runTransaction(db, async (transaction) => {
            const existing = await transaction.get(prasadamRef);
            if (existing.exists()) {
              alreadyReceived = true;
              return;
            }
            transaction.set(prasadamRef, {
              userId: devoteeData.id,
              name: devoteeData.name,
              eventId: targetEventId,
              eventTitle: targetEventTitle,
              received: true,
              timestamp: serverTimestamp()
            });
          });
        } catch (txError) {
          throw new Error(txError.message || 'Failed to record prasadam.');
        }

        if (alreadyReceived) {
          setVerifyResult({ success: false, message: 'Prasadam already received!' });
        } else {
          // Check for Accommodation
          let accInfo = null;
          try {
            const accQ = query(collection(db, 'accommodation_requests'),
              where('userId', '==', devoteeData.id),
              where('status', '==', 'approved')
            );
            const accSnap = await getDocs(accQ);
            if (!accSnap.empty) accInfo = accSnap.docs[0].data();
          } catch (e) { console.error("Acc fetch error", e); }

          setVerifyResult({ 
            success: true, 
            message: `Prasadam Served for ${targetEventTitle}`,
            devotee: devoteeData,
            notice: notice,
            accommodation: accInfo 
          });
          setTokenInput('');
        }
      }
    } catch (error) {
      console.error("Verification error:", error);
      setVerifyResult({ success: false, message: error.message });
    } finally {
      setVerifying(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 pb-12"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-poppins text-saffron-dark">Live Attendance</h1>
          <p className="text-sm text-gray-500">Real-time devotee check-ins and session tracking</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
           <select
             value={selectedEventId}
             onChange={(e) => setSelectedEventId(e.target.value)}
             className="w-full sm:w-auto px-4 py-2 bg-white border border-gray-100 rounded-xl text-sm font-bold text-gray-600 shadow-sm outline-none focus:border-saffron sm:min-w-[200px]"
           >
             <option value="">Select Active Event...</option>
             {events?.map(e => (
               <option key={e.id} value={e.id}>{e.title}</option>
             ))}
           </select>
           <button
             onClick={() => {
               onOpenScanner('attendance');
             }}
             className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-saffron to-gold text-white rounded-xl text-sm font-bold shadow-lg hover:shadow-xl transition-all"
           >
             <QrIcon size={16} />
             <span>Scan Pass</span>
           </button>
        </div>
      </div>

      {selectedEventId && (
        <RollCall
          eventId={selectedEventId}
          eventTitle={events?.find((e) => e.id === selectedEventId)?.title}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tracker Stats */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-premium bg-white p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <h2 className="text-lg font-bold text-gray-800">Recent Check-ins</h2>
              <div className="relative flex-1 md:max-w-xs">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search check-ins..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:border-saffron focus:bg-white transition-all font-medium"
                />
              </div>
            </div>

            <div className="-mx-6 sm:mx-0 overflow-x-auto scrollbar-hide">
              <div className="min-w-[600px] sm:min-w-full px-6 sm:px-0">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50/50 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">
                      <th className="px-6 py-4 font-black">Devotee</th>
                      <th className="px-6 py-4 font-black">Session</th>
                      <th className="px-6 py-4 font-black">Time</th>
                      <th className="px-6 py-4 font-black">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredCheckins.length > 0 ? filteredCheckins.map((row, i) => (
                      <tr key={i} className="hover:bg-saffron/5 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 shrink-0 rounded-lg bg-cream flex items-center justify-center text-[10px] font-bold text-saffron-dark border border-saffron/10 group-hover:bg-white">
                              {row.name?.charAt(0)}
                            </div>
                            <span className="font-bold text-gray-700">{row.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-500 font-medium">{row.session}</td>
                        <td className="px-6 py-4 flex items-center gap-2 text-gray-400">
                           <Clock size={14} className="text-gold" />
                           {row.time || 'N/A'}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                            row.status === 'On-time' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="4" className="px-6 py-20 text-center text-gray-400 font-medium italic">
                          <div className="flex flex-col items-center gap-3">
                            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-gray-200">
                               <Search size={24} />
                            </div>
                             <span>{term ? `No check-ins found for “${searchTerm.trim()}”.` : 'No check-ins recorded yet.'}</span>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        </div>

        {/* Admin/User Specific Views */}
        <div className="space-y-6">
          {user?.role !== 'devotee' ? (
            <Card className="p-5 sm:p-8 border-none shadow-premium bg-white">
            <h3 className="font-extrabold text-gray-800 mb-6 flex items-center gap-3 italic uppercase tracking-tighter">
                <div className="w-10 h-10 bg-saffron/10 rounded-xl flex items-center justify-center text-saffron shrink-0">
                   <QrIcon size={20} />
                </div>
                Verify Attendee
              </h3>
              
              <div className="space-y-4 mb-8">
                <select 
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold outline-none transition-all hover:border-saffron focus:border-saffron"
                >
                  <option value="">Auto-Detect Active Event</option>
                  {events?.map(e => (
                    <option key={e.id} value={e.id}>{e.title}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 mb-6 p-1 bg-gray-50 rounded-2xl">
                <button 
                  onClick={() => setScanMode('attendance')}
                  className={`flex-1 py-4 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
                    scanMode === 'attendance' ? 'bg-white shadow-premium text-saffron border border-saffron/10' : 'text-gray-400'
                  }`}
                >
                  Attendance Mode
                </button>
                <button 
                  onClick={() => setScanMode('prasadam')}
                  className={`flex-1 py-4 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
                    scanMode === 'prasadam' ? 'bg-white shadow-premium text-orange-600 border border-orange-100' : 'text-gray-400'
                  }`}
                >
                  Prasadam Mode
                </button>
              </div>

              <div className="space-y-4">
                <button 
                  disabled={verifying}
                  onClick={() => onOpenScanner(scanMode)}
                  className="w-full py-6 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-premium-xl flex items-center justify-center gap-3 hover:bg-black transition-all disabled:opacity-30"
                >
                  <QrIcon size={20} />
                  Open Camera Scanner
                </button>
                
                <div className="relative flex items-center gap-4 py-2">
                  <div className="h-px flex-1 bg-gray-100" />
                  <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">or use token</span>
                  <div className="h-px flex-1 bg-gray-100" />
                </div>

                <form onSubmit={handleVerifyToken} className="space-y-4">
                  <div className="relative">
                    <Ticket className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                    <input 
                      type="text" 
                      placeholder="8-digit token..."
                      value={tokenInput}
                      onChange={(e) => setTokenInput(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-saffron focus:bg-white transition-all font-mono font-bold uppercase tracking-widest text-lg"
                    />
                  </div>
                  <button 
                    disabled={verifying}
                    className="w-full py-5 bg-saffron text-white rounded-2xl font-black shadow-premium-xl transition-all hover:scale-[1.02] disabled:opacity-50 uppercase tracking-widest text-xs"
                  >
                    {verifying ? 'Verifying...' : 'Verify Manual Token'}
                  </button>
                </form>
              </div>

              <AnimatePresence>
                {verifyResult && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className={`mt-6 overflow-hidden rounded-[2.5rem] shadow-premium-xl border-4 ${
                      verifyResult.success 
                        ? 'bg-white border-green-500' 
                        : 'bg-white border-red-500'
                    }`}
                  >
                    <div className={`${verifyResult.success ? 'bg-green-500' : 'bg-red-500'} px-4 py-8 text-center text-white`}>
                        <div className="flex flex-col items-center gap-2">
                           {verifyResult.success ? (
                             <>
                               <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-2">
                                  <CheckCircle2 size={40} className="text-white" />
                               </div>
                               <h2 className="text-3xl sm:text-4xl font-black italic uppercase tracking-tighter">ALLOWED</h2>
                             </>
                           ) : (
                             <>
                               <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-2">
                                  <XCircle size={40} className="text-white" />
                               </div>
                               <h2 className="text-3xl sm:text-4xl font-black italic uppercase tracking-tighter">DENIED</h2>
                             </>
                           )}
                           <p className="font-bold text-xs uppercase tracking-[0.3em] opacity-80 px-2">{verifyResult.message}</p>
                        </div>
                    </div>

                    <div className="p-5 sm:p-8 space-y-6">
                      {verifyResult.success && verifyResult.devotee && (
                        <div className="flex items-center gap-4 sm:gap-5">
                          <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-3xl bg-gray-50 flex items-center justify-center text-2xl sm:text-3xl font-black text-gray-300 border border-gray-100 shadow-inner">
                              {verifyResult.devotee.name?.charAt(0)}
                          </div>
                          <div className="flex flex-col min-w-0">
                              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Devotee Identity</span>
                              <h3 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tighter italic uppercase truncate">{verifyResult.devotee.name}</h3>
                              <span className="text-[10px] font-mono font-bold text-saffron uppercase tracking-widest truncate">ID: {verifyResult.devotee.id?.slice(0,12)}...</span>
                          </div>
                        </div>
                      )}

                      {verifyResult.notice && (
                        <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-start gap-3">
                           <Info size={16} className="text-blue-500 mt-0.5 shrink-0" />
                           <p className="text-[11px] font-bold text-blue-700 leading-tight">{verifyResult.notice}</p>
                        </div>
                      )}

                      {verifyResult.accommodation && (
                        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 shadow-sm">
                           <div className="flex items-center gap-2 mb-3">
                              <Home size={14} className="text-amber-600" />
                              <span className="text-[10px] font-black uppercase tracking-widest text-amber-700">Reserved Stay</span>
                           </div>
                           <div className="flex justify-between items-center gap-3">
                              <span className="text-xs font-bold text-gray-800 truncate min-w-0">{verifyResult.accommodation.type}</span>
                              <div className="shrink-0 flex items-center gap-1.5 px-3 py-1 bg-white rounded-lg border border-amber-100">
                                 <Users size={12} className="text-amber-600" />
                                 <span className="text-[10px] font-black text-amber-700">{verifyResult.accommodation.guestCount}</span>
                              </div>
                           </div>
                        </div>
                      )}

                      <button 
                         onClick={() => setVerifyResult(null)}
                         className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-black transition-all"
                      >
                         Dismiss
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          ) : (
            <Card className="p-8 bg-gradient-to-br from-saffron to-gold text-white border-none shadow-premium overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
              <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                <Ticket size={24} /> My Registrations
              </h3>
              <p className="text-white/80 text-sm mb-6">Your unique tokens for upcoming events</p>
              
              <div className="space-y-4 relative z-10">
                {myRegistrations.length > 0 ? myRegistrations.map((reg) => (
                  <div key={reg.id} className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20">
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/60 mb-1">{reg.eventTitle}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-xl font-mono font-black tracking-tighter">{reg.token}</span>
                      <QrIcon size={20} className="text-white/40" />
                    </div>
                  </div>
                )) : (
                  <p className="text-sm italic opacity-60">No active registrations.</p>
                )}
              </div>
            </Card>
          )}

          <Card className="p-6 border-none shadow-premium bg-white">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Users size={18} className="text-saffron" />
              Quick Stats
            </h3>
            <div className="space-y-4">
               <div className="flex justify-between items-center p-3 rounded-xl bg-gray-50">
                  <span className="text-sm text-gray-500 font-medium">Total Present</span>
                  <span className="font-bold text-saffron-dark">{eventCheckins.length}</span>
               </div>
               <div className="flex justify-between items-center p-3 rounded-xl bg-gray-50">
                  <span className="text-sm text-gray-500 font-medium">On-time Rate</span>
                  <span className="font-bold text-green-600">{onTimeRate}</span>
               </div>
            </div>
          </Card>
        </div>
      </div>
    </motion.div>
  )
}

export default Attendance
