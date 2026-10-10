import { ArrowRight, ChevronRight, Flame, Sparkles } from 'lucide-react';
import { Button } from '../../../components/ui';
import { useHeroTimeline } from '../hooks/useLandingMotion';
import { HERO_CHIPS } from '../lib/content';
import HeroStats from './HeroStats';
import Mandala from './Mandala';

const FloatingCard = ({ className, Icon, label, value }) => (
  <div data-hero="float" className={`absolute flex items-center gap-3 rounded-2xl bg-white p-3 pr-4 shadow-premium-2xl ${className}`}>
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-saffron-50 text-saffron-dark">
      <Icon size={20} aria-hidden="true" />
    </span>
    <span className="leading-tight">
      <span className="block text-[11px] font-bold uppercase tracking-label text-ink-muted">{label}</span>
      <span className="block text-[14px] font-bold text-ink">{value}</span>
    </span>
  </div>
);

const Hero = ({ onLoginClick }) => {
  const ref = useHeroTimeline();
  return (
    <section ref={ref} className="hero-devotional relative isolate overflow-hidden text-white">
      <Mandala data-hero="mandala" className="pointer-events-none absolute -right-48 -top-40 -z-10 w-[720px] max-w-none text-marigold/25" />
      <div className="pointer-events-none absolute -bottom-40 -left-32 -z-10 h-96 w-96 rounded-full bg-saffron/20 blur-3xl" aria-hidden="true" />

      <div className="mx-auto max-w-7xl px-4 pb-12 pt-12 sm:px-6 sm:pt-16 lg:px-8 lg:pb-16 lg:pt-20">
        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-7">
            <p data-hero="kicker" className="inline-flex items-center gap-2.5 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[12px] font-bold uppercase tracking-[0.16em] text-white/90 backdrop-blur-sm">
              <span className="h-2 w-2 rounded-full bg-marigold shadow-[0_0_12px_3px] shadow-marigold/60" aria-hidden="true" />
              HKMV Folk · Visakhapatnam
            </p>

            <h1 className="mt-6 font-display text-[clamp(2.75rem,8vw,5.75rem)] font-bold leading-[1.02] tracking-tight">
              <span className="block overflow-hidden pb-1">
                <span data-hero="line" className="block text-transparent [-webkit-text-stroke:1.5px_rgba(255,255,255,0.9)] md:[-webkit-text-stroke:2px_rgba(255,255,255,0.9)]">Connect.</span>
              </span>
              <span className="block overflow-hidden pb-1"><span data-hero="line" className="block">Participate.</span></span>
              <span className="block overflow-hidden pb-2"><span data-hero="line" className="block text-marigold">Serve.</span></span>
            </h1>

            <p data-hero="copy" className="mt-6 max-w-xl text-[16px] leading-relaxed text-white/75 sm:text-[18px]">
              The youth club of the Hare Krishna Movement, Visakhapatnam. Spiritual sessions,
              workshops, seva, yatras and a circle of people your own age who actually show up,
              all in one place.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button data-hero="cta" size="lg" onClick={onLoginClick} className="w-full sm:w-auto">
                Join HKMV Folk <ArrowRight size={18} aria-hidden="true" />
              </Button>
              <Button
                data-hero="cta"
                asChild
                size="lg"
                variant="ghost"
                className="w-full border border-white/30 text-white hover:bg-white hover:text-ink sm:w-auto"
              >
                <a href="#events">See what is on <ChevronRight size={18} aria-hidden="true" /></a>
              </Button>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div data-hero="art" className="relative mx-auto w-[min(78vw,340px)] lg:w-full lg:max-w-[400px]">
              <div className="absolute -inset-3 rounded-t-[999px] rounded-b-[2rem] border border-marigold/40" aria-hidden="true" />
              <div className="relative aspect-[4/5] overflow-hidden rounded-t-[999px] rounded-b-3xl bg-navy-800 shadow-premium-2xl ring-2 ring-marigold/60">
                <img src="/krishna_toy.png" alt="Baby Krishna among lamps and lotuses" width="640" height="640" className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-navy-900/50 via-transparent to-transparent" aria-hidden="true" />
              </div>
              <FloatingCard className="-left-3 bottom-10 sm:-left-8" Icon={Flame} label="Daily sadhana" value="15,000+ streaks" />
              <FloatingCard className="-right-2 top-12 sm:-right-6" Icon={Sparkles} label="Since 2016" value="One temple, one city" />
            </div>
          </div>
        </div>

        <div className="mt-14 lg:mt-16">
          <HeroStats />
          <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
            {HERO_CHIPS.map(({ label, Icon }) => (
              <li key={label} className="flex items-center gap-2 text-[13px] font-semibold text-white/75">
                <Icon size={15} className="text-marigold" aria-hidden="true" /> {label}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="h-px bg-gradient-to-r from-transparent via-marigold to-transparent" aria-hidden="true" />
    </section>
  );
};

export default Hero;
