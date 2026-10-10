import { Banknote, Clock3, CreditCard } from 'lucide-react'
import { Button, Field, Input, Modal } from '../../../components/ui'
import { inr } from '../../trips/lib/format'
import SeatStepper from './SeatStepper'
import PaymentMethodPicker from './PaymentMethodPicker'
import PriceBreakdown from './PriceBreakdown'
import PaymentNotices from './PaymentNotices'

const SUBMIT = {
  cash: { icon: Banknote, label: () => 'Register & pay cash' },
  later: { icon: Clock3, label: () => 'Send my request' },
  pay: { icon: CreditCard, label: (payNow) => `Pay ${inr(payNow)} now` },
}

const footnote = (modes) => {
  if (modes.noPaymentAvailable) return 'Your seat stays pending until the yatra team confirms it.'
  if (modes.effectiveMethod === 'cash') return 'Your seat stays pending until the team receives the cash. It is recorded by them, never by this page.'
  return 'The next screen is the payment page: UPI, card or net-banking. Your seat is confirmed the moment it clears, and we ask for travel details after that.'
}

const BookingModal = ({
  open, onClose, trip, form, onField, onAdjustSeats, seatsLeft, pricing, modes, razorpayReady,
  payMethod, onPayMethod, submitting, formError, onSubmit,
}) => {
  const { submitMode, noPaymentAvailable, bothAvailable } = modes
  const Submit = SUBMIT[submitMode]
  const SubmitIcon = Submit.icon

  return (
    <Modal
      open={open}
      onClose={() => !submitting && onClose()}
      title={noPaymentAvailable ? 'Request a seat' : 'Book your seat'}
      description={trip.title}
      footer={(
        <div className="w-full space-y-3">
          <Button type="submit" form="booking-form" size="lg" className="w-full" loading={!!submitting}>
            {!submitting && <SubmitIcon size={17} className="shrink-0" />}
            {submitting === 'pay' ? 'Opening checkout…' : submitting ? 'Reserving…' : Submit.label(pricing.payNow)}
          </Button>
          <p className="text-center text-[13px] leading-relaxed text-ink-muted">{footnote(modes)}</p>
        </div>
      )}
    >
      <form id="booking-form" onSubmit={(e) => { e.preventDefault(); onSubmit(submitMode) }} className="space-y-5">
        <SeatStepper seats={pricing.seats} seatsLeft={seatsLeft} onAdjust={onAdjustSeats} />
        {bothAvailable && <PaymentMethodPicker value={payMethod} onChange={onPayMethod} payNow={pricing.payNow} />}

        <Field label="Your name">
          <Input type="text" required value={form.name} onChange={(e) => onField('name', e.target.value)} placeholder="e.g. Ravi Kumar" autoComplete="name" />
        </Field>
        <Field label="Phone">
          <Input type="tel" required value={form.phone} onChange={(e) => onField('phone', e.target.value)} placeholder="10-digit mobile" autoComplete="tel" inputMode="tel" />
        </Field>

        <PriceBreakdown pricing={pricing} modes={modes} />
        <PaymentNotices trip={trip} pricing={pricing} modes={modes} razorpayReady={razorpayReady} formError={formError} />
      </form>
    </Modal>
  )
}

export default BookingModal
