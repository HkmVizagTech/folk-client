import React from 'react'
import { Banknote, CreditCard } from 'lucide-react'
import { Field, Input, Select } from '../../../../components/ui/Field'
import Switch from '../../../../components/ui/Switch'
import { TRIP_STATUSES } from '../../lib/constants'
import { capitalize } from '../../lib/format'
import Alert from '../Alert'
import { FieldGroup, InfoNote } from '../FormBits'
import RailToggle from './RailToggle'
import { useEditor } from './EditorContext'

const NumberInput = ({ value, onChange, placeholder }) => (
  <Input type="number" min={0} step="1" inputMode="numeric" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
)

const PricingSection = () => {
  const { form, setField, errors, showErrors } = useEditor()
  const err = (k) => (showErrors ? errors[k] : '')
  const noRails = !form.onlinePaymentEnabled && !form.cashPaymentEnabled

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Start date" error={err('startDate')}>
          <Input type="date" value={form.startDate} onChange={(e) => setField('startDate', e.target.value)} />
        </Field>
        <Field label="End date" error={err('endDate')}>
          <Input type="date" value={form.endDate} min={form.startDate || undefined} onChange={(e) => setField('endDate', e.target.value)} />
        </Field>
      </div>

      <Field label="Duration label" hint="Shown on the card">
        <Input value={form.durationLabel} onChange={(e) => setField('durationLabel', e.target.value)} placeholder="6 Days / 5 Nights" />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Price (₹ per person)" error={err('price')}>
          <NumberInput value={form.price} onChange={(v) => setField('price', v)} placeholder="7500" />
        </Field>
        <Field label="Actual cost (₹)" hint="Shown struck through">
          <NumberInput value={form.originalPrice} onChange={(v) => setField('originalPrice', v)} placeholder="1300" />
        </Field>
        <Field label="Advance (₹)" hint="0 = full payment only" error={err('advanceAmount')}>
          <NumberInput value={form.advanceAmount} onChange={(v) => setField('advanceAmount', v)} placeholder="2000" />
        </Field>
        <Field label="Capacity (seats)" error={err('capacity')}>
          <NumberInput value={form.capacity} onChange={(v) => setField('capacity', v)} placeholder="45" />
        </Field>
        <Field label="Who can come" hint="Everyone unless the yatra is separate">
          <Select value={form.eligibility} onChange={(e) => setField('eligibility', e.target.value)}>
            <option value="">Everyone</option>
            <option value="Boys only">Boys only</option>
            <option value="Girls only">Girls only</option>
          </Select>
        </Field>
        <Field label="Status">
          <Select value={form.status} onChange={(e) => setField('status', e.target.value)}>
            {TRIP_STATUSES.map((s) => <option key={s} value={s}>{capitalize(s)}</option>)}
          </Select>
        </Field>
      </div>

      <FieldGroup label="Registrations">
        <div className="flex min-h-[44px] items-center justify-between gap-3 rounded-xl border border-line bg-white px-4">
          <span className="text-[15px] font-semibold text-ink">{form.registrationOpen ? 'Open' : 'Closed'}</span>
          <Switch
            checked={form.registrationOpen}
            onCheckedChange={(v) => setField('registrationOpen', v)}
            aria-label={form.registrationOpen ? 'Close registrations' : 'Open registrations'}
          />
        </div>
      </FieldGroup>

      <FieldGroup label="How devotees pay" hint="At least one, normally">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <RailToggle
            on={form.onlinePaymentEnabled}
            onToggle={() => setField('onlinePaymentEnabled', !form.onlinePaymentEnabled)}
            icon={CreditCard}
            title="Online payment"
            onCopy="Devotees pay by UPI, card or netbanking through Razorpay. The seat is marked paid automatically once the payment is verified."
            offCopy="The Razorpay checkout is hidden. Devotees cannot pay online for this trip."
          />
          <RailToggle
            on={form.cashPaymentEnabled}
            onToggle={() => setField('cashPaymentEnabled', !form.cashPaymentEnabled)}
            icon={Banknote}
            title="Cash at the office"
            onCopy="Devotees may choose to pay cash at the temple office. A staff member records the money in Registrations once it is handed over."
            offCopy="Cash is not offered. Devotees will not see a pay-at-office option."
          />
        </div>
        {noRails && (
          form.registrationOpen ? (
            <Alert tone="warning" title="Both payment methods are off while registrations are open" className="mt-3">
              Devotees can still book a seat, but the app cannot collect any money for it — every registration will arrive as{' '}
              <strong>Unpaid</strong> and has to be settled offline. That suits a free or invitation-only yatra; if it was not
              deliberate, switch one of the two back on.
            </Alert>
          ) : (
            <Alert tone="muted" className="mt-3">
              Both payment methods are off. Registrations are closed too, so nothing is broken — turn one on before you open
              registrations if you intend to collect money through the app.
            </Alert>
          )
        )}
      </FieldGroup>

      <InfoNote>
        A trip only appears to devotees once its status is <strong className="text-saffron-dark">upcoming</strong> (or later);{' '}
        <strong className="text-saffron-dark">draft</strong> keeps it staff-only. Registrations can be closed independently of
        the status — useful once the bus fills up.
      </InfoNote>
    </>
  )
}

export default PricingSection
