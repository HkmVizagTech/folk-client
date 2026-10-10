import { AlertTriangle, MessageCircle, Ticket } from 'lucide-react'
import { Button } from '../../../components/ui'
import { inr } from '../../trips/lib/format'
import { bookLabel } from '../lib/pricing'
import { isLive } from '../lib/registration'
import RegistrationSummary from './RegistrationSummary'

const Hint = ({ children }) => <p className="text-center text-[13px] leading-relaxed text-ink-muted">{children}</p>

const openHint = ({ noPaymentAvailable, cashAvailable, bothAvailable }, advance) => {
  if (noPaymentAvailable) return 'Your request goes to the yatra team, who confirm your seat and arrange payment with you.'
  if (advance > 0) return `Pay ${inr(advance)} per person now, the rest before departure.`
  if (bothAvailable) return 'Pay online now, or in cash at the FOLK office.'
  if (cashAvailable) return 'Reserve now and pay in cash at the FOLK office.'
  return 'Pay online, or reserve now and settle with the team.'
}

/** The action area: sign in, manage the existing booking, explain why it is closed, or book. */
const BookingCta = ({ user, registration, blockedReason, modes, advance, onBook, summaryProps, waHref }) => (
  <div className="space-y-3">
    {!user ? (
      <>
        <Button size="lg" className="w-full" onClick={onBook}><Ticket size={17} /> Book with your mobile</Button>
        <Hint>We send a code on WhatsApp: no password, and it takes a moment.</Hint>
      </>
    ) : isLive(registration) ? (
      <RegistrationSummary registration={registration} {...summaryProps} />
    ) : blockedReason ? (
      <div className="user-text-box flex items-start gap-3 rounded-2xl border border-line bg-paper p-4">
        <AlertTriangle size={18} className="mt-0.5 shrink-0 text-ink-muted" />
        <p className="user-text text-[14px] leading-relaxed text-ink-muted">{blockedReason}</p>
      </div>
    ) : (
      <>
        <Button size="lg" className="w-full" onClick={onBook}><Ticket size={17} /> {bookLabel(modes, 'Book & pay online')}</Button>
        <Hint>{openHint(modes, advance)}</Hint>
      </>
    )}

    {waHref && (
      <Button asChild variant="secondary" className="w-full">
        <a href={waHref} target="_blank" rel="noopener noreferrer"><MessageCircle size={16} /> Ask a question</a>
      </Button>
    )}
  </div>
)

export default BookingCta
