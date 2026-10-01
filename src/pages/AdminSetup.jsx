import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Loader2, Mail, User, Key, ArrowRight, Building2, Home, Calendar, Users, CheckSquare, Heart, ArrowLeft } from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { useAuth } from '../hooks/useAuth';
import { provisionAdminLogin, validateAdminPassword } from '../lib/adminLogin';
import AdminPasswordFields from '../components/auth/AdminPasswordFields';

const MANAGEMENT_LINKS = [
  { id: 'events', label: 'Events', desc: 'Create / manage community events', icon: <Calendar />, color: 'bg-saffron/10 text-saffron' },
  { id: 'hostels', label: 'Hostels', desc: 'Manage youth hostel listings & bookings', icon: <Building2 />, color: 'bg-celestial/10 text-celestial' },
  { id: 'accommodation', label: 'Accommodation', desc: 'Approve / reject accommodation requests', icon: <Home />, color: 'bg-gold/10 text-gold-dark' },
  { id: 'devotees', label: 'Devotees', desc: 'Manage members, roles & levels', icon: <Users />, color: 'bg-purple-100 text-purple-600' },
  { id: 'attendance', label: 'Attendance', desc: 'Scan QR & record attendance', icon: <CheckSquare />, color: 'bg-green-100 text-green-600' },
  { id: 'seva', label: 'Seva', desc: 'Create sevas & manage volunteers', icon: <Heart />, color: 'bg-pink-100 text-pink-500' },
];

