import React, { useMemo } from 'react';
import { where } from '../lib/pgstore';
import {
  ArrowRight, CalendarDays, MapPin, QrCode, Compass, Flame, MessageCircle, Phone, UserRound, CheckCircle2, BookOpenText, Check,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useFirestore } from '../hooks/useFirestore';
import { todayIST, greeting, toDate, formatDay, formatTime } from '../lib/dates';
import { STAGES, stageOf, stageLabel, ROUNDS_TARGET } from '../content/journey';
import { verseOfTheDay } from '../content/wisdom';
import ProgressRing from '../components/ui/ProgressRing';
import { Lotus } from '../components/site/Ornament';

const firstName = (u) => String(u?.name || u?.displayName || '').trim().split(/\s+/)[0] || 'friend';
const initials = (n = '') => String(n || '').trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() || '').join('') || '?';
const waLink = (phone) => {
  const d = String(phone || '').replace(/\D/g, '');
  const n = d.length === 10 ? `91${d}` : d;
  return n ? `https://wa.me/${n}` : '';
};

const Card = ({ title, action, onAction, children, className = '' }) => (
  <section className={`card p-5 sm:p-6 flex flex-col ${className}`}>
    <div className="flex items-center justify-between gap-3">
      <h2 className="font-sans text-[13px] font-bold uppercase tracking-label text-ink-muted">{title}</h2>
      {action && (
        <button type="button" onClick={onAction} className="font-sans text-[12px] font-bold uppercase tracking-label text-saffron hover:text-saffron-dark inline-flex items-center gap-1">
          {action} <ArrowRight size={14} />
        </button>
      )}
    </div>
    <div className="mt-4 flex-1 flex flex-col">{children}</div>
  </section>
);

