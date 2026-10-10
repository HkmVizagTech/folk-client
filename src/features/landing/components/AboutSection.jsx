import { ArrowRight, ChevronRight, Flame } from 'lucide-react';
import { Button } from '../../../components/ui';
import LandingSection from './LandingSection';
import SectionHeading from './SectionHeading';

const AboutSection = ({ onLoginClick }) => (
  <LandingSection id="about">
    <div className="pointer-events-none absolute -right-40 -top-40 h-[28rem] w-[28rem] rounded-full bg-marigold/15 blur-3xl" aria-hidden="true" />
    <div className="relative grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
      <div className="lg:col-span-7">
        <SectionHeading
          eyebrow="About HKMV Folk"
          title="A youth club built around"
          accent="practice, not attendance."
          body="FOLK Vizag is where students and young professionals across Visakhapatnam come to build something steadier than a weekend routine. We run weekly sessions, monthly workshops, city-wide seva and yatras through the year, and behind all of it sits a simple idea: spiritual life holds up when it is practised together."
        />
        <p data-reveal className="mt-4 max-w-2xl text-[16px] leading-relaxed text-ink-muted sm:text-[17px]">
          Nobody is asked to arrive already convinced. Come to one kirtan, sit through one Gita
          session, serve one shift, and decide from there.
        </p>
        <div data-reveal className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button size="lg" variant="dark" onClick={onLoginClick} className="w-full sm:w-auto">
            Become a member <ArrowRight size={17} aria-hidden="true" />
          </Button>
          <Button asChild size="lg" variant="secondary" className="w-full sm:w-auto">
            <a href="#programs">Browse programs <ChevronRight size={17} aria-hidden="true" /></a>
          </Button>
        </div>
      </div>

      <div data-reveal className="lg:col-span-5">
        <div className="relative mx-auto max-w-md pb-10 lg:max-w-none">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] shadow-premium-2xl ring-1 ring-marigold/40">
            <img
              data-parallax
              src="/hero.png"
              alt="A temple glowing at sunset beside a lotus pond"
              loading="lazy"
              width="640"
              height="640"
              className="absolute inset-x-0 -top-[10%] h-[120%] w-full object-cover object-[75%_60%]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-navy-900/85 via-navy-900/10 to-transparent" aria-hidden="true" />
            <div className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-8">
              <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-marigold-light">Since 2016 · Visakhapatnam</p>
              <p className="mt-2 font-display text-[24px] font-semibold leading-tight sm:text-[28px]">
                One temple. One city.<br />A few thousand friendships.
              </p>
            </div>
          </div>

          <div className="absolute -bottom-0 left-5 right-5 flex items-center gap-4 rounded-2xl border border-line bg-white p-4 shadow-premium-xl sm:left-8 sm:right-auto sm:pr-8">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-saffron-50 text-saffron-dark">
              <Flame size={22} aria-hidden="true" />
            </span>
            <span className="leading-tight">
              <span className="block text-[12px] font-bold uppercase tracking-label text-ink-muted">Daily Sadhana</span>
              <span className="block text-[16px] font-bold text-ink">15,000+ streaks logged</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  </LandingSection>
);

export default AboutSection;
