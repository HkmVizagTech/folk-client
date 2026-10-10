import React from 'react'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import { cn } from '../../../lib/utils'

const AuthAlert = ({ error, message }) => {
  const text = error || message
  if (!text) return null
  return (
    <div
      role={error ? 'alert' : 'status'}
      className={cn(
        'mb-5 flex items-start gap-2.5 rounded-xl border px-4 py-3 text-[14px] leading-snug',
        error ? 'border-red-200 bg-red-50 text-red-700' : 'border-green-200 bg-green-50 text-green-700',
      )}
    >
      {error ? <AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden="true" /> : <CheckCircle2 size={16} className="mt-0.5 shrink-0" aria-hidden="true" />}
      <span>{text}</span>
    </div>
  )
}

export default AuthAlert
