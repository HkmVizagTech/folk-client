import { Quote, Users } from 'lucide-react';
import { Card } from '../../../components/ui';
import { VOICES } from '../lib/content';
import LandingSection from './LandingSection';
import SectionHeading from './SectionHeading';

const Voice = ({ quote, role, detail }) => (
  <Card data-reveal hover className="group relative flex flex-col p-7 sm:p-8">
    <figure className="flex flex-1 flex-col">
      <Quote size={32} className="text-marigold/50 transition-colors group-hover:text-saffron/60" aria-hidden="true" />
      <blockquote className="mt-4 flex-1 font-display text-[16px] italic leading-[1.8] text-ink-soft">{quote}</blockquote>
      <figcaption className="mt-7 flex items-center gap-3 border-t border-line pt-5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-saffron to-marigold text-white">
          <Users size={18} aria-hidden="true" />
        </span>
        <span className="min-w-0 leading-tight">
          <span className="block text-[15px] font-bold text-ink">{role}</span>
          <span className="block text-[13px] text-ink-muted">{detail}</span>
        </span>
      </figcaption>
    </figure>
  </Card>
);

const VoicesSection = () => (
  <LandingSection id="testimonials" tone="white">
    <SectionHeading
      align="center"
      eyebrow="Community voices"
      title="Why members"
      accent="keep coming back."
      body="Reflections from people in the club. We are collecting more as the circle grows."
    />
    <div className="mt-12 grid gap-5 sm:gap-6 md:grid-cols-3">
      {VOICES.map((v) => <Voice key={v.role} {...v} />)}
    </div>
  </LandingSection>
);

export default VoicesSection;
