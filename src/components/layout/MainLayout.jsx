import React, { Suspense } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import PageTransition from './PageTransition';

/** App shell: fixed navigation, with the screen swapped (and animated) inside <main>. */
const MainLayout = ({ children, activeTab, setActiveTab }) => (
  <div className="min-h-screen bg-paper">
    <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
    <div className="lg:pl-64 min-h-screen flex flex-col">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      {/* pb clears the phone tab bar (h-16 + iOS safe area). */}
      <main className="flex-1 w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 pb-28 lg:pb-12">
        {/* Boundary sits above the keyed screen, so a tab change made in a
            transition keeps the old screen until the new one is ready. */}
        <Suspense fallback={<div className="min-h-[50vh]" />}>
          <PageTransition key={activeTab}>{children}</PageTransition>
        </Suspense>
      </main>
    </div>
    <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
  </div>
);

export default MainLayout;
