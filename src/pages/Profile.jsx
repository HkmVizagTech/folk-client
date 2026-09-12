import React, { useState, useEffect, useRef } from 'react';
import { 
  User, Mail, Phone, MapPin, Briefcase, GraduationCap, 
  Map, Globe, Home, Users, Camera, Edit2, Save, X,
  Calendar, CreditCard, ChevronRight, CheckCircle2,
  Plus, Info, Award, Loader2, LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { useFirestore } from '../hooks/useFirestore';
import { db, storage } from '../lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp, where } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getSafeProfileImage } from '../lib/imageUtils';
import { cn } from '../components/ui/Card';
import { compressImage } from '../lib/performance';

const Profile = () => {
  const { user, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState(null);
  const fileInputRef = useRef(null);

  const attendanceQuery = React.useMemo(() => [where('userId', '==', user?.uid || '')], [user?.uid]);
  const paymentsQuery = React.useMemo(() => [where('userId', '==', user?.uid || '')], [user?.uid]);
  const { data: myAttendance, loading: attendanceLoading } = useFirestore('attendance', attendanceQuery);
  const { data: myPayments, loading: paymentsLoading } = useFirestore('payments', paymentsQuery);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    gender: '',
    level: '',
    occupation: '',
    qualification: '',
    city: '',
    state: '',
    country: '',
    center: '',
    fatherName: '',
    fatherPhone: '',
    spouseId: '',
    profileImage: ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || user.displayName || '',
        email: user.email || '',
        phone: user.phone || '',
        gender: user.gender || '',
        level: user.level || 'FOLK New',
        occupation: user.occupation || '',
        qualification: user.qualification || '',
        city: user.city || '',
        state: user.state || '',
        country: user.country || '',
        center: user.center || '',
        fatherName: user.fatherName || '',
        fatherPhone: user.fatherPhone || '',
        spouseId: user.spouseId || '',
        profileImage: user.photo || user.photoURL || ''
      });
    }
  }, [user]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageClick = () => {
    if (!isEditing) setIsEditing(true);
    setTimeout(() => fileInputRef.current?.click(), 100);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showToast('Image size must be less than 2MB', 'error');
      return;
    }

    try {
      setUploading(true);
      
      // Fallback if compression fails
      let fileToUpload = file;
      try {
        console.log("Compressing image...");
        fileToUpload = await compressImage(file, { maxWidth: 800, maxHeight: 800, quality: 0.7 });
      } catch (e) {
        console.warn("Compression failed, using original file:", e);
      }

      const storageRef = ref(storage, `profileImages/${user.uid}`);
      await uploadBytes(storageRef, fileToUpload);
      const downloadURL = await getDownloadURL(storageRef);
      
      setFormData(prev => ({ ...prev, profileImage: downloadURL }));
      showToast('Image uploaded successfully!');
    } catch (error) {
      console.error("Upload error:", error);
      showToast('Failed to upload image', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.phone) {
      showToast('Name and Phone are required', 'error');
      return;
    }

    try {
      setLoading(true);
      console.log("Saving profile for UID:", user?.uid, formData);
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        ...formData,
        photo: formData.profileImage, // Sync legacy photo field
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      console.log("Profile saved successfully to users/" + user.uid);
      setIsEditing(false);
      showToast('Profile updated successfully!');
    } catch (error) {
      console.error("Update error details:", error);
      showToast('Failed to update profile: ' + (error.message || 'Unknown error'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const renderDetailItem = (icon, label, value, name, type = "text", options = null) => {
    const Icon = icon;
    return (
      <div className="flex items-center gap-4 p-4 bg-white/50 rounded-2xl border border-saffron/5 hover:border-saffron/20 transition-all group">
        <div className="w-10 h-10 rounded-xl bg-saffron/5 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
          <Icon className="text-saffron" size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{label}</p>
          {isEditing ? (
            options ? (
              <select
                name={name}
                value={formData[name]}
                onChange={handleInputChange}
                className="w-full bg-white border border-saffron/20 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 ring-saffron/20"
              >
                {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            ) : (
              <input
                type={type}
                name={name}
                value={formData[name]}
                onChange={handleInputChange}
                className="w-full bg-white border border-saffron/20 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 ring-saffron/20"
              />
            )
          ) : (
            <p className="text-gray-800 font-bold truncate">
              {value || <span className="text-gray-300 italic font-normal">Not specified</span>}
            </p>
          )}
        </div>
      </div>
    );
  };

  const completionFields = ['name', 'phone', 'gender', 'level', 'occupation', 'qualification', 'city', 'country', 'fatherName'];
  const completionPercent = Math.round(
    (completionFields.filter((f) => formData[f] && String(formData[f]).trim() !== '').length / completionFields.length) * 100
  );

  const formatDate = (value) => {
    const d = value?.toDate ? value.toDate() : new Date(value);
    return isNaN(d?.getTime?.()) ? '—' : d.toLocaleDateString();
  };

  return (
    <div className="max-w-4xl mx-auto pb-12 animate-in fade-in duration-700">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={cn(
              "fixed top-6 right-6 z-[100] px-6 py-3 rounded-2xl shadow-premium-xl flex items-center gap-3 font-bold text-sm",
              toast.type === 'error' ? "bg-red-500 text-white" : "bg-green-600 text-white"
            )}
          >
            {toast.type === 'error' ? <X size={18} /> : <CheckCircle2 size={18} />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Section / Header */}
      <div className="relative rounded-[2.5rem] overflow-hidden shadow-premium-xl bg-white mb-8 group">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-saffron/10 to-saffron/20" />
        <div className="relative p-8 md:p-12 flex flex-col items-center">
          
          {/* Profile Image */}
          <div className="relative group mb-6">
            <motion.div 
              whileHover={{ scale: isEditing ? 1.05 : 1 }}
              onClick={handleImageClick}
              className={cn(
                "w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white shadow-xl overflow-hidden bg-cream relative cursor-pointer transition-all",
                isEditing && "ring-4 ring-saffron/30"
              )}
            >
              <img 
                src={getSafeProfileImage(formData.profileImage, formData.name)} 
                alt="Profile" 
                className="w-full h-full object-cover"
              />
              {uploading && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <Loader2 className="text-white animate-spin" size={32} />
                </div>
              )}
              {isEditing && !uploading && (
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <Camera className="text-white" size={32} />
                </div>
              )}
            </motion.div>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleFileChange} 
            />
          </div>

          <div className="text-center">
            <h1 className="text-3xl font-black text-gray-800 mb-2 font-poppins tracking-tight">
              {formData.name || 'Your Name'}
            </h1>
            <div className="flex items-center justify-center gap-3">
              <span className="px-3 py-1 bg-white/80 rounded-full text-[10px] font-black text-gray-500 shadow-sm border border-gray-100 uppercase tracking-widest">
                ID: {user?.qrToken?.substring(0, 8).toUpperCase() || 'NEW-USER'}
              </span>
              <span className={cn(
                "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                user?.role === 'admin' ? "bg-red-500 text-white" : "bg-saffron text-white shadow-saffron/20"
              )}>
                {user?.role || 'Devotee'}
              </span>
            </div>
          </div>

          {/* Edit Button */}
          <div className="absolute top-6 right-6 md:top-8 md:right-8 flex gap-2">
            <button 
              onClick={() => isEditing ? handleSave() : setIsEditing(true)}
              disabled={loading}
              className={cn(
                "w-12 h-12 rounded-2xl shadow-lg border flex items-center justify-center transition-all group",
                isEditing ? "bg-saffron text-white border-saffron shadow-saffron/20" : "bg-white text-saffron border-saffron/10 hover:bg-saffron hover:text-white"
              )}
            >
              {loading ? <Loader2 size={24} className="animate-spin" /> : (isEditing ? <Save size={24} /> : <Edit2 size={24} />)}
            </button>
            {!isEditing && (
              <button 
                onClick={logout}
                className="w-12 h-12 bg-white text-gray-400 rounded-2xl shadow-lg border border-gray-100 flex items-center justify-center hover:text-red-500 hover:bg-red-50 transition-all"
              >
                <LogOut size={22} />
              </button>
            )}
            {isEditing && (
              <button 
                onClick={() => setIsEditing(false)}
                className="w-12 h-12 bg-white text-gray-400 rounded-2xl shadow-lg border border-gray-100 flex items-center justify-center hover:bg-gray-50 transition-all"
              >
                <X size={24} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1.5 bg-white/50 backdrop-blur-md rounded-2xl border border-saffron/10 mb-8 sticky top-24 z-30 shadow-sm">
        {[
          { id: 'profile', icon: <User size={18} />, label: 'Profile' },
          { id: 'attendance', icon: <Calendar size={18} />, label: 'Attendance' },
          { id: 'payments', icon: <CreditCard size={18} />, label: 'Payments' }
        ].map((tab) => (
          <button 
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all",
              activeSubTab === tab.id 
                ? "bg-saffron text-white shadow-lg shadow-saffron/20" 
                : "text-gray-400 hover:text-saffron hover:bg-saffron/5"
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeSubTab === 'profile' && (
          <motion.div 
            key="profile-content"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <div className="md:col-span-2 flex items-center gap-2 mb-2 px-2">
              <Info className="text-saffron" size={16} />
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Personal Details</h3>
            </div>
            
            {renderDetailItem(Mail, "Email Address", formData.email, "email", "email")}
            {renderDetailItem(Phone, "Mobile Number", formData.phone, "phone", "tel")}
            {renderDetailItem(Users, "Gender", formData.gender, "gender", "select", ["Male", "Female", "Other"])}
            {renderDetailItem(Award, "Level", formData.level, "level", "select", ["FOLK New", "FOLK Enhanced", "Pre-Initiated", "Initiated"])}
            {renderDetailItem(Briefcase, "Occupation", formData.occupation, "occupation")}
            {renderDetailItem(GraduationCap, "Higher Qualification", formData.qualification, "qualification")}
            
            <div className="md:col-span-2 flex items-center gap-2 mt-6 mb-2 px-2 border-t border-saffron/5 pt-6">
              <MapPin className="text-saffron" size={16} />
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Location Info</h3>
            </div>
            
            {renderDetailItem(Globe, "Country", formData.country, "country")}
            {renderDetailItem(Map, "State", formData.state, "state")}
            {renderDetailItem(Home, "City", formData.city, "city")}
            {renderDetailItem(Home, "Center", formData.center, "center")}

            <div className="md:col-span-2 flex items-center gap-2 mt-6 mb-2 px-2 border-t border-saffron/5 pt-6">
              <Plus className="text-saffron" size={16} />
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Family Details</h3>
            </div>

            {renderDetailItem(User, "Father's Name", formData.fatherName, "fatherName")}
            {renderDetailItem(Phone, "Father's Mobile", formData.fatherPhone, "fatherPhone")}
            {renderDetailItem(Users, "Spouse ID", formData.spouseId, "spouseId")}
          </motion.div>
        )}

        {activeSubTab === 'attendance' && (
          <motion.div
            key="attendance-content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="bg-white/50 backdrop-blur-sm rounded-[3rem] p-6 sm:p-10 border border-saffron/10"
          >
            <div className="flex items-center gap-3 mb-8">
              <Calendar className="text-saffron" size={20} />
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Attendance History</h3>
            </div>
            {attendanceLoading ? (
              <div className="py-16 flex justify-center"><Loader2 className="animate-spin text-saffron" size={32} /></div>
            ) : myAttendance.length > 0 ? (
              <div className="space-y-3">
                {myAttendance.map((att) => (
                  <div key={att.id} className="flex items-center justify-between p-5 bg-white rounded-2xl border border-saffron/5 shadow-sm">
                    <div>
                      <p className="font-bold text-gray-800">{att.session || att.eventTitle || 'Temple Visit'}</p>
                      <p className="text-xs text-gray-400 font-medium mt-0.5">{formatDate(att.createdAt)}</p>
                    </div>
                    <span className="text-[10px] font-black text-green-600 bg-green-50 px-3 py-1 rounded-full uppercase tracking-wider">Verified</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-16 text-center text-gray-400 italic">No attendance records yet.</div>
            )}
          </motion.div>
        )}

        {activeSubTab === 'payments' && (
          <motion.div
            key="payments-content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="bg-white/50 backdrop-blur-sm rounded-[3rem] p-6 sm:p-10 border border-saffron/10"
          >
            <div className="flex items-center gap-3 mb-8">
              <CreditCard className="text-saffron" size={20} />
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Payment History</h3>
            </div>
            {paymentsLoading ? (
              <div className="py-16 flex justify-center"><Loader2 className="animate-spin text-saffron" size={32} /></div>
            ) : myPayments.length > 0 ? (
              <div className="space-y-3">
                {myPayments.map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-5 bg-white rounded-2xl border border-saffron/5 shadow-sm">
                    <div>
                      <p className="font-bold text-gray-800">{p.sevaType || (p.eventId ? 'Event Contribution' : 'Donation')}</p>
                      <p className="text-xs text-gray-400 font-medium mt-0.5">{formatDate(p.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-saffron-dark">₹{Number(p.amount || 0).toLocaleString('en-IN')}</p>
                      <span className={cn(
                        "text-[10px] font-black uppercase tracking-wider",
                        (p.status === 'completed' || p.status === 'COMPLETED') ? 'text-green-600' :
                        p.status === 'failed' ? 'text-red-500' : 'text-yellow-600'
                      )}>
                        {p.status || 'pending'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-16 text-center text-gray-400 italic">No payment records yet.</div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile Completion Indicator */}
      <div className="mt-12 p-10 bg-gradient-to-br from-saffron/5 to-gold/10 rounded-[3rem] border border-saffron/10 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 text-saffron opacity-[0.03] group-hover:scale-110 transition-transform">
          <Award size={160} />
        </div>
        <div className="relative">
          <div className="flex items-center gap-3 mb-2">
            <Award className="text-gold" size={24} />
            <h3 className="text-xl font-black text-gray-800 tracking-tight">Profile Completion</h3>
          </div>
          <p className="text-sm text-gray-500 mb-8 max-w-sm font-medium leading-relaxed">Complete your profile to unlock special community badges and digital ID features.</p>
          <div className="flex items-center gap-6">
            <div className="flex-1 h-4 bg-white rounded-full overflow-hidden shadow-inner ring-1 ring-gold/10">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${completionPercent}%` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-saffron to-gold" 
              />
            </div>
            <span className="text-3xl font-black text-saffron-dark drop-shadow-sm leading-none">{completionPercent}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
