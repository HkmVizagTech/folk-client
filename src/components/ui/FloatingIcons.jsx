import React from 'react'
import { motion } from 'framer-motion'

const FloatingIcons = () => {
  const icons = ['🪷', '🪈', '☸️', '🍃']
  
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ 
            x: Math.random() * window.innerWidth, 
            y: window.innerHeight + 100,
            opacity: 0.1,
            rotate: 0 
          }}
          animate={{ 
            y: -100,
            rotate: 360,
            opacity: [0.1, 0.2, 0.1]
          }}
          transition={{ 
            duration: 20 + Math.random() * 20, 
            repeat: Infinity, 
            ease: "linear",
            delay: i * 5
          }}
          className="absolute text-4xl grayscale brightness-150 opacity-10"
        >
          {icons[i % icons.length]}
        </motion.div>
      ))}
    </div>
  )
}

export default FloatingIcons
