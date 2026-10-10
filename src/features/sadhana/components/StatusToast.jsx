import React from 'react'
import { CheckCircle2 } from 'lucide-react'

const StatusToast = ({ show, children }) => show ? (
  <div role="status" className="fixed bottom-24 left-1/2 z-[150] flex -translate-x-1/2 animate-pop-in items-center gap-2.5 rounded-full bg-ink px-5 py-3 text-[14px] font-semibold text-white shadow-premium-2xl lg:bottom-10">
    <CheckCircle2 size={18} className="text-emerald-400" aria-hidden="true" /> {children}
  </div>
) : null

export default StatusToast
