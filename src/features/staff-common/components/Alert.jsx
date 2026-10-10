import React from 'react'
import { AlertCircle, CheckCircle2, X } from 'lucide-react'
import { cn } from '../../../lib/utils'

const TONES = {
  error: { box: 'border-red-100 bg-red-50 text-red-700', Icon: AlertCircle, role: 'alert' },
  success: { box: 'border-emerald-100 bg-emerald-50 text-emerald-800', Icon: CheckCircle2, role: 'status' },
}

/** Inline feedback banner with an optional dismiss button. */
const Alert = ({ tone = 'error', onDismiss, children, className }) => {
  const { box, Icon, role } = TONES[tone]
  return (
    <div role={role} className={cn('flex items-start gap-3 rounded-xl border px-4 py-3 text-[14px] font-medium', box, className)}>
      <Icon size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
      <p className="min-w-0 flex-1 user-text">{children}</p>
      {onDismiss && (
        <button type="button" onClick={onDismiss} aria-label="Dismiss" className="-mr-1 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full opacity-70 hover:opacity-100">
          <X size={16} />
        </button>
      )}
    </div>
  )
}

export default Alert
