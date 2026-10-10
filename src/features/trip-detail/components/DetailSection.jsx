import { Card } from '../../../components/ui'
import { cn } from '../../../lib/utils'

/** Kicker + serif title (+ optional description), shared by every detail section. */
export const SectionHeading = ({ icon: Icon, kicker, title, description, className }) => (
  <div className={cn('user-text-box mb-5 sm:mb-6', className)}>
    <p className="kicker flex items-center gap-2">{Icon && <Icon size={14} className="shrink-0" />} {kicker}</p>
    <h2 className="mt-2 font-display text-[24px] font-semibold leading-tight text-ink sm:text-[28px]">{title}</h2>
    {description && <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-ink-muted">{description}</p>}
  </div>
)

/** A revealed card section with a heading. Pass `bare` to render the heading without a card. */
const DetailSection = ({ id, bare = false, className, children, ...heading }) => (
  <section id={id} data-reveal className="user-text-box scroll-mt-24">
    {bare ? (
      <>
        <SectionHeading {...heading} />
        {children}
      </>
    ) : (
      <Card className={cn('p-5 sm:p-8', className)}>
        <SectionHeading {...heading} />
        {children}
      </Card>
    )}
  </section>
)

export default DetailSection
