import { ArrowUpRight } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { GALLERY_TILES } from '../lib/content';
import LandingSection from './LandingSection';
import SectionHeading from './SectionHeading';
import SectionLink from './SectionLink';

const Tile = ({ title, caption, Icon, image, position, span, tone }) => (
  <a
    data-reveal
    href="/gallery"
    className={cn('group relative flex min-h-[220px] overflow-hidden rounded-3xl shadow-card transition-shadow duration-300 hover:shadow-premium-2xl lg:min-h-[240px]', span)}
  >
    <div className={cn('absolute inset-0 bg-gradient-to-br transition-transform duration-700 group-hover:scale-[1.06]', tone)}>
      {image
        ? <img src={image} alt="" loading="lazy" className="h-full w-full object-cover" style={{ objectPosition: position }} />
        : <Icon size={46} strokeWidth={1.3} className="absolute right-6 top-6 text-white/30" aria-hidden="true" />}
    </div>
    <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/25 to-transparent" aria-hidden="true" />
    <div className="relative mt-auto flex w-full items-end justify-between gap-4 p-5 sm:p-6">
      <div className="min-w-0">
        <h3 className="font-display text-[20px] font-semibold text-white sm:text-[24px]">{title}</h3>
        <p className="mt-1 text-[13px] leading-5 text-white/75">{caption}</p>
      </div>
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/25 bg-white/15 text-white backdrop-blur-sm transition-colors group-hover:border-saffron group-hover:bg-saffron">
        <ArrowUpRight size={18} aria-hidden="true" />
      </span>
    </div>
  </a>
);

const GallerySection = () => (
  <LandingSection id="gallery">
    <SectionHeading
      eyebrow="Gallery"
      title="Moments that bring"
      accent="the club together."
      body="Festivals, youth sessions, seva shifts and the long road trips in between: a look at what an ordinary year at FOLK Vizag looks like."
      action={<SectionLink href="/gallery">View gallery</SectionLink>}
    />
    <div className="mt-12 grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
      {GALLERY_TILES.map((t) => <Tile key={t.title} {...t} />)}
    </div>
  </LandingSection>
);

export default GallerySection;
