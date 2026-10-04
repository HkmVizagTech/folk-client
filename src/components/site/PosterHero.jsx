import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, CalendarDays, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import { useFirestore } from '../../hooks/useFirestore';
import { toDate, formatDay, formatTime } from '../../lib/dates';

/**
 * The first thing a visitor sees: what FOLK is actually doing next.
 *
 * FOLK makes a poster for every yatra and festival, and those posters say far
 * more than a stock photograph — so they are the hero. The nearest one sits in
 * the middle with its neighbours peeking in, it turns by itself, and a
 * countdown runs to whatever is next. With nothing coming up it falls back to
 * a plain welcome rather than an empty frame.
 */

const ROTATE_MS = 6000;

const useCountdown = (target) => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!target) return undefined;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [target]);
  if (!target) return null;
  const left = Math.max(0, target - now);
  return {
    days: Math.floor(left / 86400000),
    hours: Math.floor((left % 86400000) / 3600000),
    minutes: Math.floor((left % 3600000) / 60000),
    seconds: Math.floor((left % 60000) / 1000),
    done: left === 0,
  };
};

const Unit = ({ value, label }) => (
  <div className="text-center">
    <div className="font-display text-2xl sm:text-3xl font-bold text-white tabular-nums leading-none">
      {String(value).padStart(2, '0')}
    </div>
    <div className="mt-1 font-sans text-[10px] font-bold uppercase tracking-[0.16em] text-white/55">{label}</div>
  </div>
);

