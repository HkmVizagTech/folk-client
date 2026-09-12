import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Download, QrCode } from 'lucide-react';
import { motion } from 'framer-motion';

const QRView = ({ value, name = 'Devotee', size = 200 }) => {
  const qrRef = useRef();

  const downloadQR = () => {
    const svg = qrRef.current.querySelector('svg');
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
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
      ctx.fillText(name, canvas.width / 2, size + 60);
      
      ctx.fillStyle = '#6b7280';
      ctx.font = '12px Inter, system-ui, sans-serif';
      ctx.fillText('Folkvizag Devotee ID', canvas.width / 2, size + 80);
      
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `QR_${name.replace(/\s+/g, '_')}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <div 
        ref={qrRef}
        className="p-6 bg-white rounded-[2.5rem] shadow-premium border border-saffron/10 relative group"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-saffron/5 to-gold/5 rounded-[2.5rem] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        <QRCodeSVG 
          value={value} 
          size={size}
          level="H"
          includeMargin={false}
          imageSettings={{
            src: "/logo.png",
            x: undefined,
            y: undefined,
            height: size * 0.2,
            width: size * 0.2,
            excavate: true,
          }}
        />
      </div>

      <div className="text-center">
        <h3 className="font-cinzel font-black text-xl text-gray-900 uppercase tracking-tight">{name}</h3>
        <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">Permanent Pass</p>
      </div>

      <motion.button
        whileHover={{ scale: 1.05, y: -2 }}
        whileTap={{ scale: 0.95 }}
        onClick={downloadQR}
        className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-2xl font-bold text-sm shadow-lg hover:bg-black transition-all"
      >
        <Download size={18} />
        <span>Save to Phone</span>
      </motion.button>
    </div>
  );
};

export default QRView;
