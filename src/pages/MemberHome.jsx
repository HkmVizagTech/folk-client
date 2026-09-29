import React, { useMemo } from 'react';
import { where } from 'firebase/firestore';
import {
  ArrowRight, CalendarDays, MapPin, QrCode, Compass, Flame, Trophy, MessageCircle, Phone, UserRound, CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useFirestore } from '../hooks/useFirestore';
import { todayIST, greeting, toDate, formatDay, formatTime } from '../lib/dates';
import { stageOf, stageLabel, ROUNDS_TARGET } from '../content/journey';

const firstName = (u) => String(u?.name || u?.displayName || '').trim().split(/\s+/)[0] || 'friend';
const initials = (n = '') => n.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() || '').join('') || '?';
const waLink = (phone) => {
  const d = String(phone || '').replace(/\D/g, '');
  const n = d.length === 10 ? `91${d}` : d;
  return n ? `https://wa.me/${n}` : '';
};

const Card = ({ title, action, onAction, children, className = '' }) => (
  <section className={`card p-5 sm:p-6 flex flex-col ${className}`}>
    <div className="flex items-center justify-between gap-3">
      <h2 className="font-display text-[13px] font-bold uppercase tracking-label text-ink-muted">{title}</h2>
      {action && (
        <button type="button" onClick={onAction} className="font-display text-[12px] font-bold uppercase tracking-label text-saffron hover:text-saffron-dark inline-flex items-center gap-1">
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
  const target = Number(log?.target) || ROUNDS_TARGET;
  const pct = Math.min(100, Math.round((rounds / target) * 100));
  const stage = stageOf(user);

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-ink-muted">{greeting()},</p>
          <h1 className="display-lg mt-1">Hare Krishna, {firstName(user)}</h1>
        </div>
        <span className="inline-flex items-center gap-2 h-9 px-3.5 rounded-full bg-navy-50 text-navy-700 font-display text-[12px] font-bold uppercase tracking-label">
          <span className="w-2 h-2 rounded-full bg-navy-700" /> {stageLabel(stage)} member
        </span>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Today's chanting */}
        <Card title="Today's chanting" action="Open tracker" onAction={() => setActiveTab('sadhana')} className="lg:col-span-2">
          {logLoading ? (
            <div className="h-24 rounded-md bg-paper animate-pulse" aria-hidden="true" />
          ) : (
            <div className="grid gap-6 sm:grid-cols-[1fr_auto] sm:items-center">
              <div>
                <p className="font-display">
                  <span className="text-5xl font-extrabold">{rounds}</span>
                  <span className="text-xl font-bold text-ink-muted"> / {target} rounds</span>
                </p>
                <div className="mt-4 h-3 rounded-full bg-paper overflow-hidden" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Today's rounds">
                  <div className={`h-full rounded-full ${pct >= 100 ? 'bg-green-600' : 'bg-saffron'}`} style={{ width: `${pct}%` }} />
                </div>
                <p className="mt-2.5 text-[15px] text-ink-muted">
                  {pct >= 100 ? 'Target reached today. Jaya!' : log ? `${target - rounds} rounds to go.` : "You haven't logged today yet."}
                </p>
              </div>
              <div className="flex sm:flex-col gap-3">
                <div className="flex-1 rounded-lg bg-paper px-4 py-3 flex items-center gap-3">
                  <Flame size={22} className="text-saffron" aria-hidden="true" />
                  <span><span className="block font-display text-xl font-extrabold leading-none">{user?.streak || 0}</span><span className="text-[13px] text-ink-muted">day streak</span></span>
                </div>
                <div className="flex-1 rounded-lg bg-paper px-4 py-3 flex items-center gap-3">
                  <Trophy size={22} className="text-marigold-dark" aria-hidden="true" />
                  <span><span className="block font-display text-xl font-extrabold leading-none">{user?.longestStreak || 0}</span><span className="text-[13px] text-ink-muted">best streak</span></span>
                </div>
              </div>
            </div>
          )}
          <button type="button" onClick={() => setActiveTab('sadhana')} className="btn-primary mt-6 self-start">
            {log ? 'Update rounds' : "Log today's rounds"}
          </button>
        </Card>

        {/* FOLK guide */}
        <Card title="My FOLK guide">
          {user?.guideName ? (
            <div className="flex-1 flex flex-col">
              <div className="flex items-center gap-4">
                <span className="w-14 h-14 rounded-full bg-navy text-white font-display text-lg font-bold inline-flex items-center justify-center shrink-0">{initials(user.guideName)}</span>
                <div className="min-w-0">
                  <p className="font-display text-lg font-bold user-text">{user.guideName}</p>
                  <p className="text-[14px] text-ink-muted">Your guide at FOLK Vizag</p>
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

        {/* Next program */}
        <Card title="Next program" action="All events" onAction={() => setActiveTab('events')} className="lg:col-span-2">
          {next ? (
            <div className="flex gap-5">
              <div className="shrink-0 w-16 text-center">
                <div className="font-display text-4xl font-extrabold leading-none">{next._d.toLocaleDateString('en-IN', { day: '2-digit', timeZone: 'Asia/Kolkata' })}</div>
                <div className="mt-1 font-display text-xs font-bold text-saffron">{next._d.toLocaleDateString('en-IN', { month: 'short', timeZone: 'Asia/Kolkata' }).toUpperCase()}</div>
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-display text-xl font-bold leading-snug user-text">{next.title}</h3>
                <p className="mt-1 text-[15px] text-ink-muted flex flex-wrap gap-x-4 gap-y-1">
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
            <p className="text-ink-muted">No programs scheduled yet. We&apos;ll notify you when the next one is announced.</p>
          )}
        </Card>

        {/* Check-in QR */}
        <Card title="Check-in">
          <button type="button" onClick={() => setActiveTab('profile')} className="flex-1 flex items-center gap-4 rounded-lg bg-ink text-white p-5 text-left hover:bg-navy transition-colors">
            <QrCode size={40} aria-hidden="true" />
            <span>
              <span className="block font-display font-bold">Show my QR</span>
              <span className="block text-[14px] text-white/70">Staff scan it at programs</span>
            </span>
          </button>
        </Card>

        {/* Yatras */}
        <Card title="My yatras" action="Browse" onAction={() => setActiveTab('trips')} className="lg:col-span-3">
          {activeTrips.length ? (
            <ul className="divide-y divide-line">
              {activeTrips.slice(0, 4).map((t) => (
                <li key={t.id} className="py-3 flex items-center justify-between gap-4">
                  <span className="flex items-center gap-3 min-w-0">
                    <Compass size={20} className="text-navy-500 shrink-0" aria-hidden="true" />
                    <span className="font-semibold truncate">{t.tripTitle || 'Yatra'}</span>
                  </span>
                  <span className="shrink-0 text-[13px] font-display font-bold uppercase tracking-label text-ink-muted">
                    {t.seats || 1} seat{(t.seats || 1) === 1 ? '' : 's'} · {t.status || 'pending'}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-ink-muted">You haven&apos;t booked a yatra yet.</p>
          )}
        </Card>
      </div>
    </div>
  );
};

export default MemberHome;
