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
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { useFirestore } from '../../hooks/useFirestore';
import { useAuth } from '../../hooks/useAuth';

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
      
      const devotee = { id: userSnap.docs[0].id, ...userSnap.docs[0].data() };
      
      // Auto-detect Active Event (using the first available event if none selected)
      const event = (events || []).find(e => e.status === 'active') || (events && events[0]);
      
      if (!event) throw new Error('No active events found. Please create an event in the dashboard first.');

      if (scanMode === 'attendance') {
        const checkinQ = query(collection(db, 'attendance'), 
          where('userId', '==', devotee.id),
          where('eventId', '==', event.id)
        );
        const checkinSnap = await getDocs(checkinQ);
        
        if (!checkinSnap.empty) throw new Error(`${devotee.name} already checked in!`);
        
        // Mark Attendance
        await addDoc(collection(db, 'attendance'), {
          userId: devotee.id,
          name: devotee.name,
          eventId: event.id,
          session: event.title,
          status: 'On-time',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          createdAt: serverTimestamp()
        });

        // Check for Accommodation
        let accInfo = null;
        try {
          const accQ = query(collection(db, 'accommodation_requests'), 
            where('userId', '==', devotee.id),
            where('status', '==', 'Approved')
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
        // Prasadam Logic
        const prasadamQ = query(collection(db, 'prasadam_logs'), 
          where('userId', '==', devotee.id),
          where('eventId', '==', event.id)
        );
        const prasadamSnap = await getDocs(prasadamQ);
        
        if (!prasadamSnap.empty) throw new Error(`${devotee.name} already received prasadam!`);
        
        await addDoc(collection(db, 'prasadam_logs'), {
          userId: devotee.id,
          name: devotee.name,
          eventId: event.id,
          eventTitle: event.title,
          received: true,
          timestamp: serverTimestamp()
        });

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
          className="absolute inset-0 bg-gray-950/80 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Scanner / Result Window */}
        <motion.div 
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          className="relative w-full max-w-xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
        >
          {!verifyResult ? (
            <>
              {/* Header */}
              <div className="p-8 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Scanner Live</span>
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight italic">
                    Universal Verification
                  </h3>
                </div>
                <button 
                  onClick={onClose}
                  className="p-3 bg-gray-100 text-gray-400 hover:text-gray-600 rounded-2xl transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Mode Toggle */}
              <div className="px-8 mt-6">
                <div className="flex gap-2 p-1.5 bg-gray-100 rounded-2xl">
                  <button 
                    onClick={() => setScanMode('attendance')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      scanMode === 'attendance' ? 'bg-white shadow-lg text-saffron' : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    <Users size={14} /> Attendance
                  </button>
                  <button 
                    onClick={() => setScanMode('prasadam')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      scanMode === 'prasadam' ? 'bg-white shadow-lg text-orange-600' : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    <Coffee size={14} /> Prasadam
                  </button>
                </div>
              </div>

              {/* Scanner Area */}
              <div className="p-8">
                <div className="relative rounded-[2rem] overflow-hidden border-4 border-gray-50 bg-gray-50 aspect-square">
                  <QRScanner onScan={handleScan} onClose={onClose} mode={scanMode} />
                  {verifying && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4 z-50">
                      <Zap className="text-saffron animate-bounce" size={40} />
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Verifying Identity...</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            /* Verification Result (ALLOWED Modal) */
            <div className={`p-10 text-center ${verifyResult.success ? 'bg-white' : 'bg-red-50'}`}>
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
                    <span className="px-4 py-1.5 bg-green-100 text-green-700 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-4 inline-block">
                      {scanMode === 'attendance' ? 'Entry Allowed' : 'Prasadam Allowed'}
                    </span>
                    <h4 className="text-3xl font-black text-gray-900 uppercase tracking-tight italic mb-2">
                      {verifyResult.devotee?.fullName || verifyResult.devotee?.displayName}
                    </h4>
                    <p className="text-gray-500 font-bold">{verifyResult.message}</p>
                  </div>

                  {verifyResult.accommodation && (
                    <div className="mb-8 p-6 bg-blue-50/50 rounded-3xl border border-blue-100 flex items-center gap-4 text-left">
                      <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center">
                        <ShieldCheck size={24} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Accommodation Check</p>
                        <p className="text-sm font-bold text-blue-900 leading-tight">
                          Approved: {verifyResult.accommodation.roomType} <br/>
                          <span className="text-blue-600/70 font-medium">Guest Count: {verifyResult.accommodation.guestCount}</span>
                        </p>
                      </div>
                    </div>
                  )}

                  <button 
                    onClick={() => setVerifyResult(null)}
                    className="w-full py-5 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-black transition-all"
                  >
                    Done
                  </button>
                </>
              ) : (
                <>
                  <h4 className="text-2xl font-black text-red-900 uppercase tracking-tight italic mb-4">
                    Verification Failed
                  </h4>
                  <div className="p-4 bg-white rounded-2xl border border-red-100 mb-8 flex items-start gap-3 text-left">
                    <Info size={18} className="text-red-500 shrink-0 mt-0.5" />
                    <p className="text-sm font-bold text-red-600/80 leading-relaxed italic">{verifyResult.message}</p>
                  </div>
                  <button 
                    onClick={() => setVerifyResult(null)}
                    className="w-full py-5 bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-red-700 transition-all"
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
