import React, { useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Download, QrCode } from 'lucide-react';
import { motion } from 'framer-motion';

const QRView = ({ value, name = 'Devotee', size = 200 }) => {
  const qrRef = useRef();
  const [error, setError] = useState('');

  const safeName = (name || 'Devotee').trim() || 'Devotee';
  const fileBase = `QR_${safeName.replace(/[^\w-]+/g, '_')}`;

  // Last resort when the canvas route fails: hand over the SVG itself, which
  // every phone gallery and print shop can still open.
  const downloadSvgFallback = (svgData) => {
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `${fileBase}.svg`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadQR = () => {
    setError('');
    const svg = qrRef.current?.querySelector('svg');
    if (!svg) {
      setError('Could not read the QR code. Please reload the page and try again.');
      return;
    }
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      try {
        canvas.width = size + 40;
        canvas.height = size + 100;
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw QR
        ctx.drawImage(img, 20, 20);

        // Draw Text
        ctx.fillStyle = '#1f2937';
        ctx.font = 'bold 16px Inter, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(safeName, canvas.width / 2, size + 60);

        ctx.fillStyle = '#6b7280';
        ctx.font = '12px Inter, system-ui, sans-serif';
        ctx.fillText('FOLK Vizag Devotee ID', canvas.width / 2, size + 80);

        // The QR embeds the temple logo by URL. In some browsers that external
        // reference taints the canvas and toDataURL throws a SecurityError -
        // which used to abort here with no download and no message at all.
        const pngFile = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.download = `${fileBase}.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      } catch (err) {
        console.error('QR PNG export failed, falling back to SVG:', err);
        downloadSvgFallback(svgData);
      }
    };

    // A malformed or unloadable SVG never fires onload, so without this the
    // button looked like it did nothing whatsoever.
    img.onerror = () => {
      console.error('QR image could not be rendered; falling back to SVG.');
      downloadSvgFallback(svgData);
    };

    try {
      // btoa() throws on any non-Latin-1 character in the serialized SVG.
      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    } catch (err) {
      console.error('QR encode failed, falling back to SVG:', err);
      downloadSvgFallback(svgData);
    }
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <div 
        ref={qrRef}
        className="p-6 bg-white rounded-xl shadow-premium border border-saffron/10 relative group"
      >
        <div className="absolute inset-0 bg-saffron rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        <QRCodeSVG 
          value={value} 
          size={size}
          level="H"
          includeMargin={false}
          imageSettings={{
            src: "/folk_logo_blue.png",
            x: undefined,
            y: undefined,
            height: size * 0.2,
            width: size * 0.2,
            excavate: true,
          }}
        />
      </div>

      <div className="text-center">
        <h3 className="font-cinzel font-bold text-xl text-ink uppercase tracking-tight">{safeName}</h3>
        <p className="text-ink-muted text-xs font-bold uppercase tracking-label mt-1">Permanent Pass</p>
      </div>

      <motion.button
        whileHover={{ scale: 1.05, y: -2 }}
        whileTap={{ scale: 0.95 }}
        onClick={downloadQR}
        className="flex items-center gap-2 px-6 py-3 bg-ink text-white rounded-2xl font-bold text-sm shadow-lg hover:bg-black transition-all"
      >
        <Download size={18} />
        <span>Save to Phone</span>
      </motion.button>

      {error && (
        <p role="alert" className="text-xs font-bold text-red-600 text-center max-w-xs leading-relaxed">
          {error}
        </p>
      )}
    </div>
  );
};

export default QRView;
