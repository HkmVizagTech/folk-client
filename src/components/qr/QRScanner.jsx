import React, { useEffect, useState, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Camera, RefreshCw } from 'lucide-react';

const QRScanner = ({ onScan }) => {
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

  // Camera viewport only. ScanningOverlay is the modal - it owns the backdrop,
  // header, close button, the Attendance/Prasadam toggle and the result panel.
  // This used to render its own `fixed inset-0` layer on top of all of that,
  // so the toggle and the result were unreachable while the camera was live.
  return (
    <div className="w-full">
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

      <div className="mt-6 space-y-4">
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
  );
};

export default QRScanner;
