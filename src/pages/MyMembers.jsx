import React, { useMemo, useState } from 'react';
import { MessageCircle, Phone, NotebookPen, Cake, AlertTriangle, Flame, CalendarCheck, Users, History } from 'lucide-react';
import { collection, doc, orderBy, limit, where, serverTimestamp, writeBatch } from 'firebase/firestore';
import { useAuth } from '../hooks/useAuth';
import { useMembers } from '../hooks/useMembers';
import { useFirestore } from '../hooks/useFirestore';
import { db } from '../lib/firebase';
import { STAGES, stageLabel } from '../content/journey';
import { todayIST, daysBetween, dateKeyIST, toDate, formatDay } from '../lib/dates';
import { formatPhone, whatsappUrl, telUrl } from '../lib/phone';
import Modal, { Field, inputClass, textareaClass } from '../components/ui/Modal';

const CHANNELS = ['Call', 'WhatsApp', 'Met at program', 'Home visit'];
const addDays = (key, n) => dateKeyIST(new Date(Date.parse(`${key}T12:00:00+05:30`) + n * 86400000));

/** Days until the next birthday (0 = today), or null without a date of birth. */
const daysToBirthday = (dob, today) => {
  const m = /^\d{4}-(\d{2})-(\d{2})$/.exec(dob || '');
  if (!m) return null;
  const y = Number(today.slice(0, 4));
  for (const year of [y, y + 1]) {
    const d = daysBetween(today, `${year}-${m[1]}-${m[2]}`);
    if (d !== null && d >= 0) return d;
  }
  return null;
};

const Tile = ({ icon: Icon, value, label, tone }) => (
  <div className="card p-4 flex items-center gap-3">
    <span className={`w-10 h-10 rounded-md inline-flex items-center justify-center ${tone}`}><Icon size={20} /></span>
    <span><span className="block font-display text-2xl font-extrabold leading-none">{value}</span><span className="text-[13px] text-ink-muted">{label}</span></span>
  </div>
);

const History_ = ({ memberId }) => {
  const q = useMemo(() => [where('memberId', '==', memberId)], [memberId]);
  const { data, loading } = useFirestore('followups', q);
  const items = data.slice().sort((a, b) => (toDate(b.createdAt)?.getTime() || 0) - (toDate(a.createdAt)?.getTime() || 0));
  if (loading) return <div className="h-20 rounded-md bg-paper animate-pulse" />;
  if (!items.length) return <p className="text-ink-muted">No follow-ups logged yet.</p>;
  return (
    <ol className="space-y-4">
      {items.map((f) => (
        <li key={f.id} className="border-l-2 border-line pl-4">
          <p className="text-[13px] text-ink-muted">{formatDay(toDate(f.createdAt))} · {f.channel} · {f.guideName || 'Team'}</p>
          <p className="mt-0.5 user-text">{f.note}</p>
          {f.nextDate && <p className="text-[13px] text-ink-muted mt-0.5">Next follow-up: {formatDay(new Date(`${f.nextDate}T12:00:00+05:30`))}</p>}
        </li>
      ))}
    </ol>
  );
};

