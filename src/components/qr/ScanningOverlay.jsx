import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  CheckCircle2, 
  XCircle, 
  Info,
  QrCode,
  ShieldCheck,
  Zap,
  Coffee,
  Users
} from 'lucide-react';
import QRScanner from './QRScanner';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs, serverTimestamp, doc, runTransaction } from '../../lib/pgstore';
import { useFirestore } from '../../hooks/useFirestore';
import { useAuth } from '../../hooks/useAuth';

/**
 * A profile's display name, in the order the data actually uses: `name` is
 * what Devotees.jsx, the signup flow and useMembers all write; fullName and
 * displayName are only ever fallbacks.
 */
const devoteeName = (profile) =>
  (profile?.name || profile?.fullName || profile?.displayName || '').trim() || 'Devotee';

/**
 * Which event a scan belongs to.
 *
 * Events are created without a `status` field (Events.jsx writes title,
 * category, date, dateISO, location, ...), so `status === 'active'` never
 * matched and the old fallback silently used events[0] — whatever the backend
 * returned first, typically the oldest event, meaning tonight's scans landed
 * on a programme from months ago. Prefer an explicitly active event, else the
 * one closest to now, with today/upcoming beating a past one.
 *
 * Mirrors pickActiveEvent in pages/Attendance.jsx; kept local so the scanner
 * doesn't import a page module.
 */
const pickActiveEvent = (events) => {
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

  const upcoming = scored.filter((s) => s.delta >= -12 * 3600000);
  const pool = upcoming.length ? upcoming : scored;
  pool.sort((a, b) => (upcoming.length ? a.delta - b.delta : b.delta - a.delta));
  return pool[0].event;
};

