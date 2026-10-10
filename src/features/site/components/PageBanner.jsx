import { ChevronRight } from 'lucide-react';
import SiteLink from '../../../components/site/SiteLink';
import Mandala from '../../landing/components/Mandala';

/** Compact devotional banner that opens every inner public page. */
const PageBanner = ({ kicker, title, description }) => (
  <section className="hero-devotional relative isolate overflow-hidden text-white">
    <Mandala className="pointer-events-none absolute -right-40 -top-48 -z-10 w-[620px] max-w-none text-marigold/20" />
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[13px] font-semibold text-white/65">
        <SiteLink href="/" className="hover:text-white">Home</SiteLink>
        <ChevronRight size={14} aria-hidden="true" />
        <span className="text-marigold-light">{title}</span>
      </nav>
      <p className="kicker mt-6 text-marigold">{kicker}</p>
      <h1 className="mt-3 max-w-3xl font-display text-[clamp(2.2rem,5vw,3.75rem)] font-semibold leading-[1.08]">{title}</h1>
      {description && <p className="mt-5 max-w-2xl text-[16px] leading-relaxed text-white/75 sm:text-[18px]">{description}</p>}
    </div>
  </section>
);

export default PageBanner;
