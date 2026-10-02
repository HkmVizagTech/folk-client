import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays, MapPin, Plus, Pencil, Globe, HeartHandshake, Building2, Users } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useFirestore } from '../hooks/useFirestore';
import { toDate, formatTime, dateKeyIST, todayIST } from '../lib/dates';
import { audienceOf, canManageEvent } from '../content/audiences';
import EventModal from '../components/events/EventModal';

// Festival dates follow the lunar calendar and move every year, so none are
// hard-coded here (the old page had several in the wrong month). The grid
// shows what FOLK Vizag has actually scheduled; add festivals as events.
const OBSERVANCES = [
  ['Ekadashi', 'Twice a month. A day for fasting from grains and beans, and extra chanting.'],
  ['Gaura Purnima', 'Appearance of Sri Chaitanya Mahaprabhu (spring full moon).'],
  ['Ratha Yatra', 'The chariot festival of Lord Jagannath (monsoon).'],
  ['Janmashtami', 'Appearance of Lord Krishna (August–September).'],
  ['Radhashtami', 'Appearance of Srimati Radharani, two weeks after Janmashtami.'],
  ['Kartik', 'The holy month of Damodara, with daily deepa-dana (October–November).'],
  ['Gita Jayanti', 'The day the Bhagavad-gita was spoken (November–December).'],
];

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// One colour per audience, used by the dots under each day and the chips.
const TONE = {
  all: { dot: 'bg-saffron', chip: 'bg-saffron-50 text-saffron-dark border-saffron/30', icon: Globe },
  mine: { dot: 'bg-navy-500', chip: 'bg-navy-50 text-navy-700 border-navy-200', icon: HeartHandshake },
  residents: { dot: 'bg-marigold-dark', chip: 'bg-marigold/15 text-marigold-dark border-marigold/40', icon: Building2 },
};

const AudienceChip = ({ event }) => {
  const a = audienceOf(event);
  const tone = TONE[a.id] || TONE.all;
  const Icon = tone.icon;
  return (
    <span className={`chip border ${tone.chip}`}>
      <Icon size={12} aria-hidden="true" /> {a.short}
    </span>
  );
};

