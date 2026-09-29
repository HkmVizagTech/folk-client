import React from 'react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

// Plain surface: white, hairline border, no glass/blur and no hover lift.
// `hover` is accepted for older call sites and ignored.
// eslint-disable-next-line no-unused-vars
const Card = ({ children, className, hover, ...props }) => (
  <div className={cn('bg-white border border-line rounded-xl p-5 sm:p-6', className)} {...props}>
    {children}
  </div>
)

export default Card
