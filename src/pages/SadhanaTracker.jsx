import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Flame, Trophy, CalendarCheck, Minus, Plus, CheckCircle2, Lock, Soup, MapPinCheck } from 'lucide-react';
import { collection, doc, getDoc, getDocs, query, where, orderBy, limit, runTransaction, serverTimestamp } from 'firebase/firestore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { useAuth } from '../hooks/useAuth';
import { db } from '../lib/firebase';
import { todayIST, yesterdayIST, dateKeyIST, toDate, formatDay } from '../lib/dates';
import { ROUNDS_TARGET } from '../content/journey';

const TARGET_OPTIONS = [4, 8, 12, 16, 20, 24, 32, 64];
const MAX_ROUNDS = 200;

const byNewest = (field) => (a, b) => (toDate(b[field])?.getTime() || 0) - (toDate(a[field])?.getTime() || 0);

const Stat = ({ icon: Icon, value, label, tone }) => (
  <div className="card p-4 sm:p-5 flex items-center gap-4">
    <span className={`w-11 h-11 rounded-md inline-flex items-center justify-center ${tone}`}><Icon size={22} aria-hidden="true" /></span>
    <span>
      <span className="block font-display text-2xl sm:text-3xl font-extrabold leading-none">{value}</span>
      <span className="text-[14px] text-ink-muted">{label}</span>
    </span>
  </div>
);

