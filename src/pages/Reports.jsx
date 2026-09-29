import React, { useMemo, useState } from 'react';
import { Download, Send, Copy, Users, UserPlus, Flame, CalendarCheck, UserX, Cake } from 'lucide-react';
import { orderBy, where, Timestamp } from 'firebase/firestore';
import { useAuth } from '../hooks/useAuth';
import { useMembers } from '../hooks/useMembers';
import { useFirestore } from '../hooks/useFirestore';
import { callApi } from '../lib/api';
import { STAGES } from '../content/journey';
import { todayIST, daysBetween, toDate } from '../lib/dates';
import { normalizePhone } from '../lib/phone';
import { Field, inputClass } from '../components/ui/Modal';

const PERIODS = [['7', 'Last 7 days'], ['30', 'Last 30 days'], ['90', 'Last 90 days']];

const Tile = ({ icon: Icon, value, label, tone }) => (
  <div className="card p-4 flex items-center gap-3">
    <span className={`w-10 h-10 rounded-md inline-flex items-center justify-center ${tone}`}><Icon size={20} /></span>
    <span><span className="block font-display text-2xl font-extrabold leading-none">{value}</span><span className="text-[13px] text-ink-muted">{label}</span></span>
  </div>
);

const Bar = ({ label, value, max }) => (
  <li className="grid grid-cols-[8rem_1fr_2.5rem] items-center gap-3 text-[15px]">
    <span className="truncate">{label}</span>
    <span className="h-3 rounded-full bg-paper overflow-hidden"><span className="block h-full bg-navy" style={{ width: `${max ? (value / max) * 100 : 0}%` }} /></span>
    <span className="text-right font-display font-bold">{value}</span>
  </li>
);

const csvDownload = (name, rows) => {
  const csv = rows.map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
  const url = URL.createObjectURL(new Blob([String.fromCharCode(0xFEFF) + csv], { type: 'text/csv;charset=utf-8;' }));
  Object.assign(document.createElement('a'), { href: url, download: name }).click();
  URL.revokeObjectURL(url);
};

