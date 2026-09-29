import React, { useMemo } from 'react';
import {
  ArrowRight, CalendarDays, MapPin, Users, Mountain, Compass, Home, HandHeart, BookOpen,
  MessageCircle, Phone, Instagram, Clock,
} from 'lucide-react';
import { useFirestore } from '../hooks/useFirestore';
import { SiteHeader, SiteFooter } from '../components/site/SiteChrome';
import { SITE, PROGRAMS, PHOTOS, whatsappLink } from '../content/site';
import Ornament from '../components/site/Ornament';

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */

const PROGRAM_ICONS = {
  weekly: Users,
  retreats: Mountain,
  yatras: Compass,
  residency: Home,
  seva: HandHeart,
  courses: BookOpen,
};

const eventTime = (e) => {
  const t = e.dateISO ? Date.parse(e.dateISO) : Date.parse(e.date);
  return Number.isFinite(t) ? t : null;
};

const dayParts = (ms) => {
  const d = new Date(ms);
  return {
    day: d.toLocaleDateString('en-IN', { day: '2-digit' }),
    month: d.toLocaleDateString('en-IN', { month: 'short' }).toUpperCase(),
    weekday: d.toLocaleDateString('en-IN', { weekday: 'long' }),
    time: d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }),
  };
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const tripDates = (start, end) => {
  const p = (s) => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s || ''); return m ? { y: +m[1], m: +m[2], d: +m[3] } : null; };
  const s = p(start); const e = p(end);
  if (!s) return 'Dates to be announced';
  if (!e || (s.y === e.y && s.m === e.m && s.d === e.d)) return `${s.d} ${MONTHS[s.m - 1]} ${s.y}`;
  if (s.y === e.y && s.m === e.m) return `${s.d}–${e.d} ${MONTHS[e.m - 1]} ${e.y}`;
  return `${s.d} ${MONTHS[s.m - 1]} – ${e.d} ${MONTHS[e.m - 1]} ${e.y}`;
};

const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

/* ------------------------------------------------------------------ */
/* Building blocks                                                      */
/* ------------------------------------------------------------------ */

const Section = ({ id, className = '', children }) => (
  <section id={id} className={`scroll-mt-28 ${className}`}>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">{children}</div>
  </section>
);

const Heading = ({ kicker, title, body, light = false, center = false }) => (
  <div className={`max-w-3xl ${center ? 'mx-auto text-center' : ''}`}>
    {kicker && <p className={`kicker ${light ? 'text-marigold-light' : ''}`}>{kicker}</p>}
    <h2 className={`display-lg mt-2 ${light ? 'text-white' : 'text-navy'}`}>{title}</h2>
    <Ornament center={center} className="mt-3" />
    {body && (
      <p className={`mt-4 text-[17px] leading-relaxed ${light ? 'text-white/75' : 'text-ink-muted'}`}>{body}</p>
    )}
  </div>
);

/* ------------------------------------------------------------------ */
/* Page                                                                 */
/* ------------------------------------------------------------------ */