const SadhanaTracker = () => {
  const { user } = useAuth();
  const today = todayIST();
  const isStaff = user?.role === 'admin' || user?.role === 'folks_head';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null); // { tone: 'ok'|'err', text }
  const [profile, setProfile] = useState({ streak: 0, longestStreak: 0, lastSadhanaDate: null });
  const [logs, setLogs] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [prasadam, setPrasadam] = useState([]);
  const [rounds, setRounds] = useState(0);
  const [target, setTarget] = useState(ROUNDS_TARGET);

  const load = useCallback(async () => {
    if (!user?.uid) return;
    try {
      const uSnap = await getDoc(doc(db, 'users', user.uid));
      const u = uSnap.data() || {};
      // A streak only counts while unbroken: target last met today or yesterday.
      const lastDone = u.lastCompletedDate || ((u.streak || 0) > 0 ? u.lastSadhanaDate : null);
      const alive = lastDone === today || lastDone === yesterdayIST();
      setProfile({ streak: alive ? (u.streak || 0) : 0, longestStreak: u.longestStreak || 0, lastSadhanaDate: u.lastSadhanaDate || null });
      if (u.sadhanaTarget) setTarget(Number(u.sadhanaTarget) || ROUNDS_TARGET);

      let recent = [];
      try {
        const snap = await getDocs(query(collection(db, 'sadhana_logs'), where('userId', '==', user.uid), orderBy('date', 'desc'), limit(14)));
        recent = snap.docs.map((d) => d.data());
      } catch (e) {
        // Composite index still building: fall back to an unordered read.
        const snap = await getDocs(query(collection(db, 'sadhana_logs'), where('userId', '==', user.uid), limit(30)));
        recent = snap.docs.map((d) => d.data()).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 14);
      }
      setLogs(recent);
      const todays = recent.find((l) => l.date === today);
      if (todays) {
        setRounds(Number(todays.roundsCompleted) || 0);
        setTarget(Number(todays.target) || ROUNDS_TARGET);
      }

      const [att, pras] = await Promise.allSettled([
        getDocs(query(collection(db, 'attendance'), where('userId', '==', user.uid))),
        getDocs(query(collection(db, 'prasadam_logs'), where('userId', '==', user.uid))),
      ]);
      if (att.status === 'fulfilled') setAttendance(att.value.docs.map((d) => ({ id: d.id, ...d.data() })).sort(byNewest('createdAt')).slice(0, 6));
      if (pras.status === 'fulfilled') setPrasadam(pras.value.docs.map((d) => ({ id: d.id, ...d.data() })).sort(byNewest('timestamp')).slice(0, 6));
    } catch (error) {
      console.error('Sadhana load failed:', error);
      setNotice({ tone: 'err', text: 'Could not load your sadhana right now. Check your connection and try again.' });
    } finally {
      setLoading(false);
    }
  }, [user?.uid, today]);

  useEffect(() => { load(); }, [load]);

  const todayLog = logs.find((l) => l.date === today) || null;
  const targetLocked = !!todayLog;
  const effectiveTarget = isStaff ? ROUNDS_TARGET : target;

  const save = async (e) => {
    e.preventDefault();
    const n = Number(rounds);
    if (!Number.isInteger(n) || n < 0 || n > MAX_ROUNDS) {
      setNotice({ tone: 'err', text: `Enter a whole number of rounds between 0 and ${MAX_ROUNDS}.` });
      return;
    }
    setSaving(true);
    setNotice(null);
    const logRef = doc(db, 'sadhana_logs', `${user.uid}_${today}`);
    const userRef = doc(db, 'users', user.uid);
    const yesterday = yesterdayIST();
    try {
      const result = await runTransaction(db, async (t) => {
        const [uDoc, lDoc] = [await t.get(userRef), await t.get(logRef)];
        const u = uDoc.data() || {};
        const old = lDoc.exists() ? lDoc.data() : null;
        // The day's target is fixed the first time you log it.
        const dayTarget = isStaff ? ROUNDS_TARGET : (old?.target || effectiveTarget);
        const done = n >= dayTarget;

        // Streak = consecutive days the target was met, ending on
        // lastCompletedDate. A partial log in the morning must not break it
        // (the old code reset it to 0), and editing today's count down undoes
        // only today. Older profiles lack lastCompletedDate; for them a
        // positive streak always ended on lastSadhanaDate.
        const lastDone = u.lastCompletedDate || ((u.streak || 0) > 0 ? u.lastSadhanaDate : null);
        const base = lastDone === today ? Math.max(0, (u.streak || 0) - 1)
          : lastDone === yesterday ? (u.streak || 0)
          : 0;
        const streak = done ? base + 1 : base;
        const lastCompletedDate = done ? today : (lastDone === today ? (base > 0 ? yesterday : null) : lastDone || null);

        const bonuses = new Set(old?.bonusClaimed || []);
        let score = n * 2 + (done ? 10 : 0);
        for (const [len, pts] of [[3, 20], [7, 50], [30, 200]]) {
          if (done && streak === len && !bonuses.has(len)) { score += pts; bonuses.add(len); }
        }
        const scoreDiff = score - (old?.score || 0);

        const logData = {
          userId: user.uid,
          date: today,
          target: dayTarget,
          roundsCompleted: n,
          progressPercentage: Math.min(100, Math.round((n / dayTarget) * 100)),
          streak,
          score,
          completed: done,
          bonusClaimed: [...bonuses],
          status: 'locked',
          updatedAt: serverTimestamp(),
        };
        if (old) t.update(logRef, logData);
        else t.set(logRef, { ...logData, createdAt: serverTimestamp() });

        t.update(userRef, {
          streak,
          longestStreak: Math.max(u.longestStreak || 0, streak),
          score: Math.max(0, (u.score || 0) + scoreDiff),
          lastSadhanaDate: today,
          lastCompletedDate,
          sadhanaTarget: dayTarget,
          updatedAt: serverTimestamp(),
        });
        return { done, firstCompletion: done && !old?.completed, streak };
      });
      setNotice({
        tone: 'ok',
        text: result.firstCompletion
          ? `Target reached. That's ${result.streak} day${result.streak === 1 ? '' : 's'} in a row. Jaya!`
          : 'Saved.',
      });
      await load();
    } catch (error) {
      console.error('Sadhana save failed:', error);
      setNotice({ tone: 'err', text: 'Could not save. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const chart = useMemo(() => {
    const byDate = new Map(logs.map((l) => [l.date, l]));
    return Array.from({ length: 14 }, (_, i) => {
      const d = new Date(Date.now() - (13 - i) * 86400000);
      const key = dateKeyIST(d);
      const l = byDate.get(key);
      return {
        key,
        day: d.toLocaleDateString('en-IN', { weekday: 'short', timeZone: 'Asia/Kolkata' }).slice(0, 2),
        rounds: l ? Number(l.roundsCompleted) || 0 : 0,
        done: !!l?.completed,
      };
    });
  }, [logs]);
  const daysDone = chart.filter((c) => c.done).length;

  if (loading) {
    return (
      <div className="space-y-5" aria-busy="true" aria-label="Loading sadhana">
        <div className="grid gap-4 sm:grid-cols-3">{[0, 1, 2].map((i) => <div key={i} className="h-24 card animate-pulse" />)}</div>
        <div className="h-72 card animate-pulse" />
      </div>
    );
  }

  const pct = Math.min(100, Math.round((Number(rounds) / effectiveTarget) * 100)) || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="display-lg">Sadhana</h1>
        <p className="mt-1 text-ink-muted">Log your chanting every day. Small, steady steps build a strong practice.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat icon={Flame} value={profile.streak} label="day streak" tone="bg-saffron-50 text-saffron" />
        <Stat icon={Trophy} value={profile.longestStreak} label="best streak" tone="bg-marigold/15 text-marigold-dark" />
        <Stat icon={CalendarCheck} value={`${daysDone}/14`} label="days on target" tone="bg-navy-50 text-navy-700" />
      </div>

      <div className="grid gap-5 lg:grid-cols-5">
        {/* Today */}
        <form onSubmit={save} className="card p-5 sm:p-6 lg:col-span-2 flex flex-col">
          <h2 className="font-sans text-[13px] font-bold uppercase tracking-label text-ink-muted">Today · {formatDay(new Date())}</h2>

          <label className="mt-5 block">
            <span className="block text-[15px] font-semibold">Rounds chanted</span>
            <div className="mt-2 flex items-stretch gap-2">
              <button type="button" onClick={() => setRounds((r) => Math.max(0, Number(r) - 1))} className="w-14 h-14 rounded-md border border-line inline-flex items-center justify-center hover:bg-paper" aria-label="One round less"><Minus size={20} /></button>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                max={MAX_ROUNDS}
                value={rounds}
                onChange={(e) => setRounds(e.target.value === '' ? '' : Math.max(0, Math.min(MAX_ROUNDS, parseInt(e.target.value, 10) || 0)))}
                className="flex-1 min-w-0 h-14 rounded-md border border-line text-center font-display text-3xl font-extrabold focus:border-navy focus:ring-2 focus:ring-navy/15 outline-none"
              />
              <button type="button" onClick={() => setRounds((r) => Math.min(MAX_ROUNDS, Number(r) + 1))} className="w-14 h-14 rounded-md border border-line inline-flex items-center justify-center hover:bg-paper" aria-label="One round more"><Plus size={20} /></button>
            </div>
          </label>

          <div className="mt-5">
            <span className="flex items-center justify-between text-[15px] font-semibold">
              Today&apos;s target
              {(targetLocked || isStaff) && <span className="inline-flex items-center gap-1 text-[13px] font-normal text-ink-muted"><Lock size={13} /> {isStaff ? 'Fixed for staff' : 'Set for today'}</span>}
            </span>
            {targetLocked || isStaff ? (
              <p className="mt-2 font-display text-xl font-bold">{effectiveTarget} rounds</p>
            ) : (
              <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label="Target rounds">
                {TARGET_OPTIONS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    role="radio"
                    aria-checked={target === t}
                    onClick={() => setTarget(t)}
                    className={`h-10 min-w-[3rem] px-3 rounded-md border font-display font-bold ${target === t ? 'border-navy bg-navy text-white' : 'border-line hover:bg-paper'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="mt-6 h-3 rounded-full bg-paper overflow-hidden" aria-hidden="true">
            <div className={`h-full rounded-full ${pct >= 100 ? 'bg-green-600' : 'bg-saffron'}`} style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-2 text-[14px] text-ink-muted">{pct}% of today&apos;s target</p>

          {notice && (
            <p role={notice.tone === 'err' ? 'alert' : 'status'} className={`mt-4 flex gap-2 rounded-md px-3 py-2.5 text-[15px] ${notice.tone === 'err' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-800'}`}>
              {notice.tone === 'ok' && <CheckCircle2 size={18} className="mt-0.5 shrink-0" />}{notice.text}
            </p>
          )}

          <button type="submit" disabled={saving || rounds === ''} className="btn-primary mt-auto pt-0 w-full" style={{ marginTop: '1.5rem' }}>
            {saving ? 'Saving…' : todayLog ? 'Update today' : 'Save today'}
          </button>
        </form>

        {/* Last 14 days */}
        <section className="card p-5 sm:p-6 lg:col-span-3">
          <h2 className="font-sans text-[13px] font-bold uppercase tracking-label text-ink-muted">Last 14 days</h2>
          <div className="mt-4 h-64" role="img" aria-label={`Rounds per day over the last 14 days; on target ${daysDone} of 14 days`}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chart} margin={{ top: 8, right: 4, left: -24, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="#E3DDD1" />
                <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: '#5B6170', fontSize: 12 }} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: '#5B6170', fontSize: 12 }} domain={[0, (max) => Math.max(max, effectiveTarget)]} />
                <Tooltip
                  cursor={{ fill: 'rgba(16,18,23,0.04)' }}
                  formatter={(v) => [`${v} rounds`, '']}
                  labelFormatter={(_, p) => (p?.[0]?.payload?.key ? formatDay(new Date(`${p[0].payload.key}T12:00:00+05:30`)) : '')}
                  contentStyle={{ borderRadius: 8, border: '1px solid #E3DDD1' }}
                />
                <ReferenceLine y={effectiveTarget} stroke="#032B7C" strokeDasharray="4 4" />
                <Bar dataKey="rounds" radius={[4, 4, 0, 0]} maxBarSize={28} isAnimationActive={false}>
                  {chart.map((c) => <Cell key={c.key} fill={c.done ? '#16A34A' : c.rounds > 0 ? '#E4702A' : '#E3DDD1'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 flex flex-wrap gap-4 text-[13px] text-ink-muted">
            <span className="inline-flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-green-600" /> On target</span>
            <span className="inline-flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-saffron" /> Below target</span>
            <span className="inline-flex items-center gap-1.5"><span className="w-4 border-t-2 border-dashed border-navy-700" /> Target</span>
          </div>
        </section>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <section className="card p-5 sm:p-6">
          <h2 className="font-sans text-[13px] font-bold uppercase tracking-label text-ink-muted">Programs attended</h2>
          {attendance.length ? (
            <ul className="mt-3 divide-y divide-line">
              {attendance.map((a) => (
                <li key={a.id} className="py-3 flex items-center justify-between gap-3">
                  <span className="flex items-center gap-3 min-w-0"><MapPinCheck size={18} className="text-green-700 shrink-0" /><span className="truncate">{a.session || a.eventTitle || 'Program'}</span></span>
                  <span className="shrink-0 text-[14px] text-ink-muted">{formatDay(toDate(a.createdAt || a.timestamp))}</span>
                </li>
              ))}
            </ul>
          ) : <p className="mt-3 text-ink-muted">Your check-ins at programs will show up here.</p>}
        </section>
        <section className="card p-5 sm:p-6">
          <h2 className="font-sans text-[13px] font-bold uppercase tracking-label text-ink-muted">Prasadam</h2>
          {prasadam.length ? (
            <ul className="mt-3 divide-y divide-line">
              {prasadam.map((p) => (
                <li key={p.id} className="py-3 flex items-center justify-between gap-3">
                  <span className="flex items-center gap-3 min-w-0"><Soup size={18} className="text-saffron shrink-0" /><span className="truncate">{p.session || p.meal || 'Prasadam'}</span></span>
                  <span className="shrink-0 text-[14px] text-ink-muted">{formatDay(toDate(p.timestamp || p.createdAt))}</span>
                </li>
              ))}
            </ul>
          ) : <p className="mt-3 text-ink-muted">Meals scanned at the prasadam counter will show up here.</p>}
        </section>
      </div>
    </div>
  );
};

export default SadhanaTracker;
