import React from 'react';

/**
 * Japa progress ring: a circular meter for "rounds done today".
 * Colours come from CSS classes — `trackClass`/`barClass` set the stroke via
 * `text-*` (the SVG strokes use currentColor). Children render in the centre.
 */
const ProgressRing = ({ value = 0, max = 16, size = 120, stroke = 9, trackClass = 'text-line', barClass = 'text-saffron', className = '', label, children }) => {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, max > 0 ? value / max : 0));
  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      role="progressbar"
      aria-valuenow={Math.round(pct * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label || `${value} of ${max}`}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className={`stroke-current ${trackClass}`} opacity="0.6" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          className={`stroke-current ${barClass} transition-[stroke-dashoffset] duration-700 ease-out`}
        />
      </svg>
      <span className="absolute inset-0 flex flex-col items-center justify-center text-center">{children}</span>
    </div>
  );
};

export default ProgressRing;