const Reports = () => {
  const { user: me } = useAuth();
  const isAdmin = me?.role === 'admin';
  const { members, staff, loading } = useMembers();
  const [period, setPeriod] = useState('30');
  const days = Number(period);
  const today = todayIST();
  const since = useMemo(() => new Date(Date.now() - days * 86400000), [days]);

  const attQ = useMemo(() => [where('createdAt', '>=', Timestamp.fromDate(since)), orderBy('createdAt', 'desc')], [since]);
  const { data: attendance } = useFirestore('attendance', attQ);
  const fuQ = useMemo(() => [where('createdAt', '>=', Timestamp.fromDate(since))], [since]);
  const { data: followups } = useFirestore('followups', fuQ);

  // A guide sees their own members; an admin sees everyone.
  const scope = useMemo(() => (isAdmin ? members : members.filter((m) => m.guideId === me?.uid)), [members, isAdmin, me?.uid]);
  const people = scope.filter((m) => !m.isStaff);

  const stats = useMemo(() => {
    const byStage = STAGES.map((s) => ({ label: s.label, value: people.filter((m) => m.stage === s.id).length }));
    const newcomers = people.filter((m) => { const d = toDate(m.createdAt); return d && d >= since; });
    const chanting = people.filter((m) => m.lastSadhanaDate && daysBetween(m.lastSadhanaDate, today) <= 7);
    const noGuide = people.filter((m) => !m.guideId);
    const scopeIds = new Set(scope.map((m) => m.id));
    const checkins = attendance.filter((a) => isAdmin || scopeIds.has(a.userId));
    const perProgram = new Map();
    for (const a of checkins) {
      const k = a.session || a.eventTitle || 'Program';
      perProgram.set(k, (perProgram.get(k) || 0) + 1);
    }
    const programs = [...perProgram.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
    const birthdays = people.filter((m) => /^\d{4}-\d{2}-\d{2}$/.test(m.dob || '') && m.dob.slice(5, 7) === today.slice(5, 7))
      .sort((a, b) => a.dob.slice(8).localeCompare(b.dob.slice(8)));
    const guides = staff.map((g) => {
      const theirs = members.filter((m) => m.guideId === g.id && !m.isStaff);
      return {
        id: g.id,
        name: g.displayName,
        members: theirs.length,
        quiet: theirs.filter((m) => !m.lastSadhanaDate || daysBetween(m.lastSadhanaDate, today) >= 7).length,
        followups: followups.filter((f) => f.guideId === g.id).length,
      };
    }).filter((g) => g.members > 0 || g.followups > 0).sort((a, b) => b.members - a.members);
    return { byStage, newcomers, chanting, noGuide, checkins, programs, birthdays, guides };
  }, [people, scope, attendance, followups, staff, members, since, today, isAdmin]);

  const exportReport = () => csvDownload(`folk-report-${today}.csv`, [
    ['FOLK Vizag report', `${PERIODS.find((p) => p[0] === period)[1]} to ${today}`],
    [],
    ['Members', people.length], ['New in period', stats.newcomers.length], ['Chanted in last 7 days', stats.chanting.length],
    ['Without a guide', stats.noGuide.length], ['Program check-ins', stats.checkins.length],
    [], ['Stage', 'Members'], ...stats.byStage.map((s) => [s.label, s.value]),
    [], ['Program', 'Check-ins'], ...stats.programs,
    [], ['Guide', 'Members', 'Quiet 7+ days', 'Follow-ups logged'], ...stats.guides.map((g) => [g.name, g.members, g.quiet, g.followups]),
  ]);

  /* ---------------- Broadcast ---------------- */
  const [audience, setAudience] = useState(isAdmin ? 'all' : 'mine');
  const [stage, setStage] = useState('new');
  const [templateId, setTemplateId] = useState('');
  const [params, setParams] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  const recipients = useMemo(() => {
    const base = audience === 'mine' ? members.filter((m) => m.guideId === me?.uid) : members;
    return base.filter((m) => !m.isStaff && (audience !== 'stage' || m.stage === stage) && /^91\d{10}$/.test(normalizePhone(m.phone)));
  }, [audience, stage, members, me?.uid]);

  const send = async (e) => {
    e.preventDefault();
    if (!templateId.trim()) return;
    if (!window.confirm(`Send this WhatsApp template to ${recipients.length} people?`)) return;
    setSending(true);
    setResult(null);
    try {
      const r = await callApi('broadcast', {
        audience: audience === 'stage' ? { type: 'stage', stage } : { type: audience },
        templateId: templateId.trim(),
        params: params.split('|').map((p) => p.trim()).filter(Boolean),
      });
      setResult({ tone: 'ok', text: `Sent to ${r.sent} of ${r.total}${r.failed ? ` (${r.failed} failed)` : ''}.` });
    } catch (err) {
      setResult({ tone: 'err', text: err.message || 'Could not send the broadcast.' });
    } finally {
      setSending(false);
    }
  };

  const copyNumbers = async () => {
    const list = recipients.map((m) => `+${normalizePhone(m.phone)}`).join('\n');
    try { await navigator.clipboard.writeText(list); setResult({ tone: 'ok', text: `Copied ${recipients.length} numbers.` }); }
    catch { setResult({ tone: 'err', text: 'Could not copy. Your browser blocked clipboard access.' }); }
  };

  const maxStage = Math.max(1, ...stats.byStage.map((s) => s.value));
  const maxProgram = Math.max(1, ...stats.programs.map((p) => p[1]));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="display-lg">Reports</h1>
          <p className="mt-1 text-ink-muted">{isAdmin ? 'All of FOLK Vizag.' : 'Your members.'} Generated from live data.</p>
        </div>
        <div className="flex gap-2">
          <select aria-label="Period" className={`${inputClass} w-auto`} value={period} onChange={(e) => setPeriod(e.target.value)}>
            {PERIODS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <button type="button" onClick={exportReport} className="btn border border-line bg-white text-ink hover:bg-paper normal-case tracking-normal text-[14px]"><Download size={16} /> CSV</button>
        </div>
      </div>

      {loading ? <div className="card h-40 animate-pulse" /> : (
        <>
          <div className="grid gap-3 grid-cols-2 lg:grid-cols-5">
            <Tile icon={Users} value={people.length} label="members" tone="bg-navy-50 text-navy-700" />
            <Tile icon={UserPlus} value={stats.newcomers.length} label="new in period" tone="bg-green-50 text-green-700" />
            <Tile icon={Flame} value={stats.chanting.length} label="chanted this week" tone="bg-saffron-50 text-saffron" />
            <Tile icon={CalendarCheck} value={stats.checkins.length} label="program check-ins" tone="bg-marigold/15 text-marigold-dark" />
            <Tile icon={UserX} value={stats.noGuide.length} label="without a guide" tone="bg-red-50 text-red-700" />
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <section className="card p-5 sm:p-6">
              <h2 className="font-display text-[13px] font-bold uppercase tracking-label text-ink-muted">Members by stage</h2>
              <ul className="mt-4 space-y-3">{stats.byStage.map((s) => <Bar key={s.label} label={s.label} value={s.value} max={maxStage} />)}</ul>
            </section>
            <section className="card p-5 sm:p-6">
              <h2 className="font-display text-[13px] font-bold uppercase tracking-label text-ink-muted">Check-ins by program</h2>
              {stats.programs.length
                ? <ul className="mt-4 space-y-3">{stats.programs.map(([k, v]) => <Bar key={k} label={k} value={v} max={maxProgram} />)}</ul>
                : <p className="mt-4 text-ink-muted">No check-ins in this period.</p>}
            </section>
          </div>

          {isAdmin && stats.guides.length > 0 && (
            <section className="card overflow-hidden">
              <h2 className="px-5 sm:px-6 pt-5 font-display text-[13px] font-bold uppercase tracking-label text-ink-muted">FOLK guides</h2>
              <div className="overflow-x-auto">
                <table className="mt-3 w-full text-left text-[15px]">
                  <thead className="bg-paper text-[13px] font-display font-bold uppercase tracking-label text-ink-muted">
                    <tr><th className="px-5 py-2.5">Guide</th><th className="px-3 py-2.5 text-right">Members</th><th className="px-3 py-2.5 text-right">Quiet 7+ days</th><th className="px-5 py-2.5 text-right">Follow-ups</th></tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {stats.guides.map((g) => (
                      <tr key={g.id}><td className="px-5 py-3 font-semibold">{g.name}</td><td className="px-3 py-3 text-right">{g.members}</td><td className={`px-3 py-3 text-right ${g.quiet ? 'text-red-700' : ''}`}>{g.quiet}</td><td className="px-5 py-3 text-right">{g.followups}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {stats.birthdays.length > 0 && (
            <section className="card p-5 sm:p-6">
              <h2 className="font-display text-[13px] font-bold uppercase tracking-label text-ink-muted">Birthdays this month</h2>
              <ul className="mt-3 flex flex-wrap gap-2">
                {stats.birthdays.map((m) => (
                  <li key={m.id} className="inline-flex items-center gap-2 h-9 px-3 rounded-full border border-line text-[14px]">
                    <Cake size={15} className="text-marigold-dark" /> {m.displayName} · {Number(m.dob.slice(8))} {new Date(`${m.dob}T12:00:00`).toLocaleDateString('en-IN', { month: 'short' })}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}

      <section className="card p-5 sm:p-6">
        <h2 className="display-md">WhatsApp broadcast</h2>
        <p className="mt-1 text-ink-muted">Sends an approved WhatsApp template (from your Gupshup account) to a group. The server checks who you&apos;re allowed to message.</p>
        <form onSubmit={send} className="mt-5 grid gap-4 lg:grid-cols-2">
          <div className="space-y-4">
            <Field label="Send to">
              <select className={inputClass} value={audience} onChange={(e) => setAudience(e.target.value)}>
                <option value="mine">My members</option>
                {isAdmin && <option value="all">All members</option>}
                {isAdmin && <option value="stage">Members at a stage</option>}
              </select>
            </Field>
            {audience === 'stage' && (
              <Field label="Stage">
                <select className={inputClass} value={stage} onChange={(e) => setStage(e.target.value)}>
                  {STAGES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
              </Field>
            )}
            <p className="text-[15px]"><span className="font-display font-bold">{recipients.length}</span> people with a valid mobile number.</p>
          </div>
          <div className="space-y-4">
            <Field label="Template ID" hint="The approved template's ID in Gupshup."><input className={inputClass} value={templateId} onChange={(e) => setTemplateId(e.target.value)} placeholder="e.g. weekly_program_reminder" /></Field>
            <Field label="Template values" hint="Separate values with |, in the template's order."><input className={inputClass} value={params} onChange={(e) => setParams(e.target.value)} placeholder="Sunday feast | 6 pm | Temple hall" /></Field>
          </div>
          {result && <p role={result.tone === 'err' ? 'alert' : 'status'} className={`lg:col-span-2 rounded-md px-4 py-3 ${result.tone === 'err' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-800'}`}>{result.text}</p>}
          <div className="lg:col-span-2 flex flex-wrap gap-2">
            <button type="submit" disabled={sending || !templateId.trim() || recipients.length === 0} className="btn-primary"><Send size={17} /> {sending ? 'Sending…' : `Send to ${recipients.length}`}</button>
            <button type="button" onClick={copyNumbers} disabled={!recipients.length} className="btn border border-line text-ink hover:bg-paper normal-case tracking-normal text-[14px]"><Copy size={16} /> Copy numbers</button>
          </div>
        </form>
      </section>
    </div>
  );
};

export default Reports;
