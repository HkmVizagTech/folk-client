import React from 'react'
import { motion } from 'framer-motion'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

const Card = ({ children, className, hover = true, ...props }) => {
  return (
    <motion.div
      whileHover={hover ? { y: -5 } : {}}
      className={cn(
        "bg-white/70 backdrop-blur-xl border border-white/40 shadow-premium-xl rounded-[2.5rem] p-8",
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  )
}

export default Card
