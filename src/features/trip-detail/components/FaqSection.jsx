import { ChevronDown, HelpCircle } from 'lucide-react'
import DetailSection from './DetailSection'

/** Native <details>: accessible and keyboard-friendly with no state to manage. */
const FaqSection = ({ items }) => (
  <DetailSection id="faq" icon={HelpCircle} kicker="Good to know" title="Questions, answered">
    <div className="divide-y divide-line/80 rounded-2xl border border-line/80">
      {items.map((item) => (
        <details key={item.q} className="group px-4 sm:px-5">
          <summary className="flex min-h-[52px] cursor-pointer list-none items-center justify-between gap-3 py-3 text-[16px] font-semibold text-ink marker:hidden [&::-webkit-details-marker]:hidden">
            <span className="user-text min-w-0">{item.q}</span>
            <ChevronDown size={18} className="shrink-0 text-ink-muted transition-transform duration-200 group-open:rotate-180" />
          </summary>
          <p className="user-text pb-4 text-[15px] leading-relaxed text-ink-muted">{item.a}</p>
        </details>
      ))}
    </div>
  </DetailSection>
)

export default FaqSection