const Calendar = () => {
  const { user } = useAuth();
  const isStaff = user?.role === 'admin' || user?.role === 'folks_head';
  const { data: events, loading } = useFirestore('events');

  const now = new Date();
  const [cursor, setCursor] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const [selected, setSelected] = useState(() => todayIST());
  const [onlyMine, setOnlyMine] = useState(false);
  const [editing, setEditing] = useState(null); // { event } | { date }

  // The server already hides events this person isn't meant to see; this is
  // just the guide's own "show only what I run" filter.
  const visible = useMemo(
    () => (onlyMine && user?.uid ? events.filter((e) => e.ownerId === user.uid) : events),
    [events, onlyMine, user?.uid]
  );

  const byDay = useMemo(() => {
    const map = new Map();
    for (const e of visible) {
      const d = toDate(e.dateISO || e.date);
      if (!d) continue;
      const k = dateKeyIST(d);
      if (!map.has(k)) map.set(k, []);
      map.get(k).push({ ...e, _d: d });
    }
    for (const list of map.values()) list.sort((a, b) => a._d - b._d);
    return map;
  }, [visible]);

  const cells = useMemo(() => {
    const first = new Date(Date.UTC(cursor.y, cursor.m, 1));
    const offset = (first.getUTCDay() + 6) % 7; // Monday-first
    const days = new Date(Date.UTC(cursor.y, cursor.m + 1, 0)).getUTCDate();
    const out = Array.from({ length: offset }, () => null);
    for (let d = 1; d <= days; d++) out.push(`${cursor.y}-${String(cursor.m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
    while (out.length % 7) out.push(null);
    return out;
  }, [cursor]);

  const move = (delta) => setCursor(({ y, m }) => { const n = new Date(Date.UTC(y, m + delta, 1)); return { y: n.getUTCFullYear(), m: n.getUTCMonth() }; });
  const monthLabel = new Date(Date.UTC(cursor.y, cursor.m, 1)).toLocaleDateString('en-IN', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  const todayKey = todayIST();
  const dayEvents = byDay.get(selected) || [];
  const selectedLabel = new Date(`${selected}T12:00:00+05:30`).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Asia/Kolkata' });

  // What the guide has coming up, so they don't have to hunt through months.
  const upcomingMine = useMemo(() => {
    if (!isStaff || !user?.uid) return [];
    const from = Date.now() - 6 * 3600 * 1000;
    return events
      .filter((e) => e.ownerId === user.uid)
      .map((e) => ({ ...e, _d: toDate(e.dateISO || e.date) }))
      .filter((e) => e._d && e._d.getTime() >= from)
      .sort((a, b) => a._d - b._d)
      .slice(0, 4);
  }, [events, isStaff, user?.uid]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="display-lg">Calendar</h1>
          <p className="mt-1 text-ink-muted">
            {isStaff
              ? 'Everything you and the team have scheduled. Tap a day to add a program for your members.'
              : 'Programs for you — from FOLK Vizag and from your guide. Tap a day to see what is on.'}
          </p>
        </div>
        {isStaff && (
          <button type="button" onClick={() => setEditing({ date: selected })} className="btn-primary">
            <Plus size={18} /> New program
          </button>
        )}
      </div>

      {isStaff && (
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex p-1 bg-white border border-line rounded-md" role="tablist" aria-label="Which programs">
            {[[false, 'All programs'], [true, 'Only mine']].map(([v, label]) => (
              <button
                key={label}
                type="button"
                role="tab"
                aria-selected={onlyMine === v}
                onClick={() => setOnlyMine(v)}
                className={`h-9 px-3.5 rounded text-[14px] font-semibold ${onlyMine === v ? 'bg-paper text-ink' : 'text-ink-muted hover:text-ink'}`}
              >
                {label}
              </button>
            ))}
          </div>
          <ul className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px] text-ink-muted">
            {Object.entries(TONE).map(([id, tone]) => (
              <li key={id} className="inline-flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded-full ${tone.dot}`} aria-hidden="true" />
                {id === 'all' ? 'Public' : id === 'mine' ? "A guide's members" : 'Residency'}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-3">
        <section className="card p-4 sm:p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-bold">{monthLabel}</h2>
            <div className="flex gap-1">
              <button type="button" onClick={() => move(-1)} aria-label="Previous month" className="w-10 h-10 inline-flex items-center justify-center rounded-md border border-line hover:bg-paper"><ChevronLeft size={18} /></button>
              <button type="button" onClick={() => { setCursor({ y: now.getFullYear(), m: now.getMonth() }); setSelected(todayKey); }} className="h-10 px-3 rounded-md border border-line hover:bg-paper text-[14px] font-semibold">Today</button>
              <button type="button" onClick={() => move(1)} aria-label="Next month" className="w-10 h-10 inline-flex items-center justify-center rounded-md border border-line hover:bg-paper"><ChevronRight size={18} /></button>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-7 text-center text-[12px] font-sans font-bold uppercase tracking-label text-ink-muted">
            {WEEKDAYS.map((d) => <div key={d} className="py-2">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((k, i) => {
              if (!k) return <div key={`x${i}`} />;
              const list = byDay.get(k) || [];
              const isSel = k === selected;
              // One dot per audience present that day, up to three.
              const dots = [...new Set(list.map((e) => audienceOf(e).id))].slice(0, 3);
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => setSelected(k)}
                  aria-pressed={isSel}
                  aria-label={`${k}${list.length ? `, ${list.length} program${list.length > 1 ? 's' : ''}` : ''}`}
                  className={`aspect-square rounded-lg flex flex-col items-center justify-center gap-1 text-[15px] transition-colors ${
                    isSel ? 'bg-navy text-white' : k === todayKey ? 'bg-saffron-50 text-saffron-dark font-bold' : 'hover:bg-paper'
                  }`}
                >
                  {Number(k.slice(8))}
                  <span className="flex gap-0.5 h-1.5" aria-hidden="true">
                    {dots.map((id) => (
                      <span key={id} className={`h-1.5 w-1.5 rounded-full ${isSel ? 'bg-marigold' : (TONE[id] || TONE.all).dot}`} />
                    ))}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="card p-5 sm:p-6 flex flex-col">
          <h2 className="font-sans text-[13px] font-bold uppercase tracking-label text-ink-muted">{selectedLabel}</h2>

          {loading && !events.length ? (
            <div className="mt-4 space-y-3" aria-hidden="true">
              {[0, 1].map((i) => <div key={i} className="h-16 rounded-xl bg-paper animate-pulse" />)}
            </div>
          ) : dayEvents.length ? (
            <ul className="mt-4 space-y-4">
              {dayEvents.map((e) => (
                <li key={e.id} className="border-l-2 border-line pl-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-display font-bold user-text">{e.title}</p>
                    {canManageEvent(user, e) && (
                      <button type="button" onClick={() => setEditing({ event: e })} aria-label={`Edit ${e.title}`} className="shrink-0 w-8 h-8 -mt-1 inline-flex items-center justify-center rounded-md text-ink-muted hover:bg-paper hover:text-ink">
                        <Pencil size={15} />
                      </button>
                    )}
                  </div>
                  <p className="mt-1 text-[14px] text-ink-muted flex flex-wrap gap-x-3 gap-y-1">
                    <span className="inline-flex items-center gap-1"><CalendarDays size={14} /> {formatTime(e._d)}</span>
                    {e.location && <span className="inline-flex items-center gap-1 user-text"><MapPin size={14} /> {e.location}</span>}
                    {(e.attendingCount || 0) > 0 && <span className="inline-flex items-center gap-1"><Users size={14} /> {e.attendingCount} going</span>}
                  </p>
                  <p className="mt-2 flex flex-wrap items-center gap-2">
                    <AudienceChip event={e} />
                    {e.ownerName && e.audience && e.audience !== 'all' && (
                      <span className="text-[12px] text-ink-muted user-text">by {e.ownerId === user?.uid ? 'you' : e.ownerName}</span>
                    )}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-ink-muted">Nothing scheduled.</p>
          )}

          {isStaff && (
            <button type="button" onClick={() => setEditing({ date: selected })} className="btn border border-dashed border-line text-ink-muted hover:bg-paper hover:text-ink mt-5 w-full normal-case tracking-normal text-[14px]">
              <Plus size={16} /> Add a program on this day
            </button>
          )}
        </section>
      </div>

      {isStaff && upcomingMine.length > 0 && (
        <section className="card p-5 sm:p-6">
          <h2 className="font-sans text-[13px] font-bold uppercase tracking-label text-ink-muted">Your next programs</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {upcomingMine.map((e) => (
              <li key={e.id}>
                <button
                  type="button"
                  onClick={() => { setSelected(dateKeyIST(e._d)); setCursor({ y: e._d.getFullYear(), m: e._d.getMonth() }); }}
                  className="w-full text-left flex items-center gap-4 rounded-xl border border-line p-3.5 hover:bg-paper transition-colors"
                >
                  <span className="shrink-0 w-12 rounded-lg bg-paper text-center py-1.5">
                    <span className="block font-display text-lg font-extrabold leading-none text-navy-700">{e._d.toLocaleDateString('en-IN', { day: '2-digit', timeZone: 'Asia/Kolkata' })}</span>
                    <span className="block mt-0.5 font-sans text-[10px] font-bold uppercase tracking-label text-saffron-dark">{e._d.toLocaleDateString('en-IN', { month: 'short', timeZone: 'Asia/Kolkata' })}</span>
                  </span>
                  <span className="min-w-0">
                    <span className="block font-semibold truncate user-text">{e.title}</span>
                    <span className="block text-[13px] text-ink-muted">{formatTime(e._d)}{e.location ? ` · ${e.location}` : ''}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="card p-5 sm:p-6">
        <h2 className="display-md">Vaishnava observances</h2>
        <p className="mt-1 text-ink-muted">Exact dates change each year with the lunar calendar. FOLK Vizag announces each one as an event.</p>
        <ul className="mt-5 grid gap-x-8 gap-y-4 sm:grid-cols-2">
          {OBSERVANCES.map(([t, b]) => (
            <li key={t}><p className="font-display font-bold">{t}</p><p className="text-ink-muted">{b}</p></li>
          ))}
        </ul>
      </section>

      <EventModal
        open={!!editing}
        onClose={() => setEditing(null)}
        event={editing?.event || null}
        defaultDate={editing?.date || ''}
      />
    </div>
  );
};

export default Calendar;
