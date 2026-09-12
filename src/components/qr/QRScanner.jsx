import React, { useEffect, useState, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, RefreshCw } from 'lucide-react';

const QRScanner = ({ onScan, onClose, mode = 'attendance' }) => {
  const [error, setError] = useState(null);
  const scannerRef = useRef(null);

  // The scanner instance is only created once (mount), but `onScan` (and the
  // `mode` it was built with) can change on every re-render of the parent
  // (e.g. staff toggling Attendance/Prasadam mode without closing the
  // scanner). Reading it through a ref that's kept in sync on every render
  // means a scan always uses the CURRENT mode/handler instead of silently
  // acting on whatever was passed in at mount time.
  const onScanRef = useRef(onScan);
  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "reader",
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      },
      /* verbose= */ false
    );

    scanner.render(onScanSuccess, onScanFailure);

    function onScanSuccess(decodedText, decodedResult) {
      console.log(`Scan result: ${decodedText}`, decodedResult);
      onScanRef.current(decodedText);
      scanner.clear(); // Stop scanning after success
    }

    function onScanFailure(error) {
      // console.warn(`Code scan error: ${error}`);
    }

    scannerRef.current = scanner;

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(err => console.error("Scanner cleanup error", err));
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-gray-900/90 backdrop-blur-md"
        onClick={onClose}
      />
      
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative w-full max-w-md bg-white rounded-[2rem] sm:rounded-[3rem] shadow-premium-xl overflow-x-hidden overflow-y-auto max-h-[90vh]"
      >
        <div className="p-5 sm:p-8 border-b border-gray-100 flex items-center justify-between gap-3 bg-white sticky top-0 z-10">
          <div className="min-w-0">
            <span className="text-[10px] font-black text-saffron uppercase tracking-[0.3em] block mb-1">Scanner Active</span>
            <h3 className="text-lg sm:text-xl font-black text-gray-900 uppercase tracking-tight italic truncate">
              {mode === 'prasadam' ? 'Prasadam Mode' : 'Attendance Mode'}
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-3 min-w-[44px] min-h-[44px] flex items-center justify-center shrink-0 bg-gray-100 text-gray-400 hover:text-gray-600 rounded-2xl transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 sm:p-6">
          <div id="reader" className="overflow-hidden rounded-3xl border-4 border-gray-50 bg-gray-50 min-h-[260px] sm:min-h-[300px]" />

          <div className="mt-8 space-y-4">
             <div className="flex items-center gap-4 p-4 bg-saffron/5 rounded-2xl border border-saffron/10">
                <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-saffron shrink-0">
                   <Camera size={20} />
                </div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest leading-relaxed">
                   Align QR code within the frame <br/> to auto-trigger scan
                </p>
             </div>

             <button
               onClick={() => window.location.reload()}
               className="w-full py-4 min-h-[44px] text-[10px] font-black text-gray-400 hover:text-saffron uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all"
             >
                <RefreshCw size={14} /> Reset Camera
             </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default QRScanner;
