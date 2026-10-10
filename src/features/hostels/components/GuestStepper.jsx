import React from 'react'
import { Minus, Plus } from 'lucide-react'
import { Button } from '../../../components/ui'

const GuestStepper = ({ value, onChange }) => {
  const step = (delta) => onChange(Math.max(1, (parseInt(value, 10) || 1) + delta))
  return (
    <div className="flex items-center gap-3">
      <Button type="button" variant="secondary" size="icon" aria-label="Decrease guest count" onClick={() => step(-1)}><Minus size={18} aria-hidden="true" /></Button>
      <span className="flex-1 text-center font-display text-[22px] font-semibold text-ink" aria-live="polite">{value}</span>
      <Button type="button" variant="secondary" size="icon" aria-label="Increase guest count" onClick={() => step(1)}><Plus size={18} aria-hidden="true" /></Button>
    </div>
  )
}

export default GuestStepper
