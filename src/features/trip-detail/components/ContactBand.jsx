import { MessageCircle, Phone } from 'lucide-react'
import { Button } from '../../../components/ui'
import { telHref } from '../lib/content'

const ContactBand = ({ contactPhone, waHref }) => (
  <section data-reveal className="relative isolate overflow-hidden rounded-3xl bg-gradient-to-br from-navy-900 via-navy-800 to-navy text-white shadow-premium-xl">
    <div className="pointer-events-none absolute -left-10 -top-16 h-64 w-64 rounded-full bg-saffron/25 blur-3xl" aria-hidden="true" />
    <div className="relative z-10 flex flex-col justify-between gap-6 p-6 sm:flex-row sm:items-center sm:p-10">
      <div className="min-w-0">
        <h3 className="font-display text-[22px] font-semibold sm:text-[26px]">Questions before you book?</h3>
        <p className="user-text mt-2 max-w-md text-[15px] leading-relaxed text-white/70">
          The yatra team can help with travel, rooms, dietary needs and group bookings.{contactPhone ? ` Call or WhatsApp ${contactPhone}.` : ''}
        </p>
      </div>
      <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
        {waHref && (
          <Button asChild size="lg"><a href={waHref} target="_blank" rel="noopener noreferrer"><MessageCircle size={17} /> WhatsApp us</a></Button>
        )}
        {contactPhone && (
          <Button asChild variant="secondary" size="lg"><a href={telHref(contactPhone)}><Phone size={17} /> Call</a></Button>
        )}
      </div>
    </div>
  </section>
)

export default ContactBand
