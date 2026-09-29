import React from 'react'
import { cn } from './Card'

const variants = {
  primary: 'bg-saffron text-white hover:bg-saffron-dark',
  dark: 'bg-ink text-white hover:bg-navy',
  secondary: 'bg-white text-ink border border-line hover:bg-paper',
  ghost: 'text-ink-muted hover:text-ink hover:bg-paper',
  danger: 'bg-red-600 text-white hover:bg-red-700',
}

// No default `type`, same as before: inside a <form> a Button submits, which
// several existing forms rely on.
const Button = ({ children, className, variant = 'primary', ...props }) => (
  <button
    className={cn(
      'inline-flex items-center justify-center gap-2 min-h-[44px] px-5 rounded-md font-display text-[13px] font-bold uppercase tracking-label transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
      variants[variant] || variants.primary,
      className
    )}
    {...props}
  >
    {children}
  </button>
)

export default Button