const Landing = ({ onLoginClick }) => {
  const { data: events, loading: eventsLoading } = useFirestore('events');
  const { data: trips } = useFirestore('trips');

  const upcoming = useMemo(() => {
    const now = Date.now() - 6 * 60 * 60 * 1000; // keep today's evening program visible
    return (events || [])
      .map((e) => ({ ...e, _t: eventTime(e) }))
      .filter((e) => e._t && e._t >= now)
      .sort((a, b) => a._t - b._t);
  }, [events]);

  const openTrips = useMemo(
    () => (trips || [])
      .filter((t) => !['cancelled', 'completed'].includes(String(t.status || 'upcoming').toLowerCase()))
      .sort((a, b) => String(a.startDate || '9999').localeCompare(String(b.startDate || '9999'))),
    [trips]
  );

  const next = upcoming[0];
  const wa = whatsappLink();

  const handleProgram = (p) => (e) => {
    if (p.login) {
      e.preventDefault();
      onLoginClick && onLoginClick();
    }
  };

  // Only real, live numbers. A figure that isn't known yet is left out.
  const facts = [
    upcoming.length > 0 && { value: upcoming.length, label: upcoming.length === 1 ? 'upcoming program' : 'upcoming programs' },
    openTrips.length > 0 && { value: openTrips.length, label: openTrips.length === 1 ? 'yatra open for booking' : 'yatras open for booking' },
    { value: PROGRAMS.length, label: 'ways to take part' },
  ].filter(Boolean);

  return (
    <div className="min-h-screen bg-paper">
      <SiteHeader onLoginClick={onLoginClick} />

      {/* ============================ HERO ============================ */}
      <section className="relative bg-paper text-ink overflow-hidden">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 lg:py-24 grid gap-12 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-7">
            <p className="kicker">{SITE.fullName} · {SITE.parent}</p>
            <h1 className="display-xl mt-4 text-navy">
              Understand yourself.<br />
              <span className="text-saffron-dark italic">Live with purpose.</span>
            </h1>
            <Ornament className="mt-5" />
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-muted">
              FOLK Vizag is a youth club for students and young professionals: weekly programs,
              retreats, yatras and a residency, guided by the teachings of the Bhagavad-gita.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <button type="button" onClick={onLoginClick} className="btn-primary">
                Join FOLK <ArrowRight size={17} />
              </button>
              <a href="#events" className="btn-outline">See what&apos;s on</a>
            </div>
          </div>

          {PHOTOS.hero && !next && (
            <div className="lg:col-span-5 lg:justify-self-end w-full max-w-md rounded-t-[12rem] overflow-hidden border-[6px] border-white shadow-premium-xl ring-1 ring-marigold/40">
              <img src={PHOTOS.hero} alt="FOLK Vizag program" className="w-full aspect-[4/5] object-cover" />
            </div>
          )}

          {!next && !PHOTOS.hero && (
            <figure className="lg:col-span-5 lg:justify-self-end w-full max-w-md rounded-t-[12rem] bg-white border border-line ring-4 ring-paper-dark px-8 pt-20 pb-10 text-center shadow-premium">
              <Ornament center />
              <blockquote className="mt-5 font-display text-2xl sm:text-[1.65rem] font-medium italic leading-snug text-navy">
                &ldquo;One must deliver himself with the help of his mind, and not degrade himself.&rdquo;
              </blockquote>
              <figcaption className="mt-5 text-sm font-semibold uppercase tracking-label text-saffron-dark">
                Bhagavad-gita 6.5
              </figcaption>
            </figure>
          )}

          {next && (
            <aside className="lg:col-span-5 lg:justify-self-end w-full max-w-md bg-white text-ink rounded-2xl overflow-hidden border border-line shadow-premium-xl">
              <div className="bg-saffron text-white px-5 py-2.5 font-sans text-xs font-bold uppercase tracking-label">
                Next program
              </div>
              <div className="p-5 flex gap-4">
                <div className="shrink-0 w-16 text-center border-r border-line pr-4">
                  <div className="font-display text-3xl font-extrabold leading-none">{dayParts(next._t).day}</div>
                  <div className="mt-1 font-display text-xs font-bold text-saffron">{dayParts(next._t).month}</div>
                </div>
                <div className="min-w-0">
                  <h2 className="font-display text-lg font-bold leading-snug user-text">{next.title}</h2>
                  <p className="mt-1.5 text-[15px] text-ink-muted flex items-center gap-1.5">
                    <Clock size={15} aria-hidden="true" /> {dayParts(next._t).weekday}, {dayParts(next._t).time}
                  </p>
                  {next.location && (
                    <p className="mt-1 text-[15px] text-ink-muted flex items-center gap-1.5 user-text">
                      <MapPin size={15} className="shrink-0" aria-hidden="true" /> {next.location}
                    </p>
                  )}
                </div>
              </div>
            </aside>
          )}
        </div>
      </section>

      {/* ======================== FACTS BAND ========================= */}
      <div className="bg-[#F6E9CC] border-y border-[#EAD7AE]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7 grid gap-6 sm:grid-cols-3">
          {facts.map((f) => (
            <div key={f.label} className="flex items-baseline gap-3">
              <span className="font-display text-4xl font-semibold text-navy">{f.value}</span>
              <span className="text-[15px] font-semibold text-ink-muted">{f.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* =========================== ABOUT =========================== */}
      <Section id="about" className="py-20 sm:py-24 bg-white">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <Heading
            kicker="What is FOLK"
            title="A place to grow, with friends who are growing too"
            body="FOLK (Friends of Lord Krishna) is the youth program of the Hare Krishna Movement. In Vizag, it gives young people the tools of an ancient wisdom tradition for very modern problems: stress, focus, habits, relationships and the question of what life is for."
          />
          <ol className="grid gap-4">
            {[
              ['01', 'Learn', 'Clear, practical classes from the Bhagavad-gita, with room for every question.'],
              ['02', 'Practise', 'Mantra meditation and a daily routine, tracked in the app so it sticks.'],
              ['03', 'Belong', 'A FOLK guide who knows you, and friends to serve and travel with.'],
            ].map(([n, t, b]) => (
              <li key={n} className="card p-6 flex gap-5">
                <span className="font-display text-2xl font-semibold text-saffron-dark">{n}</span>
                <div>
                  <h3 className="font-display text-lg font-semibold text-navy">{t}</h3>
                  <p className="mt-1 text-ink-muted leading-relaxed">{b}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </Section>

      {/* ========================= PROGRAMS ========================== */}
      <Section id="programs" className="py-20 sm:py-24">
        <Heading kicker="Get involved" title="Programs" body="Start with one. Most people begin at a weekly program and find the rest from there." />
        <div className="mt-12 grid gap-px bg-line border border-line rounded-2xl overflow-hidden sm:grid-cols-2 lg:grid-cols-3">
          {PROGRAMS.map((p) => {
            const Icon = PROGRAM_ICONS[p.key] || Users;
            return (
              <a
                key={p.key}
                href={p.href || '#'}
                onClick={handleProgram(p)}
                className="group bg-white p-7 sm:p-8 flex flex-col hover:bg-saffron-50 transition-colors"
              >
                <span className="w-12 h-12 rounded-full bg-saffron-50 text-saffron-dark ring-1 ring-saffron/20 inline-flex items-center justify-center group-hover:bg-saffron group-hover:text-white transition-colors">
                  <Icon size={24} aria-hidden="true" />
                </span>
                <h3 className="mt-5 font-display text-xl font-semibold text-navy">{p.title}</h3>
                <p className="mt-2 text-ink-muted leading-relaxed">{p.body}</p>
                <span className="mt-6 inline-flex items-center gap-1.5 text-[14px] font-semibold text-saffron-dark">
                  {p.login ? 'Sign in to join' : 'Learn more'} <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
                </span>
              </a>
            );
          })}
        </div>
      </Section>

      {/* ========================== EVENTS =========================== */}
      <Section id="events" className="py-20 sm:py-24 bg-white">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <Heading kicker="Calendar" title="Upcoming programs" />
          {upcoming.length > 0 && (
            <button type="button" onClick={onLoginClick} className="btn-outline">RSVP after signing in</button>
          )}
        </div>

        {eventsLoading ? (
          <div className="mt-10 grid gap-3" aria-hidden="true">
            {[0, 1, 2].map((i) => <div key={i} className="h-24 rounded-xl bg-paper animate-pulse" />)}
          </div>
        ) : upcoming.length === 0 ? (
          <div className="mt-10 card p-8 sm:p-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <h3 className="font-display text-xl font-bold">New programs are announced every week</h3>
              <p className="mt-1.5 text-ink-muted">Message us on WhatsApp and we&apos;ll tell you what&apos;s coming up.</p>
            </div>
            {wa && (
              <a href={wa} target="_blank" rel="noopener noreferrer" className="btn-primary shrink-0">
                <MessageCircle size={17} /> WhatsApp us
              </a>
            )}
          </div>
        ) : (
          <ul className="mt-10 divide-y divide-line border-y border-line">
            {upcoming.slice(0, 5).map((e) => {
              const d = dayParts(e._t);
              return (
                <li key={e.id} className="py-5 grid grid-cols-[4.5rem_1fr] sm:grid-cols-[5.5rem_1fr_auto] gap-x-5 gap-y-2 items-center">
                  <div className="text-center">
                    <div className="font-display text-3xl sm:text-4xl font-semibold text-navy leading-none">{d.day}</div>
                    <div className="mt-1 font-display text-xs font-bold text-saffron">{d.month}</div>
                  </div>
                  <div className="min-w-0">
                    {e.category && <p className="font-sans text-[11px] font-bold uppercase tracking-label text-navy-500">{e.category}</p>}
                    <h3 className="font-display text-lg sm:text-xl font-semibold text-navy leading-snug user-text">{e.title}</h3>
                    <p className="mt-1 text-[15px] text-ink-muted flex flex-wrap gap-x-4 gap-y-1">
                      <span className="inline-flex items-center gap-1.5"><CalendarDays size={15} aria-hidden="true" /> {d.weekday}, {d.time}</span>
                      {e.location && <span className="inline-flex items-center gap-1.5 user-text"><MapPin size={15} aria-hidden="true" /> {e.location}</span>}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onLoginClick}
                    className="col-start-2 sm:col-start-auto justify-self-start sm:justify-self-end text-[15px] font-semibold text-saffron-dark hover:text-saffron inline-flex items-center gap-1.5"
                  >
                    I&apos;m coming <ArrowRight size={15} />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Section>

      {/* ========================== YATRAS ============================ */}
      {openTrips.length > 0 && (
        <Section id="yatras" className="py-20 sm:py-24 bg-paper-dark">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <Heading kicker="Travel together" title="Yatras" body="Pilgrimages with the FOLK group, planned end to end. Book your seat online." />
            <a href="/trips" className="btn-outline">All yatras</a>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {openTrips.slice(0, 3).map((t) => (
              <a key={t.id} href={`/trip/${encodeURIComponent(t.slug || '')}`} className="group bg-white text-ink rounded-2xl overflow-hidden flex flex-col border border-line hover:shadow-premium-xl transition-shadow">
                <div className="aspect-[16/10] bg-saffron-50 overflow-hidden">
                  {t.coverImage ? (
                    <img src={t.coverImage} alt="" loading="lazy" className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-saffron/50"><Compass size={40} /></div>
                  )}
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <p className="font-sans text-[12px] font-bold uppercase tracking-label text-saffron">{tripDates(t.startDate, t.endDate)}</p>
                  <h3 className="mt-1.5 font-display text-xl font-semibold text-navy leading-tight user-text">{t.title}</h3>
                  {t.location && <p className="mt-1.5 text-ink-muted flex items-center gap-1.5 user-text"><MapPin size={15} className="shrink-0" /> {t.location}</p>}
                  <div className="mt-auto pt-5 flex items-center justify-between">
                    <span className="font-display font-bold">{Number(t.price) > 0 ? `${inr(t.price)} / person` : 'By seva'}</span>
                    <span className="text-[14px] font-semibold text-saffron-dark inline-flex items-center gap-1">Details <ArrowRight size={15} /></span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </Section>
      )}

      {/* ========================= RESIDENCY ========================= */}
      <Section id="residency" className="py-20 sm:py-24">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div className={`rounded-t-[10rem] rounded-b-2xl overflow-hidden bg-saffron-50 border border-line min-h-[300px] ${PHOTOS.residency ? '' : 'flex items-center justify-center'}`}>
            {PHOTOS.residency
              ? <img src={PHOTOS.residency} alt="FOLK residency" className="w-full h-full object-cover" />
              : <Home size={64} className="text-saffron/40" aria-hidden="true" />}
          </div>
          <div>
            <Heading
              kicker="FOLK Residency"
              title="Live near the temple"
              body="For young men studying or working in Vizag who want a disciplined, spiritual routine: morning program, sattvic prasadam and the company of people with the same goals."
            />
            <ul className="mt-6 grid gap-2.5 text-[16px]">
              {['Morning program and evening classes', 'Prasadam meals', 'A FOLK guide who checks in on you'].map((x) => (
                <li key={x} className="flex gap-3"><span className="mt-2.5 w-2 h-2 rounded-full bg-saffron shrink-0" />{x}</li>
              ))}
            </ul>
            <button type="button" onClick={onLoginClick} className="btn-dark mt-8">Apply after signing in <ArrowRight size={17} /></button>
          </div>
        </div>
      </Section>

      {/* ========================== GALLERY ========================== */}
      {PHOTOS.gallery.length > 0 && (
        <Section id="gallery" className="py-20 sm:py-24 bg-white">
          <Heading kicker="A glance into FOLK Vizag" title="Moments" />
          <div className="mt-12 grid gap-3 grid-cols-2 lg:grid-cols-4">
            {PHOTOS.gallery.slice(0, 8).map((p, i) => (
              <figure key={p.src} className={`relative rounded-lg overflow-hidden bg-navy ${i === 0 ? 'col-span-2 row-span-2' : ''}`}>
                <img src={p.src} alt={p.caption || ''} loading="lazy" className="w-full h-full object-cover aspect-square" />
                {p.caption && <figcaption className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 p-3 text-sm text-white">{p.caption}</figcaption>}
              </figure>
            ))}
          </div>
          {SITE.social.instagram && (
            <a href={SITE.social.instagram} target="_blank" rel="noopener noreferrer" className="btn-outline mt-8"><Instagram size={17} /> More on Instagram</a>
          )}
        </Section>
      )}

      {/* ========================== JOIN ============================= */}
      <Section className="py-20 sm:py-24 bg-white">
        <Heading center kicker="Getting started" title="Join in three steps" />
        <ol className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            ['Sign up', 'Create your account with your phone number. The code arrives on WhatsApp.'],
            ['Meet your FOLK guide', 'A senior member is assigned to you: someone to ask anything.'],
            ['Come to a program', 'Pick a weekly program or event and RSVP from the app.'],
          ].map(([t, b], i) => (
            <li key={t} className="text-center px-4">
              <span className="mx-auto w-14 h-14 rounded-full bg-saffron-50 text-saffron-dark ring-2 ring-marigold/50 font-display text-xl font-semibold inline-flex items-center justify-center">{i + 1}</span>
              <h3 className="mt-5 font-display text-xl font-semibold text-navy">{t}</h3>
              <p className="mt-2 text-ink-muted leading-relaxed">{b}</p>
            </li>
          ))}
        </ol>
        <div className="mt-12 text-center">
          <button type="button" onClick={onLoginClick} className="btn-primary">Create my account <ArrowRight size={17} /></button>
        </div>
      </Section>

      {/* ========================= CONTACT =========================== */}
      <Section id="contact" className="py-20 sm:py-24 bg-white">
        <div className="grid gap-12 lg:grid-cols-2">
          <Heading kicker="Contact" title="Talk to us" body="Questions about programs, the residency or a yatra? Message the FOLK team and a coordinator will reply." />
          <ul className="grid gap-4 self-center">
            {wa && (
              <li>
                <a href={wa} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-5 rounded-2xl bg-paper hover:bg-saffron-50 border border-line">
                  <MessageCircle className="text-saffron shrink-0" aria-hidden="true" />
                  <span><span className="block font-display font-semibold text-navy">WhatsApp</span><span className="text-ink-muted">{SITE.contact.phone}</span></span>
                </a>
              </li>
            )}
            {SITE.contact.phone && (
              <li>
                <a href={`tel:${SITE.contact.phone.replace(/\s/g, '')}`} className="flex items-center gap-4 p-5 rounded-2xl bg-paper hover:bg-saffron-50 border border-line">
                  <Phone className="text-saffron shrink-0" aria-hidden="true" />
                  <span><span className="block font-display font-semibold text-navy">Call</span><span className="text-ink-muted">{SITE.contact.phone}</span></span>
                </a>
              </li>
            )}
            {SITE.contact.address && (
              <li className="flex items-center gap-4 p-5 rounded-2xl bg-paper border border-line">
                <MapPin className="text-saffron shrink-0" aria-hidden="true" />
                <span><span className="block font-display font-semibold text-navy">Visit</span><span className="text-ink-muted">{SITE.contact.address}</span></span>
              </li>
            )}
          </ul>
        </div>
      </Section>

      <SiteFooter />
    </div>
  );
};

export default Landing;
