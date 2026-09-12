import React from 'react'
import { motion } from 'framer-motion'
import { 
  LayoutDashboard, 
  User, 
  Calendar, 
  TrendingUp, 
  Home, 
  CheckSquare, 
  X, 
  Menu,
  ChevronRight,
  Shield,
  Heart
} from 'lucide-react'
import { cn } from '../ui/Card'
import { useAuth } from '../../hooks/useAuth'

const NavItem = ({ icon, label, active, isOpen, onClick }) => (
  <motion.div 
    whileHover={{ x: 5 }}
    onClick={onClick}
    className={cn(
      "flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-all",
      active ? 'bg-gradient-to-r from-saffron/10 to-gold/10 text-saffron-dark ring-1 ring-saffron/20' : 'text-gray-500 hover:text-saffron hover:bg-saffron/5'
    )}
  >
    <div className={cn(active ? 'text-saffron' : 'text-gray-400')}>
      {React.cloneElement(icon, { size: 24 })}
    </div>
    {isOpen && (
      <motion.span 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="font-medium whitespace-nowrap"
      >
        {label}
      </motion.span>
    )}
    {active && isOpen && <ChevronRight className="ml-auto text-saffron" size={16} />}
  </motion.div>
)

const Sidebar = ({ isOpen, setIsOpen, activeTab, setActiveTab }) => {
  const { user } = useAuth();
  
  const allItems = [
    { id: 'admin', icon: <Shield />, label: "Command Center", roles: ['admin', 'folks_head'] },
    { id: 'devotees', icon: <User />, label: "Devotees", roles: ['admin', 'folks_head'] },
    { id: 'events', icon: <Calendar />, label: "Event Management", roles: ['admin', 'folks_head', 'devotee'] },
    { id: 'seva', icon: <Heart />, label: "Seva Management", roles: ['admin', 'folks_head', 'devotee'] },
    { id: 'dashboard', icon: <TrendingUp />, label: "Sadhana Tracker", roles: ['admin', 'folks_head', 'devotee'] },
    { id: 'profile', icon: <User />, label: "My Profile", roles: ['admin', 'folks_head', 'devotee'] },
    { id: 'accommodation', icon: <Home />, label: "Accommodation", roles: ['admin', 'folks_head', 'devotee'] },
    { id: 'attendance', icon: <CheckSquare />, label: "Attendance", roles: ['admin', 'folks_head'] },
  ]

  const menuItems = allItems.filter(item => item.roles.includes(user?.role));

  return (
    <motion.aside 
      initial={false}
      animate={{ width: isOpen ? 260 : 80 }}
      className="fixed left-0 top-0 h-full bg-white border-r border-saffron/10 z-50 overflow-hidden shadow-premium"
    >
      <div className="p-6 flex items-center gap-4 overflow-hidden">
        <div className="w-10 h-10 shrink-0">
          <img 
            src="/logo.png" 
            alt="Logo" 
            className="w-full h-full object-contain filter sepia saturate-[6] hue-rotate-[-30deg] drop-shadow-[0_0_5px_rgba(255,153,51,0.2)]" 
          />
        </div>
        {isOpen && (
          <motion.span 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="font-black text-xl bg-gradient-to-r from-saffron to-gold bg-clip-text text-transparent whitespace-nowrap"
          >
            Folkvizag
          </motion.span>
        )}
      </div>

      <nav className="mt-8 px-4 space-y-2">
        {menuItems.map((item) => (
          <NavItem 
            key={item.id}
            icon={item.icon}
            label={item.label}
            active={activeTab === item.id}
            isOpen={isOpen}
            onClick={() => setActiveTab(item.id)}
          />
        ))}
      </nav>

      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="absolute bottom-8 right-0 -mr-4 w-8 h-8 bg-saffron text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
      >
        {isOpen ? <X size={16} /> : <Menu size={16} />}
      </button>
    </motion.aside>
  )
}

export default Sidebar
