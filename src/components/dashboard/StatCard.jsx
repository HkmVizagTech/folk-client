import React from 'react'
import Card from '../ui/Card'

const StatCard = ({ label, value, sub, color = 'saffron', onClick }) => {
  return (
    <Card 
      className={`border-b-4 ${onClick ? 'cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1' : ''}`}
      style={{ borderBottomColor: `var(--${color})`, borderColor: `var(--${color})` }}
      onClick={onClick}
    >
      <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest">{label}</p>
      <h3 className="text-2xl font-black mt-2 font-poppins text-gray-800">{value}</h3>
      <p className="text-[10px] text-gray-400 mt-1 font-bold italic">{sub}</p>
    </Card>
  )
}

export default StatCard
