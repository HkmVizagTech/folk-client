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
    // Without a camera API there is nothing for html5-qrcode to render into,
    // and the box just sat there empty with no explanation. The usual cause is
    // a page served over plain http:// (getUserMedia is a secure-context API),
    // which is exactly how staff hit it on a phone on the venue wifi.
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setError(
        window.isSecureContext === false
          ? 'The camera needs a secure connection. Open this page over https:// (or on localhost) and try again.'
          : 'This browser has no camera access. Use the manual token entry on the Attendance page instead.'
      );
      return undefined;
    }

    let scanner;
    try {
      scanner = new Html5QrcodeScanner(
        "reader",
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0
        },
        /* verbose= */ false
      );

      scanner.render(onScanSuccess, onScanFailure);
    } catch (err) {
      // A thrown render() left the scanner silently dead; surface it instead.
      console.error("Scanner start failed", err);
      setError(err?.message || 'Could not start the camera. Check camera permissions for this site, then reload.');
      return undefined;
    }

    function onScanSuccess(decodedText, decodedResult) {
      console.log(`Scan result: ${decodedText}`, decodedResult);
      onScanRef.current(decodedText);
      // Stop scanning after success. Swallow the rejection: the unmount
      // cleanup below may have cleared it already, and an unhandled rejection
      // here would surface as a scary console error mid-check-in.
      Promise.resolve(scanner.clear()).catch(() => {});
    }

    function onScanFailure(error) {
      // Per-frame "no QR code in view" noise - deliberately ignored.
    }

    scannerRef.current = scanner;

    return () => {
      if (scannerRef.current) {
        Promise.resolve(scannerRef.current.clear()).catch(err => console.error("Scanner cleanup error", err));
        scannerRef.current = null;
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-ink/90"
        onClick={onClose}
      />
      
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative w-full max-w-md bg-white rounded-xl sm:rounded-xl shadow-premium-xl overflow-x-hidden overflow-y-auto max-h-[90vh]"
      >
        <div className="p-5 sm:p-8 border-b border-line flex items-center justify-between gap-3 bg-white sticky top-0 z-10">
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-saffron uppercase tracking-label block mb-1">Scanner Active</span>
            <h3 className="text-lg sm:text-xl font-bold text-ink uppercase tracking-tight truncate">
              {mode === 'prasadam' ? 'Prasadam Mode' : 'Attendance Mode'}
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-3 min-w-[44px] min-h-[44px] flex items-center justify-center shrink-0 bg-paper-dark text-ink-muted hover:text-ink rounded-2xl transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 sm:p-6">
          {error ? (
            <div
              role="alert"
              className="rounded-3xl border-4 border-red-100 bg-red-50 p-6 min-h-[260px] sm:min-h-[300px] flex flex-col items-center justify-center text-center gap-3"
            >
              <Camera size={28} className="text-red-500" />
              <p className="text-sm font-bold text-red-700 leading-relaxed">{error}</p>
            </div>
          ) : (
            <div id="reader" className="overflow-hidden rounded-3xl border-4 border-line/60 bg-paper min-h-[260px] sm:min-h-[300px]" />
          )}

          <div className="mt-8 space-y-4">
             <div className="flex items-center gap-4 p-4 bg-saffron/5 rounded-2xl border border-saffron/10">
                <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-saffron shrink-0">
                   <Camera size={20} />
                </div>
                <p className="text-xs font-bold text-ink-muted uppercase tracking-label leading-relaxed">
                   Align QR code within the frame <br/> to auto-trigger scan
                </p>
             </div>

             <button
               onClick={() => window.location.reload()}
               className="w-full py-4 min-h-[44px] text-[10px] font-bold text-ink-muted hover:text-saffron uppercase tracking-label flex items-center justify-center gap-2 transition-all"
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
