import { Check, Sparkles } from 'lucide-react'
import DetailSection from './DetailSection'

const HighlightsSection = ({ highlights }) => (
  <DetailSection icon={Sparkles} kicker="Highlights" title="What makes this special">
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {highlights.map((h, i) => (
        <li key={i} className="flex min-w-0 items-start gap-3 rounded-2xl border border-line/80 bg-paper p-4">
          <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-saffron to-marigold text-white"><Check size={15} /></span>
          <p className="user-text min-w-0 text-[15px] font-medium leading-relaxed text-ink-soft">{h}</p>
        </li>
      ))}
    </ul>
  </DetailSection>
)

export default HighlightsSection