const MemberHome = ({ setActiveTab }) => {
  const { user } = useAuth();
  const uid = user?.uid || '__none__';
  const today = todayIST();
  const verse = useMemo(() => verseOfTheDay(), []);

  const logQ = useMemo(() => [where('userId', '==', uid), where('date', '==', today)], [uid, today]);
  const { data: todayLogs, loading: logLoading } = useFirestore('sadhana_logs', logQ);
  const log = todayLogs[0] || null;

  const { data: events } = useFirestore('events');
  const myRegsQ = useMemo(() => [where('userId', '==', uid)], [uid]);
  const { data: myRegs } = useFirestore('registrations', myRegsQ);
  const { data: myTrips } = useFirestore('trip_registrations', myRegsQ);

  const next = useMemo(() => {
    const now = Date.now() - 6 * 3600 * 1000;
    return (events || [])
      .map((e) => ({ ...e, _d: toDate(e.dateISO || e.date) }))
      .filter((e) => e._d && e._d.getTime() >= now)
      .sort((a, b) => a._d - b._d)[0] || null;
  }, [events]);
  const nextRsvp = next && myRegs.find((r) => r.eventId === next.id);

  const activeTrips = myTrips.filter((t) => String(t.status || '').toLowerCase() !== 'cancelled');

  const rounds = Number(log?.roundsCompleted) || 0;
  const target = Number(log?.target) || Number(user?.sadhanaTarget) || ROUNDS_TARGET;
  const done = rounds >= target;
  const streak = user?.streak || 0;
  const stage = stageOf(user);
  const stageIdx = Math.max(0, STAGES.findIndex((s) => s.id === stage));

  return (
    <div className="space-y-6">
      {/* ---- Hero: greeting, today's japa, verse of the day ---- */}
      <section className="hero-devotional relative overflow-hidden rounded-3xl text-white shadow-premium-xl">
        <div className="relative p-6 sm:p-8 lg:p-10 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="min-w-0">
            <p className="font-sans text-[13px] font-semibold uppercase tracking-[0.14em] text-marigold-light/90">{greeting()}</p>
            <h1 className="mt-1.5 font-display font-semibold leading-[1.12] text-white" style={{ fontSize: 'clamp(1.9rem, 3.6vw, 2.8rem)' }}>
              Hare Krishna, {firstName(user)}
            </h1>
            <span className="chip mt-3 border border-marigold/50 bg-white/10 text-marigold-light">
              <span className="w-1.5 h-1.5 rounded-full bg-marigold" /> {stageLabel(stage)} member
            </span>

            <figure className="mt-6 max-w-xl border-l-2 border-marigold/60 pl-4">
              <blockquote className="font-display italic text-[17px] sm:text-lg leading-relaxed text-white/90 user-text">
                “{verse.text}”
              </blockquote>
              <figcaption className="mt-2 font-sans text-[12px] font-bold uppercase tracking-label text-marigold-light/90 inline-flex items-center gap-2">
                <BookOpenText size={14} aria-hidden="true" /> {verse.ref}
              </figcaption>
            </figure>

            <div className="mt-7 flex flex-wrap gap-3">
              <button type="button" onClick={() => setActiveTab('sadhana')} className="btn-primary shadow-premium-xl">
                {log ? 'Update today’s rounds' : 'Log today’s rounds'}
              </button>
              <button type="button" onClick={() => setActiveTab('profile')} className="btn-outline-light">
                <QrCode size={17} /> My check-in QR
              </button>
            </div>
          </div>

          {/* Japa ring */}
          <div className="justify-self-center lg:justify-self-end flex flex-col items-center gap-3">
            {logLoading ? (
              <div className="w-[150px] h-[150px] rounded-full bg-white/10 animate-pulse" aria-hidden="true" />
            ) : (
              <ProgressRing
                value={rounds}
                max={target}
                size={150}
                stroke={11}
                trackClass="text-white/20"
                barClass={done ? 'text-marigold' : 'text-saffron-light'}
                label={`${rounds} of ${target} rounds today`}
              >
                <span className="font-display text-[2.4rem] font-bold leading-none">{rounds}</span>
                <span className="mt-1 font-sans text-[11px] font-bold uppercase tracking-label text-white/70">of {target} rounds</span>
              </ProgressRing>
            )}
            <p className="inline-flex items-center gap-1.5 font-sans text-[13px] font-semibold text-white/85">
              {done
                ? <><Check size={15} className="text-marigold" /> Target reached — Jaya!</>
                : <><Flame size={15} className="text-saffron-light" /> {streak} day streak{streak > 0 ? ' — keep it alive' : ''}</>}
            </p>
          </div>
        </div>
        <Lotus className="absolute bottom-4 right-6 text-marigold/40 hidden sm:block" />
      </section>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Next program */}
        <Card title="Next program" action="All events" onAction={() => setActiveTab('events')} className="lg:col-span-2 card-hover">
          {next ? (
            <div className="flex gap-5">
              <div className="shrink-0 w-[4.2rem] rounded-2xl border border-line bg-paper text-center py-3 self-start">
                <div className="font-display text-3xl font-extrabold leading-none text-navy-700">{next._d.toLocaleDateString('en-IN', { day: '2-digit', timeZone: 'Asia/Kolkata' })}</div>
                <div className="mt-1 font-sans text-[11px] font-bold uppercase tracking-label text-saffron-dark">{next._d.toLocaleDateString('en-IN', { month: 'short', timeZone: 'Asia/Kolkata' })}</div>
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-display text-xl font-bold leading-snug user-text">{next.title}</h3>
                <p className="mt-1.5 text-[15px] text-ink-muted flex flex-wrap gap-x-4 gap-y-1">
                  <span className="inline-flex items-center gap-1.5"><CalendarDays size={15} /> {formatDay(next._d)}, {formatTime(next._d)}</span>
                  {next.location && <span className="inline-flex items-center gap-1.5 user-text"><MapPin size={15} /> {next.location}</span>}
                </p>
                {nextRsvp?.status === 'Attending' ? (
                  <p className="mt-4 inline-flex items-center gap-2 text-green-700 font-semibold"><CheckCircle2 size={18} /> You&apos;re going</p>
                ) : (
                  <button type="button" onClick={() => setActiveTab('events')} className="btn-dark mt-4">RSVP</button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-4">
              <Lotus className="text-marigold" />
              <p className="mt-3 text-ink-muted max-w-xs">No programs scheduled yet. We&apos;ll notify you when the next one is announced.</p>
            </div>
          )}
        </Card>

        {/* FOLK guide */}
        <Card title="My FOLK guide" className="card-hover">
          {user?.guideName ? (
            <div className="flex-1 flex flex-col">
              <div className="flex items-center gap-4">
                <span className="w-14 h-14 rounded-full bg-navy text-marigold-light ring-2 ring-marigold/50 ring-offset-2 ring-offset-white font-display text-lg font-bold inline-flex items-center justify-center shrink-0">{initials(user.guideName)}</span>
                <div className="min-w-0">
                  <p className="font-display text-lg font-bold user-text">{user.guideName}</p>
                  <p className="text-[14px] text-ink-muted">Walks the path with you</p>
                </div>
              </div>
              {user.guidePhone && (
                <div className="mt-auto pt-5 grid grid-cols-2 gap-2">
                  <a href={waLink(user.guidePhone)} target="_blank" rel="noopener noreferrer" className="btn border border-line text-ink hover:bg-paper normal-case tracking-normal text-[14px]">
                    <MessageCircle size={17} /> WhatsApp
                  </a>
                  <a href={`tel:${String(user.guidePhone).replace(/\s/g, '')}`} className="btn border border-line text-ink hover:bg-paper normal-case tracking-normal text-[14px]">
                    <Phone size={17} /> Call
                  </a>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-start gap-3">
              <span className="w-12 h-12 rounded-full bg-paper text-ink-muted inline-flex items-center justify-center"><UserRound size={22} /></span>
              <p className="text-ink-muted">A FOLK guide will be assigned to you soon. They&apos;ll reach out on WhatsApp.</p>
            </div>
          )}
        </Card>

        {/* My journey */}
        <Card title="My journey" className="lg:col-span-2 card-hover">
          <ol className="flex items-start" aria-label="FOLK journey stages">
            {STAGES.map((s, i) => {
              const reached = i <= stageIdx;
              const current = i === stageIdx;
              return (
                <li key={s.id} className="flex-1 min-w-0 flex flex-col items-center text-center relative">
                  {i > 0 && (
                    <span
                      className={`absolute top-[15px] h-0.5 ${i <= stageIdx ? 'bg-saffron' : 'bg-line'}`}
                      style={{ left: '-50%', width: '100%' }}
                      aria-hidden="true"
                    />
                  )}
                  <span
                    className={`relative z-10 w-8 h-8 rounded-full inline-flex items-center justify-center font-sans text-[12px] font-bold border-2 ${
                      current ? 'bg-saffron border-saffron text-white shadow-premium'
                        : reached ? 'bg-saffron-50 border-saffron text-saffron-dark'
                        : 'bg-white border-line text-ink-muted'
                    }`}
                    aria-hidden="true"
                  >
                    {reached && !current ? <Check size={14} /> : i + 1}
                  </span>
                  <span className={`mt-2 text-[12px] leading-tight font-semibold ${current ? 'text-navy-700' : reached ? 'text-ink' : 'text-ink-muted'}`}>{s.label}</span>
                </li>
              );
            })}
          </ol>
          <p className="mt-4 rounded-xl bg-paper px-4 py-3 text-[14px] text-ink-muted">
            <span className="font-semibold text-ink">{stageLabel(stage)}:</span> {STAGES[stageIdx]?.desc}. Your FOLK guide walks the next step with you.
          </p>
        </Card>

        {/* Check-in QR */}
        <Card title="Check-in" className="card-hover">
          <button type="button" onClick={() => setActiveTab('profile')} className="flex-1 flex items-center gap-4 rounded-xl bg-saffron-50 text-ink border border-saffron/20 p-5 text-left hover:bg-saffron-100 transition-colors">
            <QrCode size={40} className="text-saffron-dark" aria-hidden="true" />
            <span>
              <span className="block font-display font-bold">Show my QR</span>
              <span className="block text-[14px] text-ink-muted">Staff scan it at programs for check-in &amp; prasadam</span>
            </span>
          </button>
        </Card>

        {/* Yatras */}
        <Card title="My yatras" action="Browse yatras" onAction={() => setActiveTab('trips')} className="lg:col-span-3">
          {activeTrips.length ? (
            <ul className="divide-y divide-line">
              {activeTrips.slice(0, 4).map((t) => {
                const confirmed = String(t.status || '').toLowerCase() === 'confirmed';
                return (
                  <li key={t.id} className="py-3 flex items-center justify-between gap-4">
                    <span className="flex items-center gap-3 min-w-0">
                      <span className="w-9 h-9 rounded-full bg-navy-50 text-navy-700 inline-flex items-center justify-center shrink-0"><Compass size={18} aria-hidden="true" /></span>
                      <span className="font-semibold truncate">{t.tripTitle || 'Yatra'}</span>
                    </span>
                    <span className={`chip shrink-0 ${confirmed ? 'bg-green-50 text-green-700' : 'bg-paper text-ink-muted'}`}>
                      {t.seats || 1} seat{(t.seats || 1) === 1 ? '' : 's'} · {t.status || 'pending'}
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="text-ink-muted">Vrindavan, Tirupati, Jagannath Puri… travel to the holy dhamas with the FOLK crew.</p>
              <button type="button" onClick={() => setActiveTab('trips')} className="btn-outline text-[14px] min-h-[44px]">
                <Compass size={17} /> Explore yatras
              </button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default MemberHome;
