import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, 
  Plus, 
  Users, 
  MapPin, 
  Calendar as CalendarIcon, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ChevronRight,
  Loader2,
  Trash2,
  UserCheck 
} from 'lucide-react';
import { db } from '../lib/firebase';
import { 
  collection, doc, setDoc, updateDoc, getDoc, getDocs, addDoc,
  query, where, orderBy, serverTimestamp, increment, runTransaction 
} from 'firebase/firestore';
import { useAuth } from '../hooks/useAuth';
import { useFirestore } from '../hooks/useFirestore';

const SevaDashboard = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'folks_head';
  
  
  const myRegistrationsQuery = React.useMemo(() => [where('userId', '==', user?.uid || '')], [user?.uid]);
  
  const { data: sevas, loading: sevasLoading } = useFirestore('sevas');
  const { data: myRegistrations, loading: registrationsLoading } = useFirestore('seva_registrations', myRegistrationsQuery);
  
  const [actionLoading, setActionLoading] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedSeva, setSelectedSeva] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    sevaType: 'cleaning',
    date: '',
    time: '',
    location: '',
    maxVolunteers: 10,
    isRecurring: false
  });

  const loading = sevasLoading || registrationsLoading;

  const handleCreateSeva = async (e) => {
    e.preventDefault();
    setActionLoading('create');
    try {
      const sevaRef = doc(collection(db, 'sevas'));
      await setDoc(sevaRef, {
        ...formData,
        maxVolunteers: parseInt(formData.maxVolunteers),
        isRecurring: !!formData.isRecurring,
        countRegistered: 0,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
      });

      // --- ADD NOTIFICATION ---
      await addDoc(collection(db, 'notifications'), {
        type: 'new_seva',
        title: `New Seva: ${formData.title}`,
        message: `A new ${formData.sevaType} seva has been opened at ${formData.location} for ${formData.date}.`,
        link: '/sevas',
        createdAt: serverTimestamp(),
        createdBy: user.uid
      });
      // ------------------------

      setShowCreateModal(false);
      setFormData({
        title: '',
        description: '',
        sevaType: 'cleaning',
        date: '',
        time: '',
        location: '',
        maxVolunteers: 10,
        isRecurring: false
      });
    } catch (error) {
      console.error('Create seva error:', error);
      alert('Failed to create seva: ' + error.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleJoinSeva = async (sevaId) => {
    setActionLoading(sevaId);
    try {
      const sevaRef = doc(db, 'sevas', sevaId);
      const regId = `${user.uid}_${sevaId}`;
      const regRef = doc(db, 'seva_registrations', regId);
      await runTransaction(db, async (transaction) => {
        const sevaDoc = await transaction.get(sevaRef);
        const regDoc = await transaction.get(regRef);
        if (!sevaDoc.exists()) throw new Error('Seva not found');
        if (regDoc.exists() && regDoc.data().status === 'registered') throw new Error('Already registered');
        const sevaData = sevaDoc.data();
        if (sevaData.countRegistered >= sevaData.maxVolunteers) throw new Error('Seva is full');
        transaction.update(sevaRef, { countRegistered: increment(1) });
        transaction.set(regRef, {
          userId: user.uid,
          sevaId,
          status: 'registered',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      });
    } catch (error) {
      console.error('Join seva error:', error);
      alert(error.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelSeva = async (sevaId) => {
    if (!confirm('Are you sure you want to leave this Seva?')) return;
    setActionLoading(sevaId);
    try {
      const sevaRef = doc(db, 'sevas', sevaId);
      const regId = `${user.uid}_${sevaId}`;
      const regRef = doc(db, 'seva_registrations', regId);
      await runTransaction(db, async (transaction) => {
        const regDoc = await transaction.get(regRef);
        if (!regDoc.exists() || regDoc.data().status !== 'registered') throw new Error('No active registration found');
        transaction.update(sevaRef, { countRegistered: increment(-1) });
        transaction.update(regRef, { status: 'cancelled', updatedAt: serverTimestamp() });
      });
    } catch (error) {
      console.error('Cancel seva error:', error);
      alert(error.message);
    } finally {
      setActionLoading(null);
    }
  };

  const viewParticipants = async (sevaId) => {
    setSelectedSeva(sevas.find(s => s.id === sevaId));
    setLoadingParticipants(true);
    try {
      const q = query(collection(db, 'seva_registrations'), where('sevaId', '==', sevaId));
      const snapshot = await getDocs(q);
      setParticipants(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (error) {
      console.error('View participants error:', error);
      alert(error.message);
    } finally {
      setLoadingParticipants(false);
    }
  };

  const handleMarkAttendance = async (registrationId, status) => {
    try {
      await updateDoc(doc(db, 'seva_registrations', registrationId), {
        status,
        updatedAt: serverTimestamp(),
      });
      setParticipants(prev => prev.map(p => p.id === registrationId ? { ...p, status } : p));
    } catch (error) {
      console.error('Mark attendance error:', error);
      alert(error.message);
    }
  };

  const getRegistrationStatus = (sevaId) => {
    const reg = (myRegistrations || []).find(r => r.sevaId === sevaId);
    return reg ? reg.status : null;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-12 h-12 text-saffron animate-spin" />
        <p className="text-gray-500 font-medium">Loading seva opportunities...</p>
      </div>
    );
  }

  return (
    <div className="pb-24 px-4 pt-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-saffron via-gold to-saffron-dark bg-clip-text text-transparent font-cinzel tracking-tighter drop-shadow-sm">
            Seva Portal
          </h1>
           <p className="text-gray-500 font-medium italic mt-1 font-playfair">&ldquo;Service is the highest form of worship.&rdquo;</p>
        </div>
        {isAdmin && (
          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-saffron to-gold text-white px-6 py-4 rounded-[2rem] shadow-premium-xl flex items-center gap-3 font-black text-xs uppercase tracking-widest transition-all"
          >
            <Plus size={20} />
            <span>Add Seva</span>
          </motion.button>
        )}
      </div>

      {/* Seva List */}
      <div className="grid gap-4">
        {sevas.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-gray-100">
            <Heart className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-800 mb-2">No Active Sevas</h3>
            <p className="text-gray-500">Check back later for new opportunities to serve.</p>
          </div>
        ) : (
          sevas.map((seva) => {
            const status = getRegistrationStatus(seva.id);
            const isFull = seva.countRegistered >= seva.maxVolunteers;
            const isLoading = actionLoading === seva.id;

            return (
              <motion.div
                key={seva.id}
                layout
                initial={{ opacity: 0, scale: 0.95, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="bg-white/70 backdrop-blur-3xl rounded-[2.5rem] p-6 shadow-premium border border-white hover:shadow-premium-xl transition-all relative group overflow-hidden"
              >
                {status === 'completed' && (
                  <div className="absolute top-0 right-0 bg-green-500 text-white px-4 py-1 rounded-bl-2xl text-xs font-bold flex items-center gap-1">
                    <CheckCircle2 size={12} />
                    COMPLETED
                  </div>
                )}

                <div className="flex flex-col md:flex-row gap-6">
                  {/* Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-3 py-1 bg-saffron/10 text-saffron text-xs font-bold rounded-full uppercase tracking-wider">
                        {seva.sevaType}
                      </span>
                      <span className="text-gray-400 text-xs">•</span>
                      <div className="flex items-center gap-1 text-gray-500 text-xs">
                        <Users size={12} />
                        {seva.countRegistered} / {seva.maxVolunteers} Joined
                      </div>
                    </div>
                    
                    <h3 className="text-2xl font-black text-gray-900 mb-3 tracking-tight font-cinzel uppercase">{seva.title}</h3>
                    <p className="text-gray-500 font-medium text-sm mb-6 line-clamp-2 leading-relaxed">{seva.description}</p>

                    <div className="flex flex-wrap gap-6 text-sm">
                      <div className="flex items-center gap-3 text-gray-600 font-bold">
                        <div className="w-8 h-8 rounded-xl bg-saffron/10 flex items-center justify-center text-saffron">
                           <CalendarIcon size={16} />
                        </div>
                        {seva.date ? new Date(seva.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Date TBD'}
                      </div>
                      <div className="flex items-center gap-3 text-gray-600 font-bold">
                        <div className="w-8 h-8 rounded-xl bg-gold/10 flex items-center justify-center text-gold">
                           <Clock size={16} />
                        </div>
                        {seva.time}
                      </div>
                      <div className="flex items-center gap-3 text-gray-600 font-bold w-full sm:w-auto">
                        <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500">
                           <MapPin size={16} />
                        </div>
                        <span className="truncate">{seva.location}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row md:flex-col justify-center gap-3 pt-6 md:pt-0 md:pl-8 border-t md:border-t-0 md:border-l border-gray-100 min-w-[200px]">
                    {isAdmin && (
                      <button
                        onClick={() => viewParticipants(seva.id)}
                        className="flex-1 py-4 rounded-2xl bg-gray-50 text-gray-600 font-black text-[10px] uppercase tracking-widest hover:bg-gray-100 transition-all flex items-center justify-center gap-2 border border-transparent shadow-sm"
                      >
                        <Users size={16} />
                        Volunteers
                      </button>
                    )}

                    {status === 'registered' ? (
                      <button
                        disabled={isLoading}
                        onClick={() => handleCancelSeva(seva.id)}
                        className="flex-1 py-4 rounded-2xl bg-red-50 text-red-600 font-black text-[10px] uppercase tracking-widest hover:bg-red-100 transition-all flex items-center justify-center gap-2 shadow-sm"
                      >
                        {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                        Cancel Submission
                      </button>
                    ) : status === 'completed' ? (
                      <div className="flex-1 py-4 rounded-2xl bg-green-50 text-green-600 font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 border border-green-100">
                        <UserCheck size={18} className="animate-bounce" />
                        Blessed Service
                      </div>
                    ) : (
                      <button
                        disabled={isFull || isLoading}
                        onClick={() => handleJoinSeva(seva.id)}
                        className={`flex-1 py-4 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 ${
                          isFull 
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                            : 'bg-gradient-to-r from-saffron to-gold text-white shadow-premium-xl hover:-translate-y-1'
                        }`}
                      >
                        {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Heart size={18} fill={isFull ? "none" : "currentColor"} />}
                        {isFull ? 'Limit Reached' : 'Opt to Serve'}
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreateModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 40 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white/95 backdrop-blur-3xl rounded-[3rem] p-8 w-full max-w-xl relative z-10 shadow-premium-xl max-h-[90vh] overflow-y-auto border border-white"
            >
              <div className="text-center mb-8">
                <h2 className="text-3xl font-black text-gray-900 font-cinzel tracking-tighter uppercase drop-shadow-sm">Open New Seva</h2>
                 <p className="text-gray-400 font-medium italic font-playfair mt-1">&ldquo;Opportunities to serve are blessings.&rdquo;</p>
              </div>

              <form onSubmit={handleCreateSeva} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Service Title</label>
                  <input
                    required
                    type="text"
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                    className="w-full p-5 bg-gray-50/50 rounded-2xl border-2 border-transparent focus:border-saffron/30 focus:bg-white outline-none transition-all font-bold text-gray-800 placeholder:text-gray-300"
                    placeholder="e.g. Temple Cleaning"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Description</label>
                  <textarea
                    required
                    rows="3"
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    className="w-full p-5 bg-gray-50/50 rounded-2xl border-2 border-transparent focus:border-saffron/30 focus:bg-white outline-none transition-all font-bold text-gray-800 placeholder:text-gray-300"
                    placeholder="Describe the seva details..."
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Seva Type</label>
                    <select
                      value={formData.sevaType}
                      onChange={e => setFormData({...formData, sevaType: e.target.value})}
                      className="w-full p-5 bg-gray-50/50 rounded-2xl border-2 border-transparent focus:border-saffron/30 focus:bg-white outline-none transition-all font-bold text-gray-800 appearance-none"
                    >
                      <option value="cleaning">🧹 Cleaning</option>
                      <option value="cooking">👨‍🍳 Cooking</option>
                      <option value="organizing">📦 Organizing</option>
                      <option value="reception">👋 Reception</option>
                      <option value="distribution">🍲 Distribution</option>
                      <option value="other">✨ Other</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Max Slots</label>
                    <input
                      required
                      type="number"
                      value={formData.maxVolunteers}
                      onChange={e => setFormData({...formData, maxVolunteers: e.target.value})}
                      className="w-full p-5 bg-gray-50/50 rounded-2xl border-2 border-transparent focus:border-saffron/30 focus:bg-white outline-none transition-all font-bold text-gray-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Date</label>
                    <input
                      required
                      type="date"
                      value={formData.date}
                      onChange={e => setFormData({...formData, date: e.target.value})}
                      className="w-full p-5 bg-gray-50/50 rounded-2xl border-2 border-transparent focus:border-saffron/30 focus:bg-white outline-none transition-all font-bold text-gray-800"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Time</label>
                    <input
                      required
                      type="time"
                      value={formData.time}
                      onChange={e => setFormData({...formData, time: e.target.value})}
                      className="w-full p-5 bg-gray-50/50 rounded-2xl border-2 border-transparent focus:border-saffron/30 focus:bg-white outline-none transition-all font-bold text-gray-800"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Location</label>
                  <input
                    required
                    type="text"
                    value={formData.location}
                    onChange={e => setFormData({...formData, location: e.target.value})}
                    className="w-full p-5 bg-gray-50/50 rounded-2xl border-2 border-transparent focus:border-saffron/30 focus:bg-white outline-none transition-all font-bold text-gray-800 placeholder:text-gray-300"
                    placeholder="e.g. Main Temple Hall"
                  />
                </div>

                <div className="pt-6 flex gap-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 py-5 bg-gray-100/50 text-gray-500 rounded-[2rem] font-black text-xs uppercase tracking-widest hover:bg-gray-100 transition-all"
                  >
                    Discard
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading === 'create'}
                    className="flex-[2] py-5 bg-gradient-to-r from-saffron to-gold text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-premium-xl hover:-translate-y-1 transition-all disabled:opacity-50 flex items-center justify-center"
                  >
                    {actionLoading === 'create' ? <Loader2 size={24} className="animate-spin" /> : 'Deploy Seva'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Participants Modal */}
      <AnimatePresence>
        {selectedSeva && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedSeva(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 40 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white/95 backdrop-blur-3xl rounded-[3rem] p-8 w-full max-w-xl relative z-10 shadow-premium-xl max-h-[80vh] flex flex-col border border-white"
            >
              <div className="mb-8 text-center">
                <h2 className="text-3xl font-black text-gray-900 font-cinzel tracking-tighter uppercase drop-shadow-sm">Volunteer Roster</h2>
                <p className="text-gray-400 font-medium italic font-playfair mt-1 truncate px-4">{selectedSeva.title}</p>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 min-h-[300px] pr-2 custom-scrollbar">
                {loadingParticipants ? (
                  <div className="flex flex-col items-center justify-center h-full gap-4">
                    <Loader2 className="w-10 h-10 text-saffron animate-spin" />
                    <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">Retrieving Souls...</p>
                  </div>
                ) : participants.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-300">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                       <Users size={32} className="opacity-20" />
                    </div>
                    <p className="font-bold uppercase tracking-widest text-xs">No volunteers listed yet</p>
                  </div>
                ) : (
                  participants.map(reg => (
                    <motion.div 
                      key={reg.id} 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-gray-50/50 p-5 rounded-2xl flex items-center justify-between border border-transparent hover:border-saffron/10 transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm font-black text-saffron">
                          {reg.userName?.charAt(0) || <UserCheck size={20} />}
                        </div>
                        <div>
                          <p className="font-black text-gray-800 text-sm tracking-tight">{reg.userName || `Devotee ${reg.userId?.substring(0, 5) || '...'}`}</p> 
                          <span className={`text-[10px] font-black uppercase tracking-widest ${
                            reg.status === 'completed' ? 'text-green-500' : 
                            reg.status === 'cancelled' ? 'text-red-400' : 'text-saffron'
                          }`}>
                            {reg.status}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {reg.status === 'registered' && (
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleMarkAttendance(reg.id, 'completed')}
                            className="w-10 h-10 bg-green-500 text-white rounded-xl shadow-lg shadow-green-200 flex items-center justify-center"
                            title="Mark Completed"
                          >
                            <UserCheck size={18} />
                          </motion.button>
                        )}
                        {reg.status !== 'cancelled' && (
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleMarkAttendance(reg.id, 'cancelled')}
                            className="w-10 h-10 bg-red-50 text-red-500 rounded-xl flex items-center justify-center border border-red-100 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                            title="Cancel Participation"
                          >
                            <Trash2 size={16} />
                          </motion.button>
                        )}
                      </div>
                    </motion.div>
                  ))
                )}
              </div>

              <button
                onClick={() => setSelectedSeva(null)}
                className="mt-8 w-full py-5 bg-gray-100/50 text-gray-500 rounded-[2rem] font-black text-xs uppercase tracking-widest hover:bg-gray-100 transition-all border border-transparent"
              >
                Close Roster
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SevaDashboard;
