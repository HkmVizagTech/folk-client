import { ArrowUpRight } from 'lucide-react';
import { Card } from '../../../components/ui';
import { PILLARS } from '../lib/content';
import LandingSection from './LandingSection';
import SectionHeading from './SectionHeading';

const PillarCard = ({ index, title, body, Icon, onAction }) => (
  <Card data-reveal hover padded={false} className="group flex flex-col overflow-hidden rounded-3xl">
    <div className="relative h-24 bg-gradient-to-br from-navy-700 via-navy-600 to-saffron-dark">
      <span className="absolute right-5 top-3 font-display text-[44px] font-bold leading-none text-white/25">0{index + 1}</span>
    </div>
    <div className="-mt-8 flex flex-1 flex-col px-6 pb-6 sm:px-7">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-line bg-white text-saffron-dark shadow-premium-xl transition-colors duration-300 group-hover:bg-saffron group-hover:text-white">
        <Icon size={24} aria-hidden="true" />
      </span>
      <Card.Title className="mt-5 text-[20px]">{title}</Card.Title>
      <p className="mt-3 flex-1 text-[15px] leading-[1.7] text-ink-muted">{body}</p>
      <button
        type="button"
        onClick={onAction}
        className="mt-5 inline-flex min-h-[44px] items-center gap-2 border-t border-line pt-4 text-[13px] font-bold uppercase tracking-label text-ink-muted transition-colors group-hover:text-saffron-dark"
      >
        Get started <ArrowUpRight size={15} aria-hidden="true" />
      </button>
    </div>
  </Card>
);

const PillarsSection = ({ onLoginClick }) => (
  <LandingSection tone="white">
    <SectionHeading
      eyebrow="What we actually do"
      title="Four pillars the club is"
      accent="built on."
      body="Guidance, daily practice, service and the calendar. Each one holds the others up, which is why we do not run them separately."
    />
    <div className="mt-12 grid gap-5 sm:grid-cols-2 sm:gap-6 xl:grid-cols-4">
      {PILLARS.map((p, i) => <PillarCard key={p.title} index={i} {...p} onAction={onLoginClick} />)}
    </div>
  </LandingSection>
);

export default PillarsSection;
