import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Smartphone } from 'lucide-react';

const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if the app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return;
    }

    const handler = (e) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Update UI notify the user they can add to home screen
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    // Show the prompt
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[500] w-[95%] max-w-md px-4"
        >
          <div className="bg-white/90 backdrop-blur-xl border border-white/40 rounded-[2.5rem] p-1.5 pr-5 shadow-premium-xl flex items-center gap-4">
             <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md border border-gray-100 overflow-hidden shrink-0">
                <img src="/logo_pwa.png" alt="logo" className="w-9 h-9 object-contain" />
             </div>
             <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1">
                   <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                   <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none truncate">Get Mobile App</p>
                </div>
                <p className="text-sm font-black text-gray-900 leading-none italic uppercase tracking-tight">Open in app</p>
             </div>
             <button 
               onClick={handleInstallClick}
               className="px-5 py-2.5 bg-gradient-to-r from-saffron to-gold text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full shadow-lg shadow-saffron/20 hover:scale-105 active:scale-95 transition-all"
             >
                Open
             </button>
             <button 
               onClick={() => setIsVisible(false)}
               className="text-gray-300 hover:text-gray-500 transition-colors"
             >
                <X size={18} />
             </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default InstallPrompt;
