import { Check, CheckCircle2, Info, X, XCircle } from 'lucide-react'
import DetailSection from './DetailSection'

const Column = ({ title, icon: Icon, itemIcon: ItemIcon, tone, items, empty, className }) => (
  <div className={`min-w-0 ${className}`}>
    <h3 className={`mb-4 flex items-center gap-2 text-[13px] font-semibold uppercase tracking-label ${tone.heading}`}>
      <Icon size={16} className="shrink-0" /> {title}
    </h3>
    {items.length === 0 ? (
      <p className="text-[15px] italic text-ink-muted">{empty}</p>
    ) : (
      <ul className="space-y-3">
        {items.map((item, i) => (
          <li key={i} className="flex min-w-0 items-start gap-2.5 text-[15px] leading-relaxed text-ink-soft">
            <ItemIcon size={17} className={`mt-0.5 shrink-0 ${tone.item}`} />
            <span className="user-text min-w-0">{item}</span>
          </li>
        ))}
      </ul>
    )}
  </div>
)

const InclusionsSection = ({ inclusions, exclusions }) => (
  <DetailSection icon={Info} kicker="The fine print" title="What's included">
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8">
      <Column
        title="Included" icon={CheckCircle2} itemIcon={Check} tone={{ heading: 'text-emerald-700', item: 'text-emerald-600' }}
        items={inclusions} empty="Details shared on confirmation."
      />
      <Column
        title="Not included" icon={XCircle} itemIcon={X} tone={{ heading: 'text-red-600', item: 'text-red-500' }}
        items={exclusions} empty="Nothing listed."
        className="border-t border-line/80 pt-6 sm:border-l sm:border-t-0 sm:pl-8 sm:pt-0"
      />
    </div>
  </DetailSection>
)

export default InclusionsSection