const PosterHero = ({ onLoginClick }) => {
  const { data: trips } = useFirestore('trips');
  const { data: events } = useFirestore('events');
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  // Everything coming up that has a poster, nearest first. A yatra and a
  // festival are the same thing here: something to come to.
  const slides = useMemo(() => {
    const soon = Date.now() - 6 * 3600 * 1000;
    const fromTrips = (trips || [])
      .filter((t) => !['cancelled', 'completed', 'draft'].includes(String(t.status || '').toLowerCase()))
      .map((t) => ({
        id: `t_${t.id}`,
        kind: 'Yatra',
        title: t.title,
        image: t.coverImage,
        when: t.startDate ? Date.parse(`${t.startDate}T06:00:00+05:30`) : null,
        whenText: t.startDate ? formatDay(new Date(`${t.startDate}T06:00:00+05:30`)) : 'Dates soon',
        place: t.location,
        href: `/trip/${encodeURIComponent(t.slug || '')}`,
      }));
    const fromEvents = (events || []).map((e) => {
      const d = toDate(e.dateISO || e.date);
      return {
        id: `e_${e.id}`,
        kind: e.category || 'Program',
        title: e.title,
        image: e.img,
        when: d ? d.getTime() : null,
        whenText: d ? `${formatDay(d)}, ${formatTime(d)}` : '',
        place: e.location,
        href: null,
      };
    });
    return [...fromTrips, ...fromEvents]
      .filter((s) => s.image && s.when && s.when >= soon)
      .sort((a, b) => a.when - b.when)
      .slice(0, 6);
  }, [trips, events]);

  useEffect(() => { setIndex(0); }, [slides.length]);

  useEffect(() => {
    if (paused || slides.length < 2) return undefined;
    const t = setInterval(() => setIndex((i) => (i + 1) % slides.length), ROTATE_MS);
    return () => clearInterval(t);
  }, [paused, slides.length]);

  const current = slides[index] || null;
  const countdown = useCountdown(current?.when || null);
  const go = (delta) => setIndex((i) => (i + delta + slides.length) % slides.length);

  return (
    <section className="relative isolate overflow-hidden bg-[#2B1F17]">
      {/* A soft wash of the temple's colours, so the posters sit on warmth
          rather than flat black. */}
      <div
        className="absolute inset-0"
        aria-hidden="true"
        style={{
          background:
            'radial-gradient(90% 70% at 50% -10%, rgba(217,166,58,0.30), transparent 60%),'
            + 'radial-gradient(70% 60% at 10% 110%, rgba(232,115,28,0.28), transparent 60%),'
            + 'linear-gradient(160deg, #3A2418 0%, #2B1F17 45%, #1E1510 100%)',
        }}
      />

      <div className="relative max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 pt-12 sm:pt-16 pb-14 sm:pb-20">
        <div className="text-center max-w-2xl mx-auto">
          <p className="font-sans text-[12px] font-bold uppercase tracking-[0.2em] text-marigold">
            Friends of Lord Krishna · Visakhapatnam
          </p>
          <h1 className="mt-3 font-display font-semibold text-white leading-[1.1]" style={{ fontSize: 'clamp(2rem, 5vw, 3.4rem)' }}>
            {current ? 'Come with us' : 'Connect. Participate. Serve.'}
          </h1>
          <p className="mt-4 text-[16px] sm:text-[17px] leading-relaxed text-white/70">
            The youth club of the Hare Krishna Movement, Visakhapatnam — weekly programs,
            yatras to the holy places, seva and a circle of friends your own age.
          </p>
        </div>

        {slides.length > 0 ? (
          <>
            {/* Posters: the nearest one centre stage, its neighbours peeking. */}
            <div
              className="mt-10 sm:mt-12 relative"
              onMouseEnter={() => setPaused(true)}
              onMouseLeave={() => setPaused(false)}
            >
              <div className="flex items-center justify-center gap-4 sm:gap-6">
                {slides.map((s, i) => {
                  const offset = i - index;
                  const isCurrent = offset === 0;
                  // Only the current poster and its immediate neighbours are
                  // drawn; the rest stay out of the way.
                  if (Math.abs(offset) > 1) return null;
                  const body = (
                    <>
                      <img
                        src={s.image}
                        alt={isCurrent ? `${s.title} poster` : ''}
                        loading={isCurrent ? 'eager' : 'lazy'}
                        className="w-full h-full object-cover"
                      />
                      {!isCurrent && <div className="absolute inset-0 bg-[#1E1510]/55" aria-hidden="true" />}
                    </>
                  );
                  const cls = `relative shrink-0 overflow-hidden rounded-2xl transition-all duration-500 ${
                    isCurrent
                      ? 'w-[min(78vw,640px)] aspect-[16/10] ring-1 ring-marigold/40 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.75)]'
                      : 'hidden lg:block w-[180px] aspect-[16/10] opacity-55'
                  }`;
                  return s.href && isCurrent ? (
                    <a key={s.id} href={s.href} className={cls} aria-label={s.title}>{body}</a>
                  ) : (
                    <div key={s.id} className={cls} aria-hidden={!isCurrent}>{body}</div>
                  );
                })}
              </div>

              {slides.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => go(-1)}
                    aria-label="Previous"
                    className="absolute left-0 sm:left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white inline-flex items-center justify-center backdrop-blur"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    type="button"
                    onClick={() => go(1)}
                    aria-label="Next"
                    className="absolute right-0 sm:right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white inline-flex items-center justify-center backdrop-blur"
                  >
                    <ChevronRight size={20} />
                  </button>
                </>
              )}
            </div>

            {/* What that poster is, and how long is left. */}
            <div className="mt-8 flex flex-col items-center gap-5">
              <div className="text-center">
                <span className="chip bg-saffron/15 text-marigold border border-marigold/30">{current.kind}</span>
                <h2 className="mt-3 font-display text-2xl sm:text-3xl font-bold text-white user-text">{current.title}</h2>
                <p className="mt-2 text-white/65 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-[15px]">
                  {current.whenText && <span className="inline-flex items-center gap-1.5"><CalendarDays size={15} /> {current.whenText}</span>}
                  {current.place && <span className="inline-flex items-center gap-1.5 user-text"><MapPin size={15} /> {current.place}</span>}
                </p>
              </div>

              {countdown && !countdown.done && (
                <div className="flex items-center gap-5 sm:gap-7 rounded-2xl border border-white/12 bg-white/[0.06] px-6 sm:px-8 py-4 backdrop-blur">
                  <Unit value={countdown.days} label="Days" />
                  <Unit value={countdown.hours} label="Hours" />
                  <Unit value={countdown.minutes} label="Mins" />
                  <Unit value={countdown.seconds} label="Secs" />
                </div>
              )}

              <div className="flex flex-wrap items-center justify-center gap-3">
                {current.href && (
                  <a href={current.href} className="btn-primary">
                    See this {current.kind.toLowerCase() === 'yatra' ? 'yatra' : 'program'} <ArrowRight size={17} />
                  </a>
                )}
                <button type="button" onClick={onLoginClick} className="btn-outline-light">Join FOLK</button>
              </div>

              {slides.length > 1 && (
                <div className="flex items-center gap-2" role="tablist" aria-label="Choose a poster">
                  {slides.map((s, i) => (
                    <button
                      key={s.id}
                      type="button"
                      role="tab"
                      aria-selected={i === index}
                      aria-label={s.title}
                      onClick={() => setIndex(i)}
                      className={`h-1.5 rounded-full transition-all ${i === index ? 'w-7 bg-marigold' : 'w-1.5 bg-white/30 hover:bg-white/50'}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <button type="button" onClick={onLoginClick} className="btn-primary">Join FOLK <ArrowRight size={17} /></button>
            <a href="#events" className="btn-outline-light">See what is on</a>
          </div>
        )}
      </div>
    </section>
  );
};

export default PosterHero;
