import React, { useState } from 'react'
import Sidebar from './Sidebar'
import Navbar from './Navbar'
import BottomNav from './BottomNav'
import FloatingIcons from '../ui/FloatingIcons'

const MainLayout = ({ children, activeTab, setActiveTab }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  return (
    <div className="min-h-screen bg-cream selection:bg-saffron/30 selection:text-saffron-dark">
      <div className="tilak-bg opacity-30 pointer-events-none" />
      <FloatingIcons />
      
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar 
          isOpen={isSidebarOpen} 
          setIsOpen={setIsSidebarOpen} 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
      </div>

      {/* Main Content Area */}
      <main className={`transition-all duration-300 min-h-screen flex flex-col ${
        isSidebarOpen ? 'md:pl-[260px]' : 'md:pl-[80px]'
      } pb-32 md:pb-0`}>
        <Navbar setActiveTab={setActiveTab} />
        
        <div className="flex-1 p-4 sm:p-6 md:p-10 max-w-[1600px] mx-auto w-full relative z-10 transition-all">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            {children}
          </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  )
}

export default MainLayout
