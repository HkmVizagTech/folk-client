import React from 'react'
import { CheckCircle2, X } from 'lucide-react'
import { cn } from '../../../lib/utils'

const Toast = ({ toast }) => toast ? (
  <div role="status" className={cn(
    'fixed inset-x-4 top-4 z-[150] flex animate-pop-in items-center gap-3 rounded-2xl px-5 py-3 text-[14px] font-semibold text-white shadow-premium-2xl sm:inset-x-auto sm:right-6 sm:top-6',
    toast.type === 'error' ? 'bg-red-600' : 'bg-emerald-600',
  )}>
    {toast.type === 'error' ? <X size={18} aria-hidden="true" /> : <CheckCircle2 size={18} aria-hidden="true" />}
    {toast.message}
  </div>
) : null

export default Toast
