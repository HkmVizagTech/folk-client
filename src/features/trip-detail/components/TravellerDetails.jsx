import { AlertTriangle, Check, IdCard } from 'lucide-react'
import { Button, Field, Input } from '../../../components/ui'
import { cn } from '../../../lib/utils'
import { useTravellerDetails } from '../hooks/useTravellerDetails'
import TravellerRow from './TravellerRow'

/**
 * Who is travelling, filled in after the seat is booked so nobody abandons a
 * long form half-way. ID details are typed, never photographed: the file store
 * serves uploads at a public link, which is no place for an Aadhaar card.
 */
const TravellerDetails = ({ registration, tripTitle }) => {
  const t = useTravellerDetails(registration)

  return (
    <section className={cn('rounded-2xl border p-5 sm:p-6', t.done ? 'border-emerald-200 bg-emerald-50/40' : 'border-saffron/30 bg-saffron-50/50')}>
      <div className="flex items-start gap-3">
        <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', t.done ? 'bg-emerald-100 text-emerald-700' : 'bg-saffron text-white')}>
          {t.done ? <Check size={20} /> : <IdCard size={20} />}
        </span>
        <div className="min-w-0">
          <h3 className="font-display text-[18px] font-semibold text-ink">{t.done ? 'Travel details received' : 'Travel details (optional)'}</h3>
          <p className="mt-0.5 text-[14px] text-ink-muted">
            {t.done
              ? 'Thank you. The team has what it needs to book your tickets. You can still correct anything below.'
              : `Your seat for ${tripTitle || 'the yatra'} is held. These are optional: they just help the team book tickets and know who is coming. Fill in what you can.`}
          </p>
        </div>
      </div>

      <form onSubmit={t.save} className="mt-5 space-y-5">
        {t.rows.map((row, i) => <TravellerRow key={i} index={i} row={row} onChange={t.setRow} />)}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Emergency contact"><Input value={t.emergency} onChange={(e) => t.setEmergency(e.target.value)} placeholder="Name & number of someone at home" /></Field>
          <Field label="Boarding point (optional)"><Input value={t.pickup} onChange={(e) => t.setPickup(e.target.value)} placeholder="e.g. RTC Complex" /></Field>
        </div>

        <p className="text-[13px] leading-relaxed text-ink-muted">
          Only the FOLK team can see these, and they are used for your travel tickets. Leave anything blank if you would rather not say, and please type the ID number rather than sending a photo of the card.
        </p>

        {t.error && (
          <p role="alert" className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-[14px] text-red-700"><AlertTriangle size={16} className="shrink-0" /> {t.error}</p>
        )}

        <Button type="submit" loading={t.saving} className="w-full sm:w-auto">
          {!t.saving && <Check size={16} />}
          {t.saving ? 'Saving…' : t.saved ? 'Saved' : t.done ? 'Update details' : 'Save details'}
        </Button>
      </form>
    </section>
  )
}

export default TravellerDetails
