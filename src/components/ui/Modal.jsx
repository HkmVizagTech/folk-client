import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

/**
 * Accessible dialog: bottom sheet on phones, centred panel on larger screens.
 * Closes on Escape and backdrop click; locks page scroll while open.
 */
const Modal = ({ open, onClose, title, children, footer, size = 'md' }) => {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    // Move focus into the dialog for keyboard and screen-reader users.
    const t = setTimeout(() => panelRef.current?.querySelector('input,select,textarea,button')?.focus(), 30);
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev; clearTimeout(t); };
  }, [open, onClose]);

  if (!open) return null;
  const width = size === 'lg' ? 'sm:max-w-2xl' : size === 'sm' ? 'sm:max-w-sm' : 'sm:max-w-lg';

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center sm:p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-ink/60" onClick={onClose} />
      <div ref={panelRef} className={`relative w-full ${width} bg-white rounded-t-2xl sm:rounded-xl max-h-[92vh] flex flex-col`}>
        <div className="shrink-0 h-14 px-5 flex items-center justify-between border-b border-line">
          <h2 className="font-display font-bold text-[17px] truncate">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="w-10 h-10 -mr-2 inline-flex items-center justify-center rounded-md hover:bg-paper"><X size={20} /></button>
        </div>
        <div className="overflow-y-auto px-5 py-5">{children}</div>
        {footer && <div className="shrink-0 px-5 py-4 border-t border-line flex gap-3 justify-end" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>{footer}</div>}
      </div>
    </div>
  );
};

export const Field = ({ label, hint, children }) => (
  <label className="block">
    <span className="block mb-1.5 text-[14px] font-semibold text-ink">{label}</span>
    {children}
    {hint && <span className="block mt-1 text-[13px] text-ink-muted">{hint}</span>}
  </label>
);

export const inputClass = 'w-full h-11 px-3 rounded-md border border-line bg-white text-[16px] text-ink placeholder:text-ink-muted/70 outline-none focus:border-navy focus:ring-2 focus:ring-navy/15';
export const textareaClass = 'w-full min-h-[96px] px-3 py-2.5 rounded-md border border-line bg-white text-[16px] text-ink placeholder:text-ink-muted/70 outline-none focus:border-navy focus:ring-2 focus:ring-navy/15';

export default Modal;
