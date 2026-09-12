import React from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard, TrendingUp, Calendar, Home, CheckSquare, Heart, QrCode, User } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth';

const BottomNav = ({ activeTab, setActiveTab }) => {
  const { user } = useAuth();

  const allItems = [
    { id: 'admin', icon: <LayoutDashboard size={20} />, label: 'Admin', roles: ['admin', 'folks_head'] },
    { id: 'dashboard', icon: <TrendingUp size={20} />, label: 'Sadhana', roles: ['admin', 'folks_head', 'devotee'] },
    { id: 'events', icon: <Calendar size={20} />, label: 'Events', roles: ['admin', 'folks_head', 'devotee'] },
    { id: 'attendance', icon: <QrCode size={20} />, label: 'Verify', roles: ['admin', 'folks_head'] },
    { id: 'seva', icon: <Heart size={20} />, label: 'Seva', roles: ['admin', 'folks_head', 'devotee'] },
    { id: 'profile', icon: <User size={20} />, label: 'Profile', roles: ['admin', 'folks_head', 'devotee'] },
    { id: 'accommodation', icon: <Home size={20} />, label: 'Stay', roles: ['admin', 'folks_head', 'devotee'] },
  ]

  const navItems = allItems.filter(item => item.roles.includes(user?.role));

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-20 bg-white/80 backdrop-blur-xl border-t border-saffron/10 z-[100] md:hidden px-4 flex items-center justify-between pb-2 shadow-[0_-10px_30px_-15px_rgba(255,153,51,0.15)]">
      {navItems.map((item) => (
        <button
          key={item.id}
          onClick={() => setActiveTab(item.id)}
          className="flex-1 flex flex-col items-center justify-center gap-1.5 relative py-2"
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
    </nav>
  );
};

export default BottomNav;
