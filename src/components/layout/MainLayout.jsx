import React from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';

const MainLayout = ({ children, activeTab, setActiveTab }) => (
  <div className="min-h-screen bg-paper">
    <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
    <div className="lg:pl-64 min-h-screen flex flex-col">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      {/* pb clears the phone tab bar (h-16 + iOS safe area). */}
      <main className="flex-1 w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8 pb-28 lg:pb-10">
        {children}
      </main>
    </div>
    <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
  </div>
);

export default MainLayout;
