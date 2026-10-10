import { Ban, Banknote, CheckCircle2, Clock3, CreditCard, Phone, ShieldCheck, Users, X } from 'lucide-react'
import { Button } from '../../../components/ui'
import { cn } from '../../../lib/utils'
import { inr, plural } from '../../trips/lib/format'
import { statusOf } from '../lib/registration'
import { telHref } from '../lib/content'
import TravellerDetails from './TravellerDetails'

const REG_STATUS = {
  pending: { label: 'Pending confirmation', cls: 'border-saffron/30 bg-saffron-50 text-saffron-dark', icon: Clock3 },
  confirmed: { label: 'Confirmed', cls: 'border-emerald-200 bg-emerald-50 text-emerald-700', icon: CheckCircle2 },
  waitlisted: { label: 'Waitlisted', cls: 'border-navy/20 bg-navy-50 text-navy', icon: Users },
  cancelled: { label: 'Cancelled', cls: 'border-line bg-paper-dark text-ink-muted', icon: Ban },
}

const StatusCard = ({ registration }) => {
  const meta = REG_STATUS[statusOf(registration)] || REG_STATUS.pending
  const Icon = meta.icon
  return (
    <div className={cn('user-text-box rounded-2xl border p-4', meta.cls)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-[14px] font-semibold"><Icon size={16} className="shrink-0" /> {meta.label}</span>
        <span className="shrink-0 text-[13px] font-semibold opacity-80">{plural(parseInt(registration.seats, 10) || 1, 'seat')}</span>
      </div>
      <p className="user-text mt-2 text-[14px] opacity-80">{inr(registration.amountDue)} due · registered under {registration.userName || 'you'}</p>
    </div>
  )
}

/** Payment truth: online = a verified `payments` doc; cash = `cashCollected`, written by staff only. */
const PaymentCard = ({ registration, payment, isPaid, isCashRegistration, isCashCollected, isSettled, onlineAvailable, contactPhone }) => {
  const tone = isSettled ? 'green' : isCashRegistration ? 'emerald' : 'amber'
  const styles = {
    green: { box: 'border-emerald-200 bg-emerald-50', chip: 'bg-emerald-600', text: 'text-emerald-800' },
    emerald: { box: 'border-emerald-200 bg-emerald-50/70', chip: 'bg-emerald-500', text: 'text-emerald-800' },
    amber: { box: 'border-amber-200 bg-amber-50', chip: 'bg-amber-500', text: 'text-amber-800' },
  }[tone]
  const Icon = isSettled ? ShieldCheck : isCashRegistration ? Banknote : Clock3

  const title = isCashRegistration ? (isCashCollected ? 'Cash received' : 'Cash: pending collection') : (isPaid ? 'Payment received' : 'Payment pending')
  const body = isCashRegistration
    ? (isCashCollected
      ? 'The yatra team has recorded your cash payment.'
      : `Pay ${inr(registration.amountDue)} at the FOLK office. Staff confirm your seat once the cash is received.`)
    : (isPaid
      ? `${inr(payment.amount)} confirmed by our server.`
      : registration.paymentOrderId
        ? 'We have not seen a confirmed payment for this booking yet.'
        : onlineAvailable
          ? 'No online payment started. Staff will collect it, or you can pay online.'
          : 'The yatra team will confirm your seat and arrange payment with you.')

  return (
    <div className={cn('user-text-box flex items-start gap-3 rounded-2xl border p-4', styles.box)}>
      <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white', styles.chip)}><Icon size={18} /></span>
      <div className="min-w-0">
        <p className={cn('user-text text-[15px] font-semibold', styles.text)}>{title}</p>
        <p className="user-text mt-0.5 text-[14px] leading-snug text-ink-muted">{body}</p>
        {isCashRegistration && !isCashCollected && contactPhone && (
          <a href={telHref(contactPhone)} className={cn('mt-2 inline-flex min-h-[44px] items-center gap-1.5 text-[14px] font-semibold hover:underline', styles.text)}>
            <Phone size={14} className="shrink-0" /> {contactPhone}
          </a>
        )}
      </div>
    </div>
  )
}

/** The signed-in devotee's booking: status, payment, travel details and the actions that apply. */
const RegistrationSummary = ({
  registration, trip, payment, isPaid, isCashRegistration, isCashCollected, isSettled, onlineAvailable, price, blockedReason,
  payingExisting, onPayExisting, onBookMore, cancelling, onCancel,
}) => {
  const pending = statusOf(registration) === 'pending'
  return (
    <div className="space-y-3">
      <StatusCard registration={registration} />
      <PaymentCard
        registration={registration} payment={payment} isPaid={isPaid} isCashRegistration={isCashRegistration}
        isCashCollected={isCashCollected} isSettled={isSettled} onlineAvailable={onlineAvailable} contactPhone={trip.contactPhone}
      />
      <TravellerDetails registration={registration} tripTitle={trip.title} />

      {pending && (
        <>
          {!isSettled && !isCashRegistration && onlineAvailable && (
            <Button size="lg" className="w-full" onClick={onPayExisting} loading={payingExisting}>
              {!payingExisting && <CreditCard size={17} />}
              {payingExisting ? 'Opening payment…' : `Pay ${inr(price * (parseInt(registration.seats, 10) || 1))} now`}
            </Button>
          )}
          {!isSettled && price > 0 && !blockedReason && (
            <Button variant="dark" size="lg" className="w-full" onClick={onBookMore}><CreditCard size={17} /> Book more seats</Button>
          )}
          <Button variant="ghost" className="w-full text-red-600 hover:bg-red-50 hover:text-red-700" onClick={onCancel} loading={cancelling}>
            {!cancelling && <X size={16} />}
            {cancelling ? 'Cancelling…' : 'Cancel registration'}
          </Button>
        </>
      )}

      {registration.staffNotes && (
        <p className="user-text rounded-xl bg-paper p-3 text-[14px] italic leading-relaxed text-ink-muted">&ldquo;{registration.staffNotes}&rdquo;</p>
      )}
    </div>
  )
}

export default RegistrationSummary
