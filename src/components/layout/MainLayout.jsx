import React, { useRef } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import { gsap, useGSAP, prefersReducedMotion } from '../../lib/motion';

/** App shell. The content area fades in whenever the active screen changes. */
const MainLayout = ({ children, activeTab, setActiveTab }) => {
  const main = useRef(null);

  useGSAP(() => {
    window.scrollTo({ top: 0 });
    if (prefersReducedMotion() || !main.current) return;
    gsap.fromTo(main.current, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.4, ease: 'power2.out', clearProps: 'all' });
  }, { dependencies: [activeTab], scope: main });

  return (
    <div className="min-h-screen bg-paper">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="lg:pl-64 min-h-screen flex flex-col">
        <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
        {/* pb clears the phone tab bar (h-16 + iOS safe area). */}
        <main ref={main} className="flex-1 w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 pb-28 lg:pb-12">
          {children}
        </main>
      </div>
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
};

export default MainLayout;
