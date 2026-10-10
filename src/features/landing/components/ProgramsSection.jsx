import { ChevronRight } from 'lucide-react';
import { Badge, Card } from '../../../components/ui';
import { PROGRAMS } from '../lib/content';
import LandingSection from './LandingSection';
import SectionHeading from './SectionHeading';
import SectionLink from './SectionLink';

const ProgramCard = ({ title, meta, description, Icon }) => (
  <Card data-reveal hover className="group relative overflow-hidden p-7 sm:p-8">
    <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-saffron to-marigold opacity-0 transition-opacity duration-300 group-hover:opacity-100" aria-hidden="true" />
    <div className="flex items-start justify-between gap-4">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-saffron-50 text-saffron-dark transition-colors duration-300 group-hover:bg-saffron group-hover:text-white">
        <Icon size={24} aria-hidden="true" />
      </span>
      <Badge tone="gold" className="uppercase tracking-label">{meta}</Badge>
    </div>
    <Card.Title className="mt-6 text-[20px]">{title}</Card.Title>
    <p className="mt-3 text-[15px] leading-[1.7] text-ink-muted">{description}</p>
    <p className="mt-6 flex items-center gap-1.5 text-[13px] font-bold uppercase tracking-label text-ink-muted transition-colors group-hover:text-saffron-dark">
      Explore program <ChevronRight size={15} className="transition-transform group-hover:translate-x-1" aria-hidden="true" />
    </p>
  </Card>
);

const ProgramsSection = () => (
  <LandingSection id="programs">
    <SectionHeading
      eyebrow="Programs & Activities"
      title="Everything FOLK Vizag"
      accent="runs through the year."
      body="Six tracks, one calendar. Members move freely between them. Most people start with a session or a festival and end up in all six."
      action={<SectionLink href="/contact">Talk to a coordinator</SectionLink>}
    />
    <div className="mt-12 grid gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
      {PROGRAMS.map((p) => <ProgramCard key={p.title} {...p} />)}
    </div>
  </LandingSection>
);

export default ProgramsSection;
