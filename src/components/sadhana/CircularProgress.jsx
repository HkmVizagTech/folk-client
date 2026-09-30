import React from 'react'
import { motion } from 'framer-motion'

const CircularProgress = ({ current, total, label }) => {
  const percentage = Math.min(current / total, 1)
  const radius = 80
  const circumference = 2 * Math.PI * radius

  return (
    <div className="relative flex items-center justify-center p-2" style={{ width: 220, height: 220 }}>
      <svg className="w-full h-full -rotate-90" viewBox="0 0 220 220">
        <circle 
          cx="110" cy="110" r={radius} 
          stroke="currentColor" strokeWidth="12" fill="transparent" 
          className="text-saffron/10" 
        />
        <motion.circle 
          cx="110" cy="110" r={radius} 
          stroke="currentColor" strokeWidth="12" fill="transparent" 
          strokeDashoffset={circumference}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference * (1 - percentage) }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          strokeLinecap="round"
          className="text-saffron" 
        />
      </svg>
      {label && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold text-saffron-dark leading-none">{Math.round(percentage * 100)}%</span>
          <span className="text-[10px] font-bold text-ink-muted uppercase tracking-label mt-2">{label}</span>
        </div>
      )}
    </div>


  )
}

export default CircularProgress
