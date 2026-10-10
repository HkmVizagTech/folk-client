import { Ticket } from 'lucide-react'
import { Button } from '../../../components/ui'
import { inr } from '../../trips/lib/format'
import { bookLabel } from '../lib/pricing'

/** Sticky mobile CTA, public view only: the app shell already owns the bottom edge with its nav. */
const MobileBookBar = ({ user, pricing, modes, onBook }) => {
  const { price, hasOffer, originalPrice } = pricing
  return (
    <>
      <div className="h-28 lg:hidden" aria-hidden="true" />
      <div
        className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 border-t border-line bg-white/95 px-4 pt-3 backdrop-blur-xl sm:gap-4 lg:hidden"
        style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
      >
        <div className="min-w-0 shrink">
          <p className="truncate font-display text-[20px] font-semibold leading-none text-ink">
            {price > 0 ? inr(price) : 'By seva'}
            {hasOffer && <span className="ml-1.5 text-[13px] font-normal text-ink-muted line-through">{inr(originalPrice)}</span>}
          </p>
          <p className="mt-1 truncate text-[12px] text-ink-muted">{price > 0 ? 'per person' : 'No fixed fee'}</p>
        </div>
        <Button size="lg" className="min-w-0 flex-1 px-3" onClick={onBook}>
          <Ticket size={17} className="shrink-0" />
          <span className="truncate">{!user ? 'Sign in to register' : bookLabel(modes, 'Book & pay')}</span>
        </Button>
      </div>
    </>
  )
}

export default MobileBookBar
