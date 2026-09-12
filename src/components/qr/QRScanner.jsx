import React, { useEffect, useState, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, RefreshCw } from 'lucide-react';

const QRScanner = ({ onScan, onClose, mode = 'attendance' }) => {
  const [error, setError] = useState(null);
  const scannerRef = useRef(null);

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
      onScan(decodedText);
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
        className="relative w-full max-w-md bg-white rounded-[3rem] shadow-premium-xl overflow-hidden"
      >
        <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div>
            <span className="text-[10px] font-black text-saffron uppercase tracking-[0.3em] block mb-1">Scanner Active</span>
            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight italic">
              {mode === 'prasadam' ? 'Prasadam Mode' : 'Attendance Mode'}
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="p-3 bg-gray-100 text-gray-400 hover:text-gray-600 rounded-2xl transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <div id="reader" className="overflow-hidden rounded-3xl border-4 border-gray-50 bg-gray-50 min-h-[300px]" />
          
          <div className="mt-8 space-y-4">
             <div className="flex items-center gap-4 p-4 bg-saffron/5 rounded-2xl border border-saffron/10">
                <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-saffron">
                   <Camera size={20} />
                </div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest leading-relaxed">
                   Align QR code within the frame <br/> to auto-trigger scan
                </p>
             </div>
             
             <button 
               onClick={() => window.location.reload()}
               className="w-full py-4 text-[10px] font-black text-gray-400 hover:text-saffron uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all"
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
