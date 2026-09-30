import React from 'react'
import Card from '../ui/Card'

const StatCard = ({ label, value, sub, color = 'saffron', onClick }) => {
  return (
    <Card
      className={`border-b-4 ${onClick ? 'cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1' : ''}`}
      style={{ borderBottomColor: `var(--${color})`, borderColor: `var(--${color})` }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(e); } } : undefined}
    >
      <p className="text-ink-muted text-[10px] font-bold uppercase tracking-label">{label}</p>
      <h3 className="text-xl sm:text-2xl font-bold mt-2 font-poppins text-ink break-words">{value}</h3>
      <p className="text-[10px] text-ink-muted mt-1 font-bold">{sub}</p>
    </Card>
  )
}

export default StatCard
