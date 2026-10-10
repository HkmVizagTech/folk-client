import { Banknote, Check, CreditCard } from 'lucide-react'
import { cn } from '../../../lib/utils'
import { inr } from '../../trips/lib/format'

/** Only a real choice gets a chooser: shown when both online and cash are on offer. */
const PaymentMethodPicker = ({ value, onChange, payNow }) => {
  const options = [
    { id: 'online', icon: CreditCard, title: 'Pay online now', body: `${inr(payNow)} by UPI, card or netbanking. Your seat is marked paid as soon as our server confirms it.` },
    { id: 'cash', icon: Banknote, title: 'Pay cash at the office', body: `Reserve now and hand over ${inr(payNow)} at the FOLK office. Staff confirm the seat when they receive it.` },
  ]
  return (
    <fieldset>
      <legend className="mb-2 text-[14px] font-semibold text-ink">How would you like to pay?</legend>
      <div className="grid grid-cols-1 gap-3 xs:grid-cols-2">
        {options.map(({ id, icon: Icon, title, body }) => {
          const active = value === id
          return (
            <button
              key={id} type="button" onClick={() => onChange(id)} aria-pressed={active}
              className={cn('min-h-[44px] min-w-0 rounded-2xl border-2 p-4 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron',
                active ? 'border-saffron bg-saffron-50 shadow-md' : 'border-line bg-white hover:border-marigold/60')}
            >
              <span className="flex items-center gap-2.5">
                <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', active ? 'bg-saffron text-white' : 'bg-paper text-saffron-dark')}><Icon size={18} /></span>
                <span className="user-text min-w-0 text-[14px] font-semibold leading-tight text-ink">{title}</span>
                {active && <Check size={16} className="ml-auto shrink-0 text-saffron" />}
              </span>
              <span className="user-text mt-2 block text-[13px] leading-snug text-ink-muted">{body}</span>
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}

export default PaymentMethodPicker
