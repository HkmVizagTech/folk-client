import { AlertTriangle, Building2, Info, XCircle } from 'lucide-react'
import { cn } from '../../../lib/utils'
import { inr } from '../../trips/lib/format'
import { isOnlineEnabled } from '../lib/pricing'

const Notice = ({ icon: Icon, className, iconClass, children, ...p }) => (
  <div className={cn('user-text-box flex items-start gap-3 rounded-2xl border p-4', className)} {...p}>
    <Icon size={18} className={cn('mt-0.5 shrink-0', iconClass)} />
    <p className="user-text text-[14px] leading-relaxed">{children}</p>
  </div>
)

/** Says exactly what happens next, before the devotee commits. */
const PaymentNotices = ({ trip, pricing, modes, razorpayReady, formError }) => {
  const { total, payNow } = pricing
  return (
    <>
      {modes.effectiveMethod === 'cash' && !modes.noPaymentAvailable && (
        <Notice icon={Building2} className="border-emerald-200 bg-emerald-50 text-emerald-900" iconClass="text-emerald-600">
          <span className="font-semibold">Paying in cash.</span> Your seat is held as <b>pending</b> the moment you register.
          Hand {inr(payNow)} to the yatra team at the FOLK office; they confirm the seat once the cash is received.
          {trip.contactPhone ? ` Call ${trip.contactPhone} if you need directions.` : ''}
        </Notice>
      )}

      {modes.noPaymentAvailable && (
        <Notice
          icon={total > 0 ? AlertTriangle : Info}
          className={total > 0 ? 'border-amber-200 bg-amber-50 text-amber-900' : 'border-line bg-paper text-ink-soft'}
          iconClass={total > 0 ? 'text-amber-600' : 'text-saffron'}
        >
          {total === 0
            ? 'There is nothing to pay for this yatra. '
            : isOnlineEnabled(trip) && !razorpayReady
              ? 'Online payment isn’t switched on for this site yet. '
              : 'No payment method is open for this yatra right now. '}
          Your registration is saved as <b>pending</b> and the yatra team will confirm your seat{total > 0 ? ' and arrange payment with you directly' : ''}.
          {trip.contactPhone ? ` Call or WhatsApp ${trip.contactPhone}.` : ''}
        </Notice>
      )}

      {formError && <Notice icon={XCircle} role="alert" className="border-red-200 bg-red-50 text-red-700" iconClass="text-red-500">{formError}</Notice>}
    </>
  )
}

export default PaymentNotices
