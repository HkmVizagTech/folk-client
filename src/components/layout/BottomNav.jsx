import React from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard, TrendingUp, Calendar, Home, CheckSquare, Heart, QrCode, User, Building2, Bus, Gift, Sparkles } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth';

const BottomNav = ({ activeTab, setActiveTab }) => {
  const { user } = useAuth();

  const allItems = [
    { id: 'admin', icon: <LayoutDashboard size={20} />, label: 'Admin', roles: ['admin', 'folks_head'] },
    { id: 'dashboard', icon: <TrendingUp size={20} />, label: 'Sadhana', roles: ['admin', 'folks_head', 'devotee'] },
    { id: 'events', icon: <Calendar size={20} />, label: 'Events', roles: ['admin', 'folks_head', 'devotee'] },
    { id: 'attendance', icon: <QrCode size={20} />, label: 'Verify', roles: ['admin', 'folks_head'] },
    { id: 'seva', icon: <Heart size={20} />, label: 'Seva', roles: ['admin', 'folks_head', 'devotee'] },
    { id: 'hostels', icon: <Building2 size={20} />, label: 'Hostels', roles: ['admin', 'folks_head', 'devotee'] },
    { id: 'accommodation', icon: <Home size={20} />, label: 'Stay', roles: ['admin', 'folks_head', 'devotee'] },
    { id: 'trips', icon: <Bus size={20} />, label: 'Trips', roles: ['admin', 'folks_head', 'devotee'] },
    { id: 'donate', icon: <Gift size={20} />, label: 'Donate', roles: ['admin', 'folks_head', 'devotee'] },
    { id: 'profile', icon: <User size={20} />, label: 'Profile', roles: ['admin', 'folks_head', 'devotee'] },
    { id: 'about', icon: <Sparkles size={20} />, label: 'About', roles: ['admin', 'folks_head', 'devotee'] },
  ]

  const navItems = allItems.filter(item => item.roles.includes(user?.role));

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-20 bg-white/80 backdrop-blur-xl border-t border-saffron/10 z-[100] md:hidden pb-2 shadow-[0_-10px_30px_-15px_rgba(255,153,51,0.15)]">
      <div className="flex items-stretch overflow-x-auto scrollbar-hide h-full px-2 gap-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className="min-w-[70px] flex-1 flex flex-col items-center justify-center gap-1.5 relative py-2 shrink-0"
          >
            <div className={`transition-all duration-300 p-2 rounded-xl ${
              activeTab === item.id 
                ? 'bg-saffron text-white shadow-lg shadow-saffron/30 -translate-y-1' 
                : 'text-gray-400'
            }`}>
              {item.icon}
            </div>
            <span className={`text-[10px] font-bold transition-all ${
              activeTab === item.id ? 'text-saffron opacity-100' : 'text-gray-400 opacity-80'
            }`}>
              {item.label}
            </span>
            {activeTab === item.id && (
              <motion.div 
                layoutId="bottomNavIndicator"
                className="absolute -top-1 w-1 h-1 bg-saffron rounded-full"
              />
            )}
          </button>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;
