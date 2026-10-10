import React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'
import { cn } from '../../lib/utils'

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold transition-all duration-200 select-none disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron focus-visible:ring-offset-2',
  {
    variants: {
      variant: {
        primary: 'bg-saffron text-white shadow-sm hover:bg-saffron-dark hover:shadow-md',
        dark: 'bg-navy text-white shadow-sm hover:bg-navy-800',
        secondary: 'bg-white text-ink border border-line hover:bg-paper hover:border-marigold/60',
        outline: 'border-2 border-navy text-navy hover:bg-navy hover:text-white',
        soft: 'bg-saffron-50 text-saffron-dark hover:bg-saffron-100',
        ghost: 'text-ink-muted hover:text-ink hover:bg-paper',
        danger: 'bg-red-600 text-white hover:bg-red-700',
        link: 'text-saffron-dark underline-offset-4 hover:underline rounded-md px-0 min-h-0',
      },
      size: {
        sm: 'min-h-[36px] px-4 text-[13px]',
        md: 'min-h-[44px] px-5 text-[15px]',
        lg: 'min-h-[52px] px-7 text-[16px]',
        icon: 'h-10 w-10 p-0',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
)

// No default `type`: inside a <form> a Button submits, which several forms rely on.
const Button = React.forwardRef(({ className, variant, size, asChild, loading, disabled, children, ...props }, ref) => {
  const Comp = asChild ? Slot : 'button'
  return (
    <Comp ref={ref} className={cn(buttonVariants({ variant, size }), className)} disabled={disabled || loading} {...props}>
      {asChild ? children : (<>{loading && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}{children}</>)}
    </Comp>
  )
})
Button.displayName = 'Button'

export default Button
