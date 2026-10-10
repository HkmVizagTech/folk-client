import { ArrowRight, CalendarDays, MapPin } from 'lucide-react';
import { Badge, Button } from '../../../components/ui';
import { useCountdown } from '../hooks/useCountdown';

const Unit = ({ value, label }) => (
  <div className="min-w-[56px] text-center sm:min-w-[68px]">
    <div className="font-display text-[26px] font-bold leading-none tabular-nums text-white sm:text-[32px]">
      {String(value).padStart(2, '0')}
    </div>
    <div className="mt-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-white/55">{label}</div>
  </div>
);

const Countdown = ({ target }) => {
  const c = useCountdown(target);
  if (!c || c.done) return null;
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/[0.06] px-5 py-4 backdrop-blur-sm sm:gap-5 sm:px-7" role="timer" aria-label="Time left">
      <Unit value={c.days} label="Days" />
      <Unit value={c.hours} label="Hours" />
      <Unit value={c.minutes} label="Mins" />
      <Unit value={c.seconds} label="Secs" />
    </div>
  );
};

/** What the current poster is, how long is left, and where to go next. */
const PosterInfo = ({ slide, onLoginClick }) => (
  <div className="flex flex-col items-center gap-6 text-center">
    <div>
      <Badge className="border border-marigold/30 bg-saffron/15 uppercase tracking-label text-marigold">{slide.kind}</Badge>
      <h3 className="user-text mt-3 font-display text-[24px] font-bold leading-tight text-white sm:text-[32px]">{slide.title}</h3>
      <p className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-[15px] text-white/70">
        {slide.whenText && <span className="inline-flex items-center gap-1.5"><CalendarDays size={16} aria-hidden="true" /> {slide.whenText}</span>}
        {slide.place && <span className="user-text inline-flex items-center gap-1.5"><MapPin size={16} aria-hidden="true" /> {slide.place}</span>}
      </p>
    </div>

    <Countdown target={slide.when} />

    <div className="flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row">
      {slide.href && (
        <Button asChild size="lg">
          <a href={slide.href}>
            See this {slide.kind.toLowerCase() === 'yatra' ? 'yatra' : 'program'} <ArrowRight size={17} aria-hidden="true" />
          </a>
        </Button>
      )}
      <Button size="lg" variant="ghost" onClick={onLoginClick} className="border border-white/30 text-white hover:bg-white hover:text-ink">
        Join FOLK
      </Button>
    </div>
  </div>
);

export default PosterInfo;
