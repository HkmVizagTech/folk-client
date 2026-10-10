import React from 'react'
import { cva } from 'class-variance-authority'
import { cn } from '../../lib/utils'

const badgeVariants = cva('inline-flex items-center gap-1.5 rounded-full font-semibold whitespace-nowrap', {
  variants: {
    tone: {
      neutral: 'bg-paper-dark text-ink-soft',
      saffron: 'bg-saffron-50 text-saffron-dark',
      maroon: 'bg-navy-50 text-navy',
      gold: 'bg-marigold-light/40 text-marigold-dark',
      success: 'bg-emerald-50 text-emerald-700',
      warning: 'bg-amber-50 text-amber-700',
      danger: 'bg-red-50 text-red-700',
    },
    size: { sm: 'h-6 px-2.5 text-[11px]', md: 'h-7 px-3 text-[12px]' },
  },
  defaultVariants: { tone: 'neutral', size: 'md' },
})

const Badge = ({ className, tone, size, dot, children, ...props }) => (
  <span className={cn(badgeVariants({ tone, size }), className)} {...props}>
    {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />}
    {children}
  </span>
)

export default Badge
