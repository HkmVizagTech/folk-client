import { ArrowUpRight, Sparkles, Ticket } from 'lucide-react'
import { Button } from '../../../components/ui'
import { whatsappLink } from '../../../content/site'

const CustomYatraCta = () => (
  <section data-reveal className="relative isolate mt-12 overflow-hidden rounded-3xl bg-gradient-to-br from-navy-900 via-navy-800 to-navy text-white shadow-premium-xl sm:mt-16">
    <div className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-saffron/25 blur-3xl" aria-hidden="true" />
    <div className="yatra-mandala pointer-events-none absolute inset-0 opacity-10 mix-blend-soft-light" aria-hidden="true" />
    <div className="relative z-10 flex flex-col justify-between gap-6 p-6 sm:flex-row sm:items-center sm:p-10">
      <div className="flex min-w-0 items-start gap-4 sm:items-center">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-saffron text-white shadow-lg"><Sparkles size={24} /></span>
        <div className="min-w-0">
          <p className="kicker !text-marigold-light">Travel together</p>
          <h3 className="mt-1.5 font-display text-[22px] font-semibold leading-tight sm:text-[26px]">Group rates &amp; custom yatras</h3>
          <p className="mt-2 max-w-md text-[15px] leading-relaxed text-white/70">
            Families, colleges and offices: we plan the route, stay and prasadam for you.
          </p>
        </div>
      </div>
      <Button asChild variant="secondary" size="lg" className="shrink-0">
        <a href={whatsappLink('Hare Krishna! We would like to plan a yatra for our group.')} target="_blank" rel="noopener noreferrer">
          <Ticket size={17} /> Plan with us <ArrowUpRight size={16} />
        </a>
      </Button>
    </div>
  </section>
)

export default CustomYatraCta
