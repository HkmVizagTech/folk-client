import React, { useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { gsap, EASE, DURATION, prefersReducedMotion } from '../../../lib/motion';

const roundBtn = 'inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold';

const Lightbox = ({ items, index, onClose, onStep }) => {
  const root = useRef(null);
  const image = useRef(null);
  const closeBtn = useRef(null);
  const current = index !== null ? items[index] : null;
  const isOpen = Boolean(current);

  useEffect(() => {
    if (!isOpen) return;
    closeBtn.current?.focus();
    if (!prefersReducedMotion()) gsap.fromTo(root.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: DURATION.fast, ease: EASE });
  }, [isOpen]);

  useEffect(() => {
    if (index === null || prefersReducedMotion()) return;
    gsap.fromTo(image.current, { autoAlpha: 0, scale: 0.97 }, { autoAlpha: 1, scale: 1, duration: DURATION.base, ease: EASE });
  }, [index]);

  if (!current) return null;
  return (
    <div ref={root} className="fixed inset-0 z-[200] flex flex-col bg-black/90 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={current.caption || 'Photo'}>
      <div className="flex h-16 items-center justify-between gap-3 px-4 text-white">
        <p className="min-w-0 truncate font-display text-[17px] font-semibold">{current.caption}</p>
        <div className="flex items-center gap-3">
          <span className="text-[13px] tabular-nums text-white/60">{index + 1} / {items.length}</span>
          <button ref={closeBtn} type="button" onClick={onClose} aria-label="Close" className={roundBtn}><X size={20} /></button>
        </div>
      </div>
      <div className="relative flex min-h-0 flex-1 items-center justify-center px-3 pb-6 sm:px-16" onClick={onClose}>
        <img ref={image} src={current.src} alt={current.caption} onClick={(e) => e.stopPropagation()} className="max-h-full max-w-full rounded-xl object-contain shadow-premium-2xl" />
        {items.length > 1 && (
          <>
            <button type="button" onClick={(e) => { e.stopPropagation(); onStep(-1); }} aria-label="Previous" className={`${roundBtn} absolute left-2 sm:left-4`}><ChevronLeft size={24} /></button>
            <button type="button" onClick={(e) => { e.stopPropagation(); onStep(1); }} aria-label="Next" className={`${roundBtn} absolute right-2 sm:right-4`}><ChevronRight size={24} /></button>
          </>
        )}
      </div>
    </div>
  );
};

export default Lightbox;
