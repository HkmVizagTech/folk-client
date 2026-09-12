import React, { useState, useRef, useEffect } from 'react'
import { LogOut, User, Bell, Award, Shield, Calendar, X } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useFirestore } from '../../hooks/useFirestore'
import { orderBy, limit } from 'firebase/firestore'
import { motion, AnimatePresence } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'

const toDate = (value) => {
  if (value?.toDate) return value.toDate();
  return value ? new Date(value) : new Date();
};

const timeAgo = (value) => {
  try {
    return formatDistanceToNow(toDate(value), { addSuffix: true });
  } catch {
    return 'Just now';
  }
};

const Navbar = ({ setActiveTab }) => {
  const { user, logout } = useAuth()
  const [showNotifs, setShowNotifs] = useState(false)
  const [showAllNotifs, setShowAllNotifs] = useState(false)
  const notifRef = useRef(null)

  const notifQuery = React.useMemo(() => [
    orderBy('createdAt', 'desc'),
    limit(10)
  ], [])

  const allNotifsQuery = React.useMemo(() => [orderBy('createdAt', 'desc')], [])

  const { data: notifications } = useFirestore('notifications', notifQuery)
  const { data: allNotifications } = useFirestore('notifications', allNotifsQuery)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifs(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <header className="h-16 sm:h-20 bg-white/50 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-8 flex items-center justify-between border-b border-saffron/10 transition-all duration-500">
      <div className="flex items-center gap-4">
        <div className="flex items-center drop-shadow-sm hover:drop-shadow-md transition-all duration-300">
          <img 
            src="/logo.png" 
            alt="Folkvizag Logo" 
            className="h-8 sm:h-12 w-auto object-contain hover:scale-[1.02] transition-transform cursor-pointer drop-shadow-md brightness-0 opacity-90" 
          />
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-6">
        <div className="flex items-center gap-1 sm:gap-6">
          
          {/* Realtime Notification Bell */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifs(!showNotifs)}
              aria-label="Notifications"
              className="p-2.5 min-w-[44px] min-h-[44px] text-gray-400 hover:text-saffron hover:bg-saffron/5 rounded-xl transition-all relative group flex items-center justify-center"
            >
              <Bell size={22} className={showNotifs ? 'text-saffron' : ''} />
              {notifications?.length > 0 && (
                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white group-hover:scale-110 transition-transform animate-pulse" />
              )}
            </button>
            <AnimatePresence>
              {showNotifs && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-3 w-[calc(100vw-2rem)] max-w-[320px] sm:w-80 bg-white rounded-3xl shadow-premium-xl border border-gray-100 overflow-hidden z-50 origin-top-right"
                >
                  <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                    <h3 className="font-bold text-gray-800">Notifications</h3>
                    <span className="text-[10px] font-bold bg-saffron/10 text-saffron px-2 py-1 rounded-md">{notifications?.length || 0} New</span>
                  </div>
                  <div className="max-h-[350px] overflow-y-auto scrollbar-hide">
                    {notifications?.length > 0 ? notifications.map((notif) => (
                      <div 
                        key={notif.id} 
                        onClick={() => { setActiveTab('events'); setShowNotifs(false); }}
                        className="p-4 border-b border-gray-50 hover:bg-saffron/5 transition-colors cursor-pointer group"
                      >
                        <div className="flex gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                            <Calendar size={14} className="text-blue-500" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-800 group-hover:text-saffron transition-colors">{notif.title}</p>
                            <p className="text-xs text-gray-500 mt-1 leading-relaxed">{notif.message}</p>
                            <p className="text-[10px] text-gray-400 mt-2 font-medium">{timeAgo(notif.createdAt)}</p>
                          </div>
                        </div>
                      </div>
                    )) : (
                      <div className="p-8 text-center text-gray-400 text-sm">No new notifications</div>
                    )}
                  </div>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => { setShowNotifs(false); setShowAllNotifs(true); }}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setShowNotifs(false); setShowAllNotifs(true); } }}
                    className="p-3 text-center border-t border-gray-50 bg-gray-50/50 hover:bg-gray-100 cursor-pointer transition-colors text-xs font-bold text-saffron"
                  >
                    View All Activity
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="h-10 w-[1px] bg-gray-100 hidden sm:block" />

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="flex items-center justify-end gap-1.5 mb-0.5">
                <p className="text-sm font-bold text-gray-800 leading-none max-w-[150px] truncate">
                  {user?.name || user?.displayName || 'Devotee'}
                </p>
                {user?.role === 'admin' && (
                  <div className="px-2 py-0.5 bg-saffron/10 rounded flex items-center gap-1">
                    <Shield size={10} className="text-saffron" />
                    <span className="text-[10px] font-black text-saffron uppercase">Admin</span>
                  </div>
                )}
              </div>
              {user?.role === 'folks_head' && (
                <p className="text-[10px] text-gold-dark font-bold uppercase tracking-widest hidden sm:block">Folks Head</p>
              )}
              {user?.role === 'devotee' && (
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest hidden sm:block">Devotee</p>
              )}
              {!user?.role && (
                <p className="text-[10px] text-red-400 font-bold uppercase tracking-widest">Unassigned</p>
              )}
            </div>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-saffron to-gold p-0.5 shadow-lg group cursor-pointer">
              <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center overflow-hidden">
                <User className="text-saffron transition-transform group-hover:scale-110" size={20} />
              </div>
            </div>
          </div>
          
          <button
            onClick={logout}
            className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50/50 rounded-xl transition-all"
            title="Sign Out"
            aria-label="Sign out"
          >
            <LogOut size={22} />
          </button>
        </div>
      </div>

      {/* All Notifications Modal */}
      <AnimatePresence>
        {showAllNotifs && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAllNotifs(false)}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-premium-xl border border-gray-100 overflow-hidden flex flex-col max-h-[80vh]"
            >
              <div className="p-5 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                <h3 className="font-bold text-gray-800">All Activity</h3>
                <button
                  onClick={() => setShowAllNotifs(false)}
                  aria-label="Close"
                  className="p-2 min-w-[40px] min-h-[40px] flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="overflow-y-auto scrollbar-hide">
                {allNotifications?.length > 0 ? allNotifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => { setActiveTab('events'); setShowAllNotifs(false); }}
                    className="p-4 border-b border-gray-50 hover:bg-saffron/5 transition-colors cursor-pointer group"
                  >
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                        <Calendar size={14} className="text-blue-500" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-800 group-hover:text-saffron transition-colors">{notif.title}</p>
                        <p className="text-xs text-gray-500 mt-1 leading-relaxed">{notif.message}</p>
                        <p className="text-[10px] text-gray-400 mt-2 font-medium">{timeAgo(notif.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="p-12 text-center text-gray-400 text-sm">No notifications yet</div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </header>
  )
}

export default Navbar
