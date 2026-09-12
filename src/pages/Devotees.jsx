import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion'
import { getSafeProfileImage } from '../lib/imageUtils';
import { 
  Search, 
  Plus, 
  User, 
  Phone, 
  MapPin, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  Shield,
  Filter,
  Download,
  X,
  Flame,
  Star,
  Trophy,
  QrCode
} from 'lucide-react';
import QRView from '../components/qr/QRView';
import { db } from '../lib/firebase';
import { 
  collection, 
  query, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp 
} from 'firebase/firestore';
import Card from '../components/ui/Card';

const Devotees = () => {
  const [devotees, setDevotees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDevotee, setEditingDevotee] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    role: 'devotee',
    level: '1'
  });
  const [qrModalDevotee, setQrModalDevotee] = useState(null);
  const [roleFilter, setRoleFilter] = useState('All');
  const [showRoleFilter, setShowRoleFilter] = useState(false);

  const exportCSV = () => {
    const headers = ['Name', 'Phone', 'Address', 'Role', 'Level', 'Streak', 'Longest Streak', 'Score', 'QR Token'];
    const rows = filteredDevotees.map((d) => [
      d.name, d.phone, d.address, d.role, d.level, d.streak || 0, d.longestStreak || 0, d.score || 0, d.qrToken || ''
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `devotees_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generateQrToken = async (devotee) => {
    try {
      const qrToken = `FOLK-${devotee.id || 'D'}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
      await updateDoc(doc(db, 'users', devotee.id), { qrToken });
      setQrModalDevotee({ ...devotee, qrToken });
    } catch (error) {
      console.error("Error generating QR token:", error);
    }
  };

  useEffect(() => {
    const q = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setDevotees(data);
      setLoading(false);
    }, (error) => {
      console.error("Firestore error in Devotees:", error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingDevotee) {
        await updateDoc(doc(db, 'users', editingDevotee.id), {
          ...formData,
          updatedAt: serverTimestamp()
        });
      } else {
        const qrToken = `FOLK-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
        await addDoc(collection(db, 'users'), {
          ...formData,
          qrToken,
          createdAt: serverTimestamp(),
          photo: `https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.name}`
        });
      }
      handleCloseModal();
    } catch (error) {
      console.error("Error saving devotee:", error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this devotee?')) {
      try {
        await deleteDoc(doc(db, 'users', id));
      } catch (error) {
        console.error("Error deleting devotee:", error);
      }
    }
  };

  const handleEdit = (devotee) => {
    setEditingDevotee(devotee);
    setFormData({
      name: devotee.name || '',
      phone: devotee.phone || '',
      address: devotee.address || '',
      role: devotee.role || 'devotee',
      level: devotee.level || '1'
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingDevotee(null);
    setFormData({ name: '', phone: '', address: '', role: 'devotee', level: '1' });
  };

  const filteredDevotees = devotees.filter(d =>
    (roleFilter === 'All' || d.role === roleFilter) &&
    (
      d.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.phone?.includes(searchTerm)
    )
  );

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-saffron-dark font-poppins">Devotee Management</h1>
          <p className="text-gray-500 mt-1">Manage all registered devotees and their permissions</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={exportCSV}
            disabled={filteredDevotees.length === 0}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download size={18} />
            <span>Export</span>
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-saffron to-gold text-white rounded-xl font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all"
          >
            <Plus size={20} />
            <span>Add Devotee</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-4 rounded-2xl border border-saffron/10 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Search by name or phone..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-cream/30 border border-transparent rounded-xl focus:bg-white focus:border-saffron focus:ring-4 focus:ring-saffron/5 outline-none transition-all"
          />
        </div>
        <div className="relative">
          <button
            onClick={() => setShowRoleFilter(!showRoleFilter)}
            className="flex items-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-xl hover:border-saffron text-gray-600 hover:text-saffron transition-all"
          >
            <Filter size={18} />
            <span>{roleFilter === 'All' ? 'Filters' : `Role: ${roleFilter}`}</span>
          </button>
          <AnimatePresence>
            {showRoleFilter && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.97 }}
                className="absolute right-0 top-full mt-2 w-44 bg-white rounded-2xl shadow-premium-xl border border-gray-100 overflow-hidden z-50"
              >
                {['All', 'devotee', 'admin', 'folks_head', 'volunteer'].map((role) => (
                  <button
                    key={role}
                    onClick={() => { setRoleFilter(role); setShowRoleFilter(false); }}
                    className={`w-full px-4 py-2.5 text-left text-sm font-bold capitalize hover:bg-saffron/5 transition-colors ${
                      roleFilter === role ? 'text-saffron bg-saffron/5' : 'text-gray-600'
                    }`}
                  >
                    {role === 'folks_head' ? 'Folks Head' : role}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode='popLayout'>
          {loading ? (
            [1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-gray-100 rounded-3xl animate-pulse" />
            ))
          ) : filteredDevotees.length > 0 ? (
            filteredDevotees.map((devotee) => (
              <motion.div
                key={devotee.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <Card className="group hover:shadow-premium-xl transition-all duration-300 border-none bg-white relative overflow-hidden h-full shadow-md">
                  <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setQrModalDevotee(devotee)}
                        className="p-2 bg-saffron/5 text-saffron rounded-lg hover:bg-saffron/10 transition-colors"
                        title="View Vaikuntha ID"
                      >
                        <QrCode size={16} />
                      </button>
                      <button 
                        onClick={() => handleEdit(devotee)}
                        className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(devotee.id)}
                        className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-saffron/10 to-gold/10 p-1 shrink-0 shadow-inner">
                      <img 
                        src={getSafeProfileImage(devotee.photo, devotee.name)} 
                        className="w-full h-full rounded-2xl object-cover" 
                        alt="" 
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider mb-2 ${
                        devotee.role === 'admin' ? 'bg-purple-100 text-purple-600' : 'bg-saffron/10 text-saffron'
                      }`}>
                        {devotee.role || 'Devotee'}
                      </span>
                      <h3 className="font-bold text-lg text-gray-900 truncate">{devotee.name}</h3>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <div className="flex items-center gap-1 text-[10px] font-bold text-saffron bg-saffron/5 px-2 py-0.5 rounded-md border border-saffron/10">
                          <Flame size={12} fill="currentColor" />
                          <span>{devotee.streak || 0}d</span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                          <Trophy size={12} />
                          <span>{devotee.longestStreak || 0}d BEST</span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] font-bold text-gold-dark bg-gold/5 px-2 py-0.5 rounded-md border border-gold/10">
                          <Star size={12} fill="currentColor" />
                          <span>{devotee.score || 0} pts</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500 mt-2">
                        <Phone size={14} className="text-gray-400" />
                        <span>{devotee.phone || 'No phone'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-gray-100 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider">
                    <div className="flex items-center gap-2 text-purple-600 bg-purple-50 px-3 py-1 rounded-lg">
                      <Shield size={14} />
                      <span>Level {devotee.level || '1'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                      <MapPin size={14} />
                      <span className="truncate max-w-[120px]">{devotee.address || 'Vizag'}</span>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full py-20 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-200">
                 <User size={40} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800">No Devotees Found</h3>
                <p className="text-gray-400">Try adjusting your search or filters.</p>
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseModal}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-premium p-8 overflow-hidden"
            >
              <button 
                onClick={handleCloseModal}
                className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
              >
                <X size={20} />
              </button>

              <h2 className="text-2xl font-bold text-saffron-dark mb-6">
                {editingDevotee ? 'Edit Devotee' : 'Add New Devotee'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 ml-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      required
                      type="text" 
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-saffron outline-none transition-all"
                      placeholder="e.g. Rahul Sharma"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 ml-1">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      required
                      type="tel" 
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-saffron outline-none transition-all"
                      placeholder="e.g. +91 9876543210"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 ml-1">Address (Town/City)</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      type="text" 
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-saffron outline-none transition-all"
                      placeholder="e.g. Visakhapatnam"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 ml-1">Role</label>
                    <select 
                      value={formData.role}
                      onChange={(e) => setFormData({...formData, role: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-saffron outline-none transition-all appearance-none"
                    >
                      <option value="devotee">Devotee</option>
                      <option value="admin">Admin</option>
                      <option value="volunteer">Volunteer</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 ml-1">Auth Level</label>
                    <select 
                      value={formData.level}
                      onChange={(e) => setFormData({...formData, level: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-saffron outline-none transition-all appearance-none"
                    >
                      {[1, 2, 3, 4, 5].map(l => <option key={l} value={l}>Level {l}</option>)}
                    </select>
                  </div>
                </div>

                <div className="flex gap-4 pt-6">
                  <button 
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 py-3.5 px-6 border border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3.5 px-6 bg-gradient-to-r from-saffron to-gold text-white rounded-xl font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all"
                  >
                    {editingDevotee ? 'Update Devotee' : 'Save Devotee'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* QR Modal */}
      <AnimatePresence>
        {qrModalDevotee && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setQrModalDevotee(null)}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-[3.5rem] shadow-premium-xl p-10 overflow-hidden text-center border border-white"
            >
              <button 
                onClick={() => setQrModalDevotee(null)}
                className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
              >
                <X size={20} />
              </button>

              <div className="mb-4">
                <span className="text-[10px] font-black text-saffron uppercase tracking-[0.4rem] block mb-2">Vaikuntha ID Card</span>
                <h2 className="text-3xl font-black text-gray-900 tracking-tighter uppercase italic leading-none mb-10">Permanent pass</h2>
              </div>

              {qrModalDevotee.qrToken ? (
                <QRView value={qrModalDevotee.qrToken} name={qrModalDevotee.name} />
              ) : (
                <div className="py-10 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-100">
                   <p className="text-gray-400 font-bold uppercase tracking-widest text-xs mb-4">No token yet</p>
                   <button
                     onClick={() => generateQrToken(qrModalDevotee)}
                     className="px-6 py-3 bg-saffron text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-saffron-dark transition-all"
                   >
                     Generate QR Token
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
    </div>
  );
};

export default Devotees;