const ScanningOverlay = ({ isOpen, onClose, initialMode = 'attendance' }) => {
  const { user } = useAuth();
  const [scanMode, setScanMode] = useState(initialMode);
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState(null);
  const { data: events } = useFirestore('events');

  useEffect(() => {
    if (isOpen) {
      setVerifyResult(null);
      setScanMode(initialMode);
    }
  }, [isOpen, initialMode]);

  const handleScan = async (qrToken) => {
    setVerifying(true);
    setVerifyResult(null);
    try {
      // 1. Find user by qrToken
      const userQ = query(collection(db, 'users'), where('qrToken', '==', qrToken));
      const userSnap = await getDocs(userQ);
      
      if (userSnap.empty) throw new Error('Invalid QR Code / Devotee not found');
      
      const profile = userSnap.docs[0].data();
      const devotee = { id: userSnap.docs[0].id, ...profile, name: devoteeName(profile) };

      // Auto-detect the event this scan belongs to.
      const event = pickActiveEvent(events);

      if (!event) throw new Error('No active events found. Please create an event in the dashboard first.');

      if (scanMode === 'attendance') {
        // Deterministic doc id + transaction instead of a separate
        // read-then-write, so two near-simultaneous scans of the same
        // devotee can't both slip past the "already checked in?" check.
        const attendanceRef = doc(db, 'attendance', `${event.id}_${devotee.id}`);
        let alreadyCheckedIn = false;
        await runTransaction(db, async (transaction) => {
          const existing = await transaction.get(attendanceRef);
          if (existing.exists()) {
            alreadyCheckedIn = true;
            return;
          }
          transaction.set(attendanceRef, {
            userId: devotee.id,
            name: devotee.name,
            eventId: event.id,
            session: event.title,
            status: 'On-time',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            createdAt: serverTimestamp()
          });
        });

        if (alreadyCheckedIn) throw new Error(`${devotee.name} already checked in!`);

        // Check for Accommodation
        let accInfo = null;
        try {
          const accQ = query(collection(db, 'accommodation_requests'),
            where('userId', '==', devotee.id),
            where('status', '==', 'approved')
          );
          const accSnap = await getDocs(accQ);
          if (!accSnap.empty) accInfo = accSnap.docs[0].data();
        } catch (e) { console.error("Acc fetch error", e); }

        setVerifyResult({ 
          success: true, 
          message: `Attendance marked for ${event.title}`,
          devotee,
          accommodation: accInfo
        });
      } else {
        // Prasadam Logic - same deterministic-id + transaction approach.
        const prasadamRef = doc(db, 'prasadam_logs', `${event.id}_${devotee.id}`);
        let alreadyReceived = false;
        await runTransaction(db, async (transaction) => {
          const existing = await transaction.get(prasadamRef);
          if (existing.exists()) {
            alreadyReceived = true;
            return;
          }
          transaction.set(prasadamRef, {
            userId: devotee.id,
            name: devotee.name,
            eventId: event.id,
            eventTitle: event.title,
            received: true,
            timestamp: serverTimestamp()
          });
        });

        if (alreadyReceived) throw new Error(`${devotee.name} already received prasadam!`);

        setVerifyResult({ 
          success: true, 
          message: `Mahaprasadam served to ${devotee.name}!`,
          devotee
        });
      }
    } catch (error) {
      setVerifyResult({ success: false, message: error.message });
    } finally {
      setVerifying(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-ink/85"
          onClick={onClose}
        />

        {/* Scanner / Result Window */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          className="relative w-full max-w-xl bg-white rounded-xl sm:rounded-xl shadow-2xl overflow-x-hidden overflow-y-auto max-h-[90vh]"
        >
          {!verifyResult ? (
            <>
              {/* Header */}
              <div className="p-5 sm:p-8 border-b border-line flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse shrink-0" />
                    <span className="text-[10px] font-bold text-ink-muted uppercase tracking-label">Scanner Live</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-ink uppercase tracking-tight">
                    Universal Verification
                  </h3>
                </div>
                <button
                  onClick={onClose}
                  aria-label="Close"
                  className="p-3 min-w-[44px] min-h-[44px] flex items-center justify-center shrink-0 bg-paper-dark text-ink-muted hover:text-ink rounded-2xl transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Mode Toggle */}
              <div className="px-5 sm:px-8 mt-6">
                <div className="flex gap-2 p-1.5 bg-paper-dark rounded-2xl">
                  <button
                    onClick={() => setScanMode('attendance')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-bold uppercase tracking-label transition-all ${
                      scanMode === 'attendance' ? 'bg-white shadow-lg text-saffron' : 'text-ink-muted hover:text-ink'
                    }`}
                  >
                    <Users size={14} /> Attendance
                  </button>
                  <button
                    onClick={() => setScanMode('prasadam')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-bold uppercase tracking-label transition-all ${
                      scanMode === 'prasadam' ? 'bg-white shadow-lg text-orange-600' : 'text-ink-muted hover:text-ink'
                    }`}
                  >
                    <Coffee size={14} /> Prasadam
                  </button>
                </div>
              </div>

              {/* Scanner Area */}
              <div className="p-5 sm:p-8">
                <div className="relative rounded-xl overflow-hidden border-4 border-line/60 bg-paper aspect-square">
                  <QRScanner onScan={handleScan} onClose={onClose} mode={scanMode} />
                  {verifying && (
                    <div className="absolute inset-0 bg-white flex flex-col items-center justify-center gap-4 z-50">
                      <Zap className="text-saffron animate-bounce" size={40} />
                      <p className="text-[10px] font-bold uppercase tracking-label text-ink-muted text-center px-4">Verifying Identity...</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            /* Verification Result (ALLOWED Modal) */
            <div className={`p-6 sm:p-10 text-center ${verifyResult.success ? 'bg-white' : 'bg-red-50'}`}>
              <div className="flex justify-center mb-8">
                {verifyResult.success ? (
                  <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center shadow-lg shadow-green-100">
                    <CheckCircle2 size={48} />
                  </div>
                ) : (
                  <div className="w-24 h-24 bg-red-100 text-red-600 rounded-full flex items-center justify-center shadow-lg shadow-red-100">
                    <XCircle size={48} />
                  </div>
                )}
              </div>

              {verifyResult.success ? (
                <>
                  <div className="mb-8">
                    <span className="px-4 py-1.5 bg-green-100 text-green-700 rounded-full text-[10px] font-bold uppercase tracking-label mb-4 inline-block">
                      {scanMode === 'attendance' ? 'Entry Allowed' : 'Prasadam Allowed'}
                    </span>
                    <h4 className="text-2xl sm:text-3xl font-bold text-ink uppercase tracking-tight mb-2 break-words">
                      {verifyResult.devotee?.name}
                    </h4>
                    <p className="text-ink-muted font-bold">{verifyResult.message}</p>
                  </div>

                  {verifyResult.accommodation && (
                    <div className="mb-8 p-6 bg-blue-50/50 rounded-3xl border border-blue-100 flex items-center gap-4 text-left">
                      <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center">
                        <ShieldCheck size={24} />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-blue-600 uppercase tracking-label mb-1">Accommodation Check</p>
                        <p className="text-sm font-bold text-blue-900 leading-tight">
                          Approved: {verifyResult.accommodation.roomType} <br/>
                          <span className="text-blue-600/70 font-medium">Guest Count: {verifyResult.accommodation.guestCount}</span>
                        </p>
                      </div>
                    </div>
                  )}

                  <button 
                    onClick={() => setVerifyResult(null)}
                    className="w-full py-5 bg-ink text-white rounded-2xl font-bold text-xs uppercase tracking-label shadow-xl hover:bg-black transition-all"
                  >
                    Done
                  </button>
                </>
              ) : (
                <>
                  <h4 className="text-2xl font-bold text-red-900 uppercase tracking-tight mb-4">
                    Verification Failed
                  </h4>
                  <div className="p-4 bg-white rounded-2xl border border-red-100 mb-8 flex items-start gap-3 text-left">
                    <Info size={18} className="text-red-500 shrink-0 mt-0.5" />
                    <p className="text-sm font-bold text-red-600/80 leading-relaxed">{verifyResult.message}</p>
                  </div>
                  <button 
                    onClick={() => setVerifyResult(null)}
                    className="w-full py-5 bg-red-600 text-white rounded-2xl font-bold text-xs uppercase tracking-label shadow-xl hover:bg-red-700 transition-all"
                  >
                    Retry Scan
                  </button>
                </>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ScanningOverlay;
