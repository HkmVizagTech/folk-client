import { ArrowRight, CheckCircle2, ChevronRight, Sparkles } from 'lucide-react';
import { Button } from '../../../components/ui';
import { JOIN_PERKS } from '../lib/content';
import LandingSection from './LandingSection';
import Mandala from './Mandala';
import SiteLink from '../../../components/site/SiteLink';

const JoinCta = ({ onLoginClick }) => (
  <LandingSection id="join" containerClassName="max-w-6xl">
    <div data-reveal className="hero-devotional relative overflow-hidden rounded-[2rem] px-6 py-14 text-center shadow-premium-2xl sm:px-14 sm:py-16 lg:rounded-[2.5rem] lg:py-24">
      <Mandala className="pointer-events-none absolute left-1/2 top-1/2 w-[760px] max-w-none -translate-x-1/2 -translate-y-1/2 text-marigold/20" />
      <div className="relative">
        <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl border border-white/20 bg-white/10 text-marigold backdrop-blur-sm">
          <Sparkles size={32} aria-hidden="true" />
        </span>
        <p className="kicker mt-8 text-marigold">Be part of the community</p>
        <h2 className="mt-4 font-display text-[clamp(2.25rem,6vw,4.5rem)] font-bold leading-[1.02] tracking-tight text-white">
          <span className="block text-transparent [-webkit-text-stroke:1.5px_rgba(255,255,255,0.9)] md:[-webkit-text-stroke:2px_rgba(255,255,255,0.9)]">Connect.</span>
          <span className="block text-marigold">Participate.</span>
          <span className="block">Serve.</span>
        </h2>
        <p className="mx-auto mt-6 max-w-2xl text-[16px] leading-relaxed text-white/75 sm:text-[18px]">
          Create your membership in a minute. Book your first event, log your first round and meet the rest of the Vizag circle.
        </p>
        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          <Button size="lg" onClick={onLoginClick} className="w-full sm:w-auto">
            Join HKMV Folk <ArrowRight size={18} aria-hidden="true" />
          </Button>
          <Button asChild size="lg" variant="ghost" className="w-full border border-white/30 text-white hover:bg-white hover:text-ink sm:w-auto">
            <SiteLink href="/events">Explore events <ChevronRight size={18} aria-hidden="true" /></SiteLink>
          </Button>
        </div>
        <ul className="mt-12 flex flex-wrap justify-center gap-x-7 gap-y-3 border-t border-white/15 pt-8">
          {JOIN_PERKS.map((p) => (
            <li key={p} className="flex items-center gap-2 text-[14px] font-semibold text-white/70">
              <CheckCircle2 size={16} className="text-marigold" aria-hidden="true" /> {p}
            </li>
          ))}
        </ul>
      </div>
    </div>
  </LandingSection>
);

export default JoinCta;
