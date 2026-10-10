import { ArrowRight, ChevronRight, Home } from 'lucide-react';
import { Button, Card } from '../../../components/ui';
import { STAY_INFO } from '../lib/content';
import LandingSection from './LandingSection';
import SectionHeading from './SectionHeading';

const InfoCard = ({ title, description, Icon }) => (
  <Card data-reveal hover className="group p-6">
    <div className="flex items-start justify-between gap-3">
      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-saffron-50 text-saffron-dark transition-colors duration-300 group-hover:bg-saffron group-hover:text-white">
        <Icon size={21} aria-hidden="true" />
      </span>
      <ChevronRight size={18} className="text-ink-muted/40 transition-colors group-hover:text-saffron" aria-hidden="true" />
    </div>
    <Card.Title className="mt-5 text-[18px]">{title}</Card.Title>
    <p className="mt-2 text-[15px] leading-[1.65] text-ink-muted">{description}</p>
  </Card>
);

const StaySection = ({ onLoginClick }) => (
  <LandingSection id="residency" tone="white">
    <SectionHeading
      eyebrow="Accommodation"
      title="Stay close to"
      accent="the practice."
      body="Visiting for a festival, a camp or a weekend of seva? Members can request a temple stay in a couple of taps and track the approval in the app."
    />

    <div className="mt-12 grid gap-5 sm:gap-6 lg:grid-cols-5">
      <div data-reveal className="relative flex min-h-[420px] flex-col justify-end overflow-hidden rounded-3xl shadow-premium-2xl lg:col-span-2">
        <img src="/hero.png" alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover object-[72%_60%]" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-900 via-navy-900/70 to-navy-900/20" aria-hidden="true" />
        <div className="relative p-7 sm:p-9">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-marigold backdrop-blur-sm">
            <Home size={26} aria-hidden="true" />
          </span>
          <p className="mt-6 text-[12px] font-bold uppercase tracking-[0.16em] text-marigold-light">Temple stay</p>
          <h3 className="mt-2 font-display text-[28px] font-semibold leading-[1.15] text-white sm:text-[34px]">
            A simple room, <span className="text-marigold">a full morning program.</span>
          </h3>
          <p className="mt-4 max-w-md text-[15px] leading-7 text-white/75">
            Check rooms, facilities and availability, then send your request. Approvals come straight back to your phone.
          </p>
          <Button size="lg" onClick={onLoginClick} className="mt-7 w-full sm:w-fit">
            Request accommodation <ArrowRight size={17} aria-hidden="true" />
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:col-span-3">
        {STAY_INFO.map((item) => <InfoCard key={item.title} {...item} />)}
      </div>
    </div>
  </LandingSection>
);

export default StaySection;
