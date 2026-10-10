import React from 'react'
import { cn } from '../../lib/utils'

export const inputClass =
  'w-full h-11 px-3.5 rounded-xl border border-line bg-white text-[16px] text-ink placeholder:text-ink-muted/60 outline-none transition-shadow focus:border-navy focus:ring-4 focus:ring-navy/10 disabled:bg-paper disabled:text-ink-muted'
export const textareaClass =
  'w-full min-h-[104px] px-3.5 py-2.5 rounded-xl border border-line bg-white text-[16px] text-ink placeholder:text-ink-muted/60 outline-none transition-shadow focus:border-navy focus:ring-4 focus:ring-navy/10'

export const Input = React.forwardRef(({ className, ...p }, ref) => <input ref={ref} className={cn(inputClass, className)} {...p} />)
Input.displayName = 'Input'
export const Textarea = React.forwardRef(({ className, ...p }, ref) => <textarea ref={ref} className={cn(textareaClass, className)} {...p} />)
Textarea.displayName = 'Textarea'
export const Select = React.forwardRef(({ className, children, ...p }, ref) => (
  <select ref={ref} className={cn(inputClass, 'pr-9 appearance-none bg-[length:16px] bg-[right_0.85rem_center] bg-no-repeat', className)}
    style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%236E5E52' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")" }} {...p}>
    {children}
  </select>
))
Select.displayName = 'Select'

export const Field = ({ label, hint, error, children, className }) => (
  <label className={cn('block', className)}>
    <span className="block mb-1.5 text-[14px] font-semibold text-ink">{label}</span>
    {children}
    {error ? <span className="block mt-1 text-[13px] text-red-600">{error}</span>
      : hint && <span className="block mt-1 text-[13px] text-ink-muted">{hint}</span>}
  </label>
)
