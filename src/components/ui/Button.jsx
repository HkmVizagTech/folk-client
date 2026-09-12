import React from 'react'
import { motion } from 'framer-motion'
import { cn } from './Card'

const Button = ({ children, className, variant = 'primary', ...props }) => {
  const variants = {
    primary: "bg-gradient-to-r from-saffron to-gold text-white shadow-md hover:shadow-lg shadow-saffron/20 hover:shadow-saffron/40 ring-1 ring-white/20",
    secondary: "bg-white/50 text-saffron-dark border border-saffron/20 hover:bg-saffron/5",
    ghost: "text-gray-500 hover:text-saffron hover:bg-saffron/5",
  }

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "font-semibold py-2 px-6 rounded-xl transition-all duration-300",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </motion.button>
  )
}

export default Button
