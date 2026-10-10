import { Minus, Plus } from 'lucide-react'
import { MAX_SEATS } from '../lib/pricing'
import { plural } from '../../trips/lib/format'

const StepBtn = (props) => (
  <button type="button" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-line bg-paper text-saffron-dark transition-colors hover:bg-saffron-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron" {...props} />
)

const SeatStepper = ({ seats, seatsLeft, onAdjust }) => (
  <div>
    <p className="mb-1.5 text-[14px] font-semibold text-ink">Travellers</p>
    <div className="flex items-center gap-4">
      <StepBtn aria-label="Decrease number of travellers" onClick={() => onAdjust(-1)}><Minus size={18} /></StepBtn>
      <span className="flex-1 text-center font-display text-[32px] font-semibold text-ink" aria-live="polite">{seats}</span>
      <StepBtn aria-label="Increase number of travellers" onClick={() => onAdjust(1)}><Plus size={18} /></StepBtn>
    </div>
    {seatsLeft !== null && <p className="mt-1.5 text-center text-[13px] text-ink-muted">{plural(seatsLeft, 'seat')} left · up to {MAX_SEATS} per registration</p>}
  </div>
)

export default SeatStepper