const AdminSetup = ({ setActiveTab }) => {
  const { user } = useAuth();
  const [adminSetupState, setAdminSetupState] = useState({ status: 'idle', message: '' });
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Staff see the management panels; only a full admin may reset the shared
  // admin login (the server's createAdmin accepts an existing admin, the root
  // UID, or the setup code — a folks_head or devotee is always rejected).
  const isStaff = user?.role === 'admin' || user?.role === 'folks_head';
  const isAdmin = user?.role === 'admin';

  const createSiteAdmin = async () => {
    const problem = validateAdminPassword(newPassword, confirmPassword);
    if (problem) {
      setAdminSetupState({ status: 'error', message: problem });
      return;
    }
    setAdminSetupState({ status: 'working', message: 'Setting up the shared admin login…' });
    try {
      const message = await provisionAdminLogin({ password: newPassword });
      setNewPassword('');
      setConfirmPassword('');
      setAdminSetupState({ status: 'done', message });
    } catch (error) {
      console.error("createAdmin failed:", error);
      setAdminSetupState({ status: 'error', message: error?.message || 'Failed to create admin login' });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="pb-10 max-w-5xl mx-auto"
    >
      <button
        type="button"
        onClick={() => setActiveTab('admin')}
        className="flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-saffron transition-colors mb-4"
      >
        <ArrowLeft size={14} /> Back to Command Center
      </button>

      <div className="flex items-center gap-3 mb-2">
        <div className="w-11 h-11 rounded-2xl bg-celestial/10 flex items-center justify-center">
          <ShieldCheck className="text-celestial" size={22} />
        </div>
        <h1 className="text-3xl font-bold font-poppins text-saffron-dark">Site Admin</h1>
      </div>
      <p className="text-sm text-gray-500 mb-8">
        Everything you need to run the whole site from one place — management panels and the shared Administrator login.
      </p>

      {!isStaff && (
        <Card className="p-6 mb-8 border-none shadow-premium bg-gradient-to-br from-red-50 to-orange-50">
          <h3 className="font-black text-gray-800 mb-2 flex items-center gap-2">
            <ShieldCheck size={16} className="text-red-500" /> Sign in with the admin login to manage the site
          </h3>
          <p className="text-sm text-gray-600 leading-relaxed mb-4">
            You are signed in as a <span className="font-bold text-gray-800">{user?.role || 'devotee'}</span>.
            The panels below are only visible to the Site Administrator / Folks Head. To manage
            the site, sign out and sign in with the shared admin login (username{' '}
            <span className="font-bold text-saffron">admin</span>) — ask the site owner for its password.
          </p>
          <p className="text-xs text-gray-500 mt-3 leading-relaxed">
            Only an existing administrator (or the site owner, from the admin portal at
            <span className="font-bold text-gray-700"> /admin</span>) can create or reset
            this login.
          </p>
        </Card>
      )}

      {isStaff && (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
        {MANAGEMENT_LINKS.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
          >
            <Card className="p-6 h-full border-none shadow-premium cursor-pointer hover:-translate-y-1 transition-transform" hover={false}>
              <button type="button" onClick={() => setActiveTab(item.id)} className="w-full text-left">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center mb-4 ${item.color}`}>
                  {item.icon}
                </div>
                <h3 className="font-black text-gray-800 mb-1 flex items-center justify-between">
                  {item.label}
                  <ArrowRight size={16} className="text-gray-300" />
                </h3>
                <p className="text-xs text-gray-400 leading-relaxed">{item.desc}</p>
              </button>
            </Card>
          </motion.div>
        ))}
      </div>
      )}

      {/* Administrator login card. The server no longer has an "anyone may do
          this while no admin exists" path (that let the first random sign-up
          take over a fresh site), so the form is only offered to an existing
          admin. The site owner bootstraps from /admin, where the access notice
          also takes the server's ADMIN_SETUP_CODE. */}
      <Card className="p-6 mb-0 border-none shadow-premium bg-gradient-to-br from-white to-gold/10">
        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center mb-4 bg-celestial/10 text-celestial`}>
          <Key size={20} />
        </div>
        <h3 className="font-black text-gray-800 mb-1">Administrator Login</h3>
        <p className="text-xs text-gray-400 leading-relaxed mb-4">
          A dedicated login with full site access — socials, membership data, payments, everything.
        </p>
        <div className="space-y-2 mb-5">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-700 bg-gray-50 rounded-xl px-3 py-2.5">
            <User size={14} className="text-gray-400" /> username: <span className="text-saffron">admin</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-gray-700 bg-gray-50 rounded-xl px-3 py-2.5">
            <Mail size={14} className="text-gray-400" /> sign-in: <span className="text-gray-500">admin (auto-mapped)</span>
          </div>
        </div>
        {isAdmin ? (
          <>
            <div className="mb-4">
              <AdminPasswordFields
                password={newPassword}
                confirm={confirmPassword}
                onPasswordChange={setNewPassword}
                onConfirmChange={setConfirmPassword}
                disabled={adminSetupState.status === 'working'}
              />
            </div>
            <Button
              onClick={createSiteAdmin}
              disabled={adminSetupState.status === 'working'}
              className="w-full bg-navy border-none font-bold py-3 rounded-xl shadow-lg"
            >
              {adminSetupState.status === 'working' ? <Loader2 className="animate-spin mx-auto" size={18} /> : 'Create / Reset Admin Login'}
            </Button>
            {adminSetupState.status !== 'idle' && (
              <p className={`mt-3 text-xs font-bold text-center ${adminSetupState.status === 'error' ? 'text-red-500' : 'text-green-600'}`}>
                {adminSetupState.message}
              </p>
            )}
          </>
        ) : (
          <p className="text-xs font-bold text-center bg-blue-50 text-blue-600 rounded-xl px-3 py-3 leading-relaxed">
            Only an existing administrator can create or reset this login. If nobody has
            it yet, the site owner sets it up from the admin portal at <span className="font-black">/admin</span>.
          </p>
        )}
      </Card>

      <Card className="p-6 border-none shadow-premium bg-cream/30">
        <h3 className="font-black text-gray-800 mb-2 flex items-center gap-2">
          <Mail size={16} className="text-saffron" /> How to sign in as Admin
        </h3>
        <ol className="list-decimal list-inside text-sm text-gray-500 space-y-1.5 leading-relaxed">
          <li>Log out if you are signed in as a regular devotee.</li>
          <li>On the login screen, type username <span className="font-bold text-gray-700">admin</span> and the admin password the site owner set.</li>
          <li>You will land on the <span className="font-bold text-gray-700">Command Center</span> — from there use the management cards above (or the navbar) to run Events, Hostels, Accommodation, Devotees, Attendance and Seva.</li>
        </ol>
      </Card>
    </motion.div>
  );
};

export default AdminSetup;