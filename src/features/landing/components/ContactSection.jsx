import { ArrowRight, Mail, MapPin, Phone } from 'lucide-react';
import { Button } from '../../../components/ui';
import { JOIN_STEPS } from '../lib/content';
import LandingSection from './LandingSection';
import Mandala from './Mandala';
import SectionHeading from './SectionHeading';

const CONTACT_CARDS = [
  { Icon: MapPin, title: 'Visit us', body: 'Hare Krishna Movement, Visakhapatnam, Andhra Pradesh. Youth sessions run at the temple through the week.' },
  { Icon: Phone, title: 'Youth desk', body: 'Reach a FOLK coordinator for programs, seva slots or a stay request. Sign in and your message routes straight to the team.' },
  { Icon: Mail, title: 'Stay in the loop', body: 'Members get event announcements, yatra dates and booking links before they go public.' },
];

const ContactCard = ({ Icon, title, body }) => (
  <li data-reveal className="flex items-start gap-4 rounded-2xl border border-line bg-paper p-5 shadow-soft">
    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-saffron-dark shadow-soft">
      <Icon size={22} aria-hidden="true" />
    </span>
    <div>
      <h3 className="font-display text-[17px] font-semibold text-ink">{title}</h3>
      <p className="mt-1 text-[15px] leading-6 text-ink-muted">{body}</p>
    </div>
  </li>
);

const StepsPanel = ({ onLoginClick }) => (
  <div data-reveal className="relative overflow-hidden rounded-3xl bg-navy-900 p-7 shadow-premium-2xl sm:p-10">
    <Mandala className="pointer-events-none absolute -right-24 -top-24 w-80 text-marigold/15" />
    <div className="relative">
      <p className="kicker text-marigold">Getting started</p>
      <h3 className="mt-3 font-display text-[28px] font-semibold leading-[1.15] text-white sm:text-[34px]">
        Three steps and <span className="text-marigold">you are in.</span>
      </h3>
      <ol className="mt-8 space-y-5">
        {JOIN_STEPS.map((s) => (
          <li key={s.step} className="flex gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 font-display text-[14px] font-bold text-marigold">{s.step}</span>
            <div>
              <p className="text-[16px] font-bold text-white">{s.title}</p>
              <p className="mt-1 text-[14px] leading-6 text-white/65">{s.body}</p>
            </div>
          </li>
        ))}
      </ol>
      <Button size="lg" onClick={onLoginClick} className="mt-9 w-full">
        Create my membership <ArrowRight size={18} aria-hidden="true" />
      </Button>
    </div>
  </div>
);

const ContactSection = ({ onLoginClick }) => (
  <LandingSection id="contact">
    <div className="grid items-start gap-12 lg:grid-cols-12 lg:gap-16">
      <div className="lg:col-span-6">
        <SectionHeading
          eyebrow="Contact"
          title="Come by, or just"
          accent="say hello first."
          body="Questions about programs, events, seva or a temple stay? The FOLK coordinators are the fastest way in. Most people start with a single message and end up at a kirtan that weekend."
        />
        <ul className="mt-10 space-y-4">
          {CONTACT_CARDS.map((c) => <ContactCard key={c.title} {...c} />)}
        </ul>
      </div>
      <div className="lg:col-span-6"><StepsPanel onLoginClick={onLoginClick} /></div>
    </div>
  </LandingSection>
);

export default ContactSection;
