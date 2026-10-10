import { ArrowRight } from 'lucide-react';

/** Quiet text action that sits at the end of a section heading. */
const SectionLink = ({ href, children }) => (
  <a
    href={href}
    className="group inline-flex min-h-[44px] shrink-0 items-center gap-2 text-[15px] font-semibold text-saffron-dark transition-colors hover:text-saffron"
  >
    {children}
    <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" aria-hidden="true" />
  </a>
);

export default SectionLink;
