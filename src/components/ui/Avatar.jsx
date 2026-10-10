import React from 'react'
import { cn, initials } from '../../lib/utils'

const SIZES = { sm: 'h-8 w-8 text-[12px]', md: 'h-10 w-10 text-[14px]', lg: 'h-14 w-14 text-lg', xl: 'h-20 w-20 text-2xl' }

const Avatar = ({ name, src, size = 'md', className }) => {
  const usable = src && !String(src).includes('dicebear')
  return (
    <span className={cn('inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-navy-600 to-navy-800 text-white font-display font-bold ring-2 ring-white', SIZES[size], className)}>
      {usable ? <img src={src} alt="" className="h-full w-full object-cover" /> : initials(name)}
    </span>
  )
}

export default Avatar