const MyMembers = () => {
  const { user: me } = useAuth();
  const isAdmin = me?.role === 'admin';
  const { members, staff, loading } = useMembers();
  const [guideId, setGuideId] = useState(me?.uid || '');
  const [view, setView] = useState('attention');
  const [logFor, setLogFor] = useState(null);
  const [historyFor, setHistoryFor] = useState(null);
  const [form, setForm] = useState({ channel: 'Call', note: '', nextDate: '', stage: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // Recent check-ins, to know when each member was last seen at a program.
  const attQ = useMemo(() => [orderBy('createdAt', 'desc'), limit(1500)], []);
  const { data: attendance } = useFirestore('attendance', attQ);
  const lastSeen = useMemo(() => {
    const map = new Map();
    for (const a of attendance) {
      const d = toDate(a.createdAt || a.timestamp);
      const id = a.userId || a.uid;
      if (d && id && !map.has(id)) map.set(id, dateKeyIST(d));
    }
    return map;
  }, [attendance]);

  const today = todayIST();
  const mine = useMemo(() => members.filter((m) => m.guideId === guideId && m.id !== guideId), [members, guideId]);

  const rows = useMemo(() => mine.map((m) => {
    const chantGap = m.lastSadhanaDate ? daysBetween(m.lastSadhanaDate, today) : null;
    const seen = lastSeen.get(m.id) || null;
    const seenGap = seen ? daysBetween(seen, today) : null;
    const followDue = m.nextFollowUpDate && m.nextFollowUpDate <= today;
    const reasons = [];
    if (followDue) reasons.push({ text: `Follow-up due${m.nextFollowUpDate < today ? ` (${daysBetween(m.nextFollowUpDate, today)}d overdue)` : ' today'}`, weight: 3 });
    if (chantGap === null) reasons.push({ text: 'Has never logged chanting', weight: 1 });
    else if (chantGap >= 7) reasons.push({ text: `No chanting logged for ${chantGap} days`, weight: 2 });
    if (seenGap === null) reasons.push({ text: 'Not checked in at a program yet', weight: 1 });
    else if (seenGap >= 21) reasons.push({ text: `Not at a program for ${seenGap} days`, weight: 2 });
    // A guide who just spoke to them and scheduled the next follow-up has
    // it in hand: keep them off the attention list until that date.
    const lastFollowUp = toDate(m.lastFollowUpAt);
    const snoozed = !followDue && m.nextFollowUpDate && m.nextFollowUpDate > today
      && lastFollowUp && Date.now() - lastFollowUp.getTime() < 14 * 86400000;
    const score = snoozed ? 0 : reasons.reduce((s, r) => s + r.weight, 0);
    return { ...m, chantGap, seen, seenGap, reasons, score, snoozed, bday: daysToBirthday(m.dob, today) };
  }), [mine, lastSeen, today]);

  const attention = rows.filter((r) => r.score >= 2).sort((a, b) => b.score - a.score);
  const birthdays = rows.filter((r) => r.bday !== null && r.bday <= 7).sort((a, b) => a.bday - b.bday);
  const shown = view === 'attention' ? attention : rows;

  const openLog = (m) => {
    setError('');
    setForm({ channel: 'Call', note: '', nextDate: addDays(today, 7), stage: m.stage });
    setLogFor(m);
  };

  const saveLog = async (e) => {
    e.preventDefault();
    if (form.note.trim().length < 2) { setError('Add a short note about the conversation.'); return; }
    setBusy(true);
    setError('');
    try {
      // The follow-up record and the member's summary fields are written together.
      const batch = writeBatch(db);
      batch.set(doc(collection(db, 'followups')), {
        memberId: logFor.id,
        memberName: logFor.displayName,
        guideId: me.uid,
        guideName: me.name || me.displayName || 'Guide',
        channel: form.channel,
        note: form.note.trim().slice(0, 1500),
        nextDate: form.nextDate || null,
        createdAt: serverTimestamp(),
      });
      batch.update(doc(db, 'users', logFor.id), {
        lastFollowUpAt: serverTimestamp(),
        lastFollowUpNote: form.note.trim().slice(0, 200),
        nextFollowUpDate: form.nextDate || null,
        ...(form.stage && form.stage !== logFor.stage ? { stage: form.stage } : {}),
        updatedAt: serverTimestamp(),
      });
      await batch.commit();
      setLogFor(null);
    } catch (err) {
      console.error('Follow-up save failed:', err);
      setError(err.code === 'permission-denied' ? 'You can only log follow-ups for members, not staff.' : 'Could not save. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const guideName = staff.find((s) => s.id === guideId)?.displayName;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="display-lg">My members</h1>
          <p className="mt-1 text-ink-muted">{guideId === me?.uid ? 'People you guide.' : `Members guided by ${guideName || 'this guide'}.`} Reach out to anyone who has gone quiet.</p>
        </div>
        {isAdmin && (
          <select aria-label="Guide" className={`${inputClass} w-auto min-w-[14rem]`} value={guideId} onChange={(e) => setGuideId(e.target.value)}>
            {staff.map((s) => <option key={s.id} value={s.id}>{s.id === me?.uid ? 'Me' : s.displayName}</option>)}
          </select>
        )}
      </div>

      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <Tile icon={Users} value={rows.length} label="members" tone="bg-navy-50 text-navy-700" />
        <Tile icon={Flame} value={rows.filter((r) => r.chantGap !== null && r.chantGap <= 1).length} label="chanted today / yesterday" tone="bg-saffron-50 text-saffron" />
        <Tile icon={AlertTriangle} value={attention.length} label="need attention" tone="bg-red-50 text-red-700" />
        <Tile icon={Cake} value={birthdays.length} label="birthdays this week" tone="bg-marigold/15 text-marigold-dark" />
      </div>

      {birthdays.length > 0 && (
        <section className="card p-4 sm:p-5">
          <h2 className="font-sans text-[13px] font-bold uppercase tracking-label text-ink-muted">Birthdays</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {birthdays.map((b) => (
              <li key={b.id}>
                <a href={whatsappUrl(b.phone, `Hare Krishna ${b.displayName.split(' ')[0]}! Happy birthday from FOLK Vizag.`)} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 h-9 px-3 rounded-full border border-line hover:bg-paper text-[14px]">
                  <Cake size={15} className="text-marigold-dark" /> {b.displayName} · {b.bday === 0 ? 'today' : b.bday === 1 ? 'tomorrow' : `in ${b.bday} days`}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="flex p-1 bg-white border border-line rounded-md w-fit" role="tablist">
        {[['attention', `Needs attention (${attention.length})`], ['all', `All (${rows.length})`]].map(([k, l]) => (
          <button key={k} type="button" role="tab" aria-selected={view === k} onClick={() => setView(k)} className={`h-9 px-4 rounded text-[14px] font-semibold ${view === k ? 'bg-paper text-ink' : 'text-ink-muted'}`}>{l}</button>
        ))}
      </div>

      {loading ? <div className="card h-48 animate-pulse" /> : shown.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="font-display font-bold">{rows.length === 0 ? 'No members assigned yet' : 'Everyone is doing well'}</p>
          <p className="mt-1 text-ink-muted">{rows.length === 0 ? 'An admin assigns members to you from the Members page.' : 'Nobody needs a follow-up right now.'}</p>
        </div>
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2">
          {shown.map((m) => (
            <li key={m.id} className="card p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-display text-lg font-bold user-text">{m.displayName}</p>
                  <p className="text-[14px] text-ink-muted">{formatPhone(m.phone) || 'No phone'} · {stageLabel(m.stage)}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  {m.phone && <a href={whatsappUrl(m.phone, `Hare Krishna ${m.displayName.split(' ')[0]}!`)} target="_blank" rel="noopener noreferrer" aria-label={`WhatsApp ${m.displayName}`} className="w-10 h-10 inline-flex items-center justify-center rounded-md border border-line text-green-700 hover:bg-paper"><MessageCircle size={18} /></a>}
                  {m.phone && <a href={telUrl(m.phone)} aria-label={`Call ${m.displayName}`} className="w-10 h-10 inline-flex items-center justify-center rounded-md border border-line hover:bg-paper"><Phone size={18} /></a>}
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-[14px]">
                <span className="rounded-md bg-paper px-3 py-2"><Flame size={14} className="inline -mt-0.5 mr-1 text-saffron" />{m.chantGap === null ? 'Never chanted' : m.chantGap === 0 ? 'Chanted today' : `Chanted ${m.chantGap}d ago`}{m.streak ? ` · ${m.streak}d` : ''}</span>
                <span className="rounded-md bg-paper px-3 py-2"><CalendarCheck size={14} className="inline -mt-0.5 mr-1 text-navy-500" />{m.seenGap === null ? 'Never checked in' : m.seenGap === 0 ? 'At a program today' : `Program ${m.seenGap}d ago`}</span>
              </div>

              {m.reasons.length > 0 && view === 'attention' && (
                <ul className="mt-3 space-y-1 text-[14px] text-red-700">
                  {m.reasons.filter((r) => r.weight >= 2).map((r) => <li key={r.text} className="flex gap-2"><AlertTriangle size={15} className="mt-0.5 shrink-0" />{r.text}</li>)}
                </ul>
              )}
              {m.lastFollowUpNote && <p className="mt-3 text-[14px] text-ink-muted user-text">Last note: {m.lastFollowUpNote}</p>}
              {m.snoozed && <p className="mt-1 text-[14px] text-navy-700">Next follow-up {formatDay(new Date(`${m.nextFollowUpDate}T12:00:00+05:30`))}</p>}

              <div className="mt-4 flex gap-2">
                <button type="button" onClick={() => openLog(m)} className="btn-dark flex-1 min-h-[40px] normal-case tracking-normal text-[14px]"><NotebookPen size={16} /> Log follow-up</button>
                <button type="button" onClick={() => setHistoryFor(m)} className="btn border border-line text-ink hover:bg-paper min-h-[40px] normal-case tracking-normal text-[14px]"><History size={16} /> History</button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal open={!!logFor} onClose={() => setLogFor(null)} title={`Follow-up · ${logFor?.displayName || ''}`}
        footer={<>
          <button type="button" onClick={() => setLogFor(null)} className="btn border border-line text-ink hover:bg-paper">Cancel</button>
          <button type="submit" form="followup-form" disabled={busy} className="btn-primary">{busy ? 'Saving…' : 'Save'}</button>
        </>}>
        <form id="followup-form" onSubmit={saveLog} className="space-y-4">
          {error && <p role="alert" className="rounded-md bg-red-50 text-red-700 px-3 py-2">{error}</p>}
          <Field label="How did you connect?">
            <div className="flex flex-wrap gap-2">
              {CHANNELS.map((c) => (
                <button key={c} type="button" onClick={() => setForm((f) => ({ ...f, channel: c }))} aria-pressed={form.channel === c}
                  className={`h-9 px-3 rounded-full border text-[14px] font-semibold ${form.channel === c ? 'bg-navy text-white border-ink' : 'border-line hover:bg-paper'}`}>{c}</button>
              ))}
            </div>
          </Field>
          <Field label="Notes" hint="Only FOLK guides and admins can see these.">
            <textarea required className={textareaClass} value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} placeholder="How are they doing? Anything they need?" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Next follow-up"><input type="date" min={today} className={inputClass} value={form.nextDate} onChange={(e) => setForm((f) => ({ ...f, nextDate: e.target.value }))} /></Field>
            <Field label="Stage">
              <select className={inputClass} value={form.stage} onChange={(e) => setForm((f) => ({ ...f, stage: e.target.value }))}>
                {STAGES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </Field>
          </div>
        </form>
      </Modal>

      <Modal open={!!historyFor} onClose={() => setHistoryFor(null)} title={`History · ${historyFor?.displayName || ''}`}>
        {historyFor && <History_ memberId={historyFor.id} />}
      </Modal>
    </div>
  );
};

export default MyMembers;
