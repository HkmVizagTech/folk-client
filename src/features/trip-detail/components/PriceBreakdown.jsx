import { inr } from '../../trips/lib/format'

const Row = ({ label, value, strong }) => (
  <div className="flex items-center justify-between gap-3 text-[15px]">
    <span className="min-w-0 text-ink-muted">{label}</span>
    <span className={strong ? 'shrink-0 font-semibold text-saffron-dark' : 'shrink-0 font-semibold text-ink'}>{value}</span>
  </div>
)

const PriceBreakdown = ({ pricing, modes }) => {
  const { price, seats, total, advance, payNow, balance } = pricing
  const totalLabel = modes.noPaymentAvailable ? 'Total' : modes.effectiveMethod === 'cash' ? 'Payable at the office' : 'Payable now'
  return (
    <div className="user-text-box space-y-2.5 rounded-2xl border border-line/80 bg-paper p-4 sm:p-5">
      <Row label={`${inr(price)} × ${seats} traveller${seats === 1 ? '' : 's'}`} value={inr(total)} />
      {advance > 0 ? (
        <>
          <Row label={`Advance now (${inr(advance)} / person)`} value={inr(payNow)} strong />
          <div className="border-t border-line pt-2.5"><Row label="Balance before departure" value={inr(balance)} /></div>
        </>
      ) : (
        <div className="border-t border-line pt-2.5"><Row label={totalLabel} value={inr(total)} strong /></div>
      )}
    </div>
  )
}

export default PriceBreakdown
