import { ArrowRight, CheckCircle2, Heart } from 'lucide-react';
import { Button } from '../../../components/ui';
import { APP_FEATURES } from '../lib/content';
import LandingSection from './LandingSection';
import Mandala from './Mandala';
import PhonePreview from './PhonePreview';
import SectionHeading from './SectionHeading';

const AppSection = ({ onLoginClick }) => (
  <LandingSection id="seva" tone="dark" className="bg-ink">
    <Mandala className="pointer-events-none absolute -right-40 top-0 w-[640px] max-w-none text-marigold/10" />
    <div className="pointer-events-none absolute -bottom-40 -left-32 h-96 w-96 rounded-full bg-saffron/15 blur-3xl" aria-hidden="true" />

    <div className="relative grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
      <div>
        <span data-reveal className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-marigold">
          <Heart size={26} aria-hidden="true" />
        </span>
        <SectionHeading
          dark
          eyebrow="The FOLK app"
          title="Your whole membership,"
          accent="in one place."
          body="Bookings, your digital ID, stay requests and your sadhana record. No group chats to scroll, no forms to chase. Built for the club, by the club."
        />
        <ul className="mt-9 grid gap-3.5 sm:grid-cols-2">
          {APP_FEATURES.map((f) => (
            <li key={f.title} data-reveal className="rounded-2xl border border-white/10 bg-white/[0.06] p-5 transition-colors duration-300 hover:border-marigold/50 hover:bg-white/10">
              <p className="flex items-center gap-2.5 text-[15px] font-bold text-white">
                <CheckCircle2 size={18} className="shrink-0 text-marigold" aria-hidden="true" /> {f.title}
              </p>
              <p className="mt-2 text-[14px] leading-6 text-white/65">{f.body}</p>
            </li>
          ))}
        </ul>
        <Button data-reveal size="lg" onClick={onLoginClick} className="mt-9 w-full sm:w-auto">
          Open the app <ArrowRight size={18} aria-hidden="true" />
        </Button>
      </div>

      <div data-reveal><PhonePreview /></div>
    </div>
  </LandingSection>
);

export default AppSection;
