import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays, MapPin } from 'lucide-react';
import { useFirestore } from '../hooks/useFirestore';
import { toDate, formatTime, dateKeyIST } from '../lib/dates';

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

const Calendar = () => {
  const { data: events } = useFirestore('events');
  const now = new Date();
  const [cursor, setCursor] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const [selected, setSelected] = useState(dateKeyIST(now));

  const byDay = useMemo(() => {
    const map = new Map();
    for (const e of events) {
      const d = toDate(e.dateISO || e.date);
      if (!d) continue;
      const k = dateKeyIST(d);
      if (!map.has(k)) map.set(k, []);
      map.get(k).push({ ...e, _d: d });
    }
    for (const list of map.values()) list.sort((a, b) => a._d - b._d);
    return map;
  }, [events]);

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
  const todayKey = dateKeyIST(now);
  const dayEvents = byDay.get(selected) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="display-lg">Calendar</h1>
        <p className="mt-1 text-ink-muted">Everything FOLK Vizag has scheduled. Tap a day to see its programs.</p>
      </div>

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
          <div className="mt-4 grid grid-cols-7 text-center text-[12px] font-display font-bold uppercase tracking-label text-ink-muted">
            {WEEKDAYS.map((d) => <div key={d} className="py-2">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((k, i) => {
              if (!k) return <div key={`x${i}`} />;
              const list = byDay.get(k) || [];
              const isSel = k === selected;
              return (
                <button key={k} type="button" onClick={() => setSelected(k)} aria-pressed={isSel} aria-label={`${k}${list.length ? `, ${list.length} event${list.length > 1 ? 's' : ''}` : ''}`}
                  className={`aspect-square rounded-md flex flex-col items-center justify-center gap-1 text-[15px] ${isSel ? 'bg-ink text-white' : k === todayKey ? 'bg-saffron-50 text-saffron-dark font-bold' : 'hover:bg-paper'}`}>
                  {Number(k.slice(8))}
                  <span className={`h-1.5 w-1.5 rounded-full ${list.length ? (isSel ? 'bg-marigold' : 'bg-saffron') : 'bg-transparent'}`} />
                </button>
              );
            })}
          </div>
        </section>

        <section className="card p-5 sm:p-6">
          <h2 className="font-display text-[13px] font-bold uppercase tracking-label text-ink-muted">
            {new Date(`${selected}T12:00:00+05:30`).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Asia/Kolkata' })}
          </h2>
          {dayEvents.length ? (
            <ul className="mt-4 space-y-4">
              {dayEvents.map((e) => (
                <li key={e.id}>
                  <p className="font-display font-bold user-text">{e.title}</p>
                  <p className="text-[14px] text-ink-muted flex flex-wrap gap-x-3">
                    <span className="inline-flex items-center gap-1"><CalendarDays size={14} /> {formatTime(e._d)}</span>
                    {e.location && <span className="inline-flex items-center gap-1 user-text"><MapPin size={14} /> {e.location}</span>}
                  </p>
                </li>
              ))}
            </ul>
          ) : <p className="mt-4 text-ink-muted">Nothing scheduled.</p>}
        </section>
      </div>

      <section className="card p-5 sm:p-6">
        <h2 className="display-md">Vaishnava observances</h2>
        <p className="mt-1 text-ink-muted">Exact dates change each year with the lunar calendar. FOLK Vizag announces each one as an event.</p>
        <ul className="mt-5 grid gap-x-8 gap-y-4 sm:grid-cols-2">
          {OBSERVANCES.map(([t, b]) => (
            <li key={t}><p className="font-display font-bold">{t}</p><p className="text-ink-muted">{b}</p></li>
          ))}
        </ul>
      </section>
    </div>
  );
};

export default Calendar;
