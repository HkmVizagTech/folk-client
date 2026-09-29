// Dates as the FOLK community lives them: India Standard Time.
// toISOString() is UTC, which puts everything between midnight and 05:30 IST
// on the previous day — exactly when people log their morning chanting.

const TZ = 'Asia/Kolkata';
const ymd = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' });

/** 'YYYY-MM-DD' in India for the given instant (default: now). */
export const dateKeyIST = (d = new Date()) => ymd.format(d);

export const todayIST = () => dateKeyIST(new Date());

export const yesterdayIST = () => dateKeyIST(new Date(Date.now() - 24 * 60 * 60 * 1000));

/** Days between two 'YYYY-MM-DD' keys (b - a). */
export const daysBetween = (a, b) => {
  const pa = Date.parse(`${a}T00:00:00Z`);
  const pb = Date.parse(`${b}T00:00:00Z`);
  return Number.isFinite(pa) && Number.isFinite(pb) ? Math.round((pb - pa) / 86400000) : null;
};

/** Firestore Timestamp | Date | string | number → Date (or null). */
export const toDate = (v) => {
  if (!v) return null;
  if (typeof v.toDate === 'function') return v.toDate();
  const d = v instanceof Date ? v : new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
};

export const greeting = (d = new Date()) => {
  const h = Number(new Intl.DateTimeFormat('en-IN', { timeZone: TZ, hour: 'numeric', hour12: false }).format(d));
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
};

export const formatDay = (d) =>
  d ? d.toLocaleDateString('en-IN', { timeZone: TZ, weekday: 'short', day: 'numeric', month: 'short' }) : '';

export const formatTime = (d) =>
  d ? d.toLocaleTimeString('en-IN', { timeZone: TZ, hour: 'numeric', minute: '2-digit' }) : '';
