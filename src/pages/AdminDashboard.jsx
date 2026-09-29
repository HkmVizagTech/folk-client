import React, { useEffect, useMemo, useState } from 'react';
import {
  QrCode, CalendarPlus, UserPlus, Send, Users, AlertTriangle, BedDouble, Building2, Compass, HandHeart,
  Inbox, MessageCircle, Check, ArrowRight, ShieldCheck, Server, Database,
} from 'lucide-react';
import { doc, orderBy, limit, where, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../hooks/useAuth';
import { useMembers } from '../hooks/useMembers';
import { useFirestore } from '../hooks/useFirestore';
import { db } from '../lib/firebase';
import { callApi } from '../lib/api';
import { toDate, todayIST, daysBetween, formatDay } from '../lib/dates';
import { whatsappUrl, formatPhone } from '../lib/phone';
import { provisionAdminLogin, validateAdminPassword } from '../lib/adminLogin';
import AdminPasswordFields from '../components/auth/AdminPasswordFields';

const Stat = ({ icon: Icon, value, label, onClick, tone = 'bg-navy-50 text-navy-700', alert }) => (
  <button type="button" onClick={onClick} className="card p-4 text-left flex items-center gap-3 hover:border-ink transition-colors">
    <span className={`w-10 h-10 rounded-md inline-flex items-center justify-center shrink-0 ${alert ? 'bg-red-50 text-red-700' : tone}`}><Icon size={20} /></span>
    <span className="min-w-0"><span className="block font-display text-2xl font-extrabold leading-none">{value}</span><span className="block text-[13px] text-ink-muted truncate">{label}</span></span>
  </button>
);

const Panel = ({ title, action, onAction, children, className = '' }) => (
  <section className={`card p-5 sm:p-6 ${className}`}>
    <div className="flex items-center justify-between gap-3">
      <h2 className="font-display text-[13px] font-bold uppercase tracking-label text-ink-muted">{title}</h2>
      {action && <button type="button" onClick={onAction} className="font-display text-[12px] font-bold uppercase tracking-label text-saffron hover:text-saffron-dark inline-flex items-center gap-1">{action} <ArrowRight size={14} /></button>}
    </div>
    <div className="mt-4">{children}</div>
  </section>
);

const AdminDashboard = ({ setActiveTab, onOpenScanner }) => {
  const { user: me } = useAuth();
  const isAdmin = me?.role === 'admin';
  const { members, staff, loading } = useMembers();
  const today = todayIST();

  const pendingReqQ = useMemo(() => [where('status', '==', 'Pending')], []);
  const { data: stayRequests } = useFirestore('accommodation_requests', pendingReqQ);
  const { data: hostelBookings } = useFirestore('hostel_bookings');
  const { data: tripRegs } = useFirestore('trip_registrations');
  const { data: sevas } = useFirestore('sevas');
  const { data: events } = useFirestore('events');
  const inboxQ = useMemo(() => [orderBy('createdAt', 'desc'), limit(20)], []);
  const { data: inbox } = useFirestore('contact_messages', inboxQ);

  const people = members.filter((m) => !m.isStaff);
  const newThisWeek = people.filter((m) => { const d = toDate(m.createdAt); return d && Date.now() - d.getTime() < 7 * 86400000; });
  const unassigned = people.filter((m) => !m.guideId)
    .sort((a, b) => (toDate(b.createdAt)?.getTime() || 0) - (toDate(a.createdAt)?.getTime() || 0));
  const mine = people.filter((m) => m.guideId === me?.uid);
  const followDue = mine.filter((m) => m.nextFollowUpDate && m.nextFollowUpDate <= today);
  const quietMine = mine.filter((m) => !m.lastSadhanaDate || daysBetween(m.lastSadhanaDate, today) >= 7);
  const newMessages = inbox.filter((m) => m.status === 'new');
  const pendingBookings = hostelBookings.filter((b) => String(b.status || '').toLowerCase() === 'pending');
  const pendingTrips = tripRegs.filter((r) => String(r.status || '').toLowerCase() === 'pending');
  const volunteers = sevas.reduce((n, s) => n + (s.countRegistered || 0), 0);
  const upcoming = events
    .map((e) => ({ ...e, _d: toDate(e.dateISO || e.date) }))
    .filter((e) => e._d && e._d.getTime() > Date.now() - 6 * 3600 * 1000)
    .sort((a, b) => a._d - b._d)
    .slice(0, 4);

  // Quick guide assignment for newcomers.
  const [assigning, setAssigning] = useState({});
  const assign = async (m, guideId) => {
    const g = staff.find((s) => s.id === guideId);
    if (!g) return;
    setAssigning((a) => ({ ...a, [m.id]: true }));
    try {
      await updateDoc(doc(db, 'users', m.id), { guideId: g.id, guideName: g.displayName, guidePhone: g.phone || '', updatedAt: serverTimestamp() });
    } catch (e) { console.error('Assign failed:', e); }
    finally { setAssigning((a) => ({ ...a, [m.id]: false })); }
  };

  const markHandled = async (msg) => {
    try { await updateDoc(doc(db, 'contact_messages', msg.id), { status: 'handled', handledBy: me.uid, handledAt: serverTimestamp() }); }
    catch (e) { console.error('Mark handled failed:', e); }
  };

  // Admin tools.
  const [backend, setBackend] = useState('checking');
  useEffect(() => {
    let alive = true;
    callApi('ping').then((r) => alive && setBackend(r?.message === 'pong' ? 'online' : 'error')).catch(() => alive && setBackend('offline'));
    return () => { alive = false; };
  }, []);
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [adminMsg, setAdminMsg] = useState(null);
  const [adminBusy, setAdminBusy] = useState(false);
  const provision = async () => {
    const problem = validateAdminPassword(pw, pw2);
    if (problem) { setAdminMsg({ tone: 'err', text: problem }); return; }
    setAdminBusy(true);
    try { setAdminMsg({ tone: 'ok', text: await provisionAdminLogin({ password: pw }) }); setPw(''); setPw2(''); }
    catch (e) { setAdminMsg({ tone: 'err', text: e.message }); }
    finally { setAdminBusy(false); }
  };
  const [indexMsg, setIndexMsg] = useState('');
  const rebuildIndex = async () => {
    setIndexMsg('Working…');
    try { const r = await callApi('backfillPhoneIndex'); setIndexMsg(`Done: ${r.updated} of ${r.scanned} profiles updated.`); }
    catch (e) { setIndexMsg(e.message || 'Failed.'); }
  };

  const firstName = String(me?.name || me?.displayName || '').split(/\s+/)[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-ink-muted">Command center</p>
          <h1 className="display-lg mt-1">Hare Krishna{firstName ? `, ${firstName}` : ''}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => onOpenScanner?.('attendance')} className="btn-primary"><QrCode size={17} /> Scan check-in</button>
          <button type="button" onClick={() => setActiveTab('events')} className="btn border border-line bg-white text-ink hover:bg-paper normal-case tracking-normal text-[14px]"><CalendarPlus size={16} /> Event</button>
          <button type="button" onClick={() => setActiveTab('devotees')} className="btn border border-line bg-white text-ink hover:bg-paper normal-case tracking-normal text-[14px]"><UserPlus size={16} /> Member</button>
          <button type="button" onClick={() => setActiveTab('reports')} className="btn border border-line bg-white text-ink hover:bg-paper normal-case tracking-normal text-[14px]"><Send size={16} /> Broadcast</button>
        </div>
      </div>

      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        <Stat icon={Users} value={loading ? '…' : people.length} label={`members · +${newThisWeek.length} this week`} onClick={() => setActiveTab('devotees')} />
        <Stat icon={AlertTriangle} value={followDue.length + quietMine.length} label="of mine need attention" onClick={() => setActiveTab('my-members')} alert={followDue.length + quietMine.length > 0} />
        <Stat icon={UserPlus} value={unassigned.length} label="without a guide" onClick={() => setActiveTab('devotees')} alert={unassigned.length > 0} />
        <Stat icon={Inbox} value={newMessages.length} label="new messages" onClick={() => document.getElementById('inbox')?.scrollIntoView({ behavior: 'smooth' })} alert={newMessages.length > 0} />
        <Stat icon={BedDouble} value={stayRequests.length} label="stay requests" onClick={() => setActiveTab('accommodation')} tone="bg-saffron-50 text-saffron" />
        <Stat icon={Building2} value={pendingBookings.length} label="residency bookings" onClick={() => setActiveTab('hostels')} tone="bg-saffron-50 text-saffron" />
        <Stat icon={Compass} value={pendingTrips.length} label="yatra registrations" onClick={() => setActiveTab('trips-admin')} tone="bg-saffron-50 text-saffron" />
        <Stat icon={HandHeart} value={volunteers} label={`seva volunteers · ${sevas.length} sevas`} onClick={() => setActiveTab('seva')} tone="bg-saffron-50 text-saffron" />
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <Panel title="New members waiting for a guide" action="All members" onAction={() => setActiveTab('devotees')} className="xl:col-span-2">
          {unassigned.length === 0 ? <p className="text-ink-muted">Everyone has a FOLK guide.</p> : (
            <ul className="divide-y divide-line">
              {unassigned.slice(0, 8).map((m) => (
                <li key={m.id} className="py-3 flex flex-wrap items-center gap-3">
                  <div className="flex-1 min-w-[10rem]">
                    <p className="font-semibold user-text">{m.displayName}</p>
                    <p className="text-[14px] text-ink-muted">{formatPhone(m.phone) || 'No phone'}{toDate(m.createdAt) ? ` · joined ${formatDay(toDate(m.createdAt))}` : ''}</p>
                  </div>
                  <select aria-label={`Guide for ${m.displayName}`} disabled={assigning[m.id]} defaultValue="" onChange={(e) => assign(m, e.target.value)}
                    className="h-10 px-3 rounded-md border border-line bg-white text-[15px] min-w-[11rem]">
                    <option value="" disabled>Assign a guide…</option>
                    {staff.map((s) => <option key={s.id} value={s.id}>{s.displayName}</option>)}
                  </select>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="My follow-ups due" action="My members" onAction={() => setActiveTab('my-members')}>
          {followDue.length === 0 ? <p className="text-ink-muted">Nothing due today.</p> : (
            <ul className="space-y-3">
              {followDue.slice(0, 6).map((m) => (
                <li key={m.id} className="flex items-center justify-between gap-3">
                  <span className="min-w-0"><span className="block font-semibold truncate">{m.displayName}</span><span className="text-[13px] text-ink-muted">{m.nextFollowUpDate < today ? `${daysBetween(m.nextFollowUpDate, today)}d overdue` : 'Due today'}</span></span>
                  {m.phone && <a href={whatsappUrl(m.phone, `Hare Krishna ${m.displayName.split(' ')[0]}!`)} target="_blank" rel="noopener noreferrer" aria-label={`WhatsApp ${m.displayName}`} className="w-10 h-10 shrink-0 inline-flex items-center justify-center rounded-md border border-line text-green-700 hover:bg-paper"><MessageCircle size={18} /></a>}
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Upcoming programs" action="Events" onAction={() => setActiveTab('events')}>
          {upcoming.length === 0 ? <p className="text-ink-muted">Nothing scheduled. Create the next program.</p> : (
            <ul className="space-y-3">
              {upcoming.map((e) => (
                <li key={e.id} className="flex items-center gap-3">
                  <span className="w-12 text-center shrink-0"><span className="block font-display text-xl font-extrabold leading-none">{e._d.toLocaleDateString('en-IN', { day: '2-digit', timeZone: 'Asia/Kolkata' })}</span><span className="text-[11px] font-bold text-saffron">{e._d.toLocaleDateString('en-IN', { month: 'short', timeZone: 'Asia/Kolkata' }).toUpperCase()}</span></span>
                  <span className="min-w-0 flex-1"><span className="block font-semibold truncate">{e.title}</span><span className="text-[13px] text-ink-muted">{e.attendingCount || 0} going</span></span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <section id="inbox" className="card p-5 sm:p-6 xl:col-span-2 scroll-mt-24">
          <h2 className="font-display text-[13px] font-bold uppercase tracking-label text-ink-muted">Messages from members</h2>
          {inbox.length === 0 ? <p className="mt-4 text-ink-muted">No messages yet. Members write in from the Contact page.</p> : (
            <ul className="mt-4 divide-y divide-line">
              {inbox.map((msg) => (
                <li key={msg.id} className={`py-3 ${msg.status === 'new' ? '' : 'opacity-60'}`}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold">{msg.name || 'Member'} <span className="font-normal text-[14px] text-ink-muted">· {msg.topic} · {formatDay(toDate(msg.createdAt))}</span></p>
                    <div className="flex gap-1">
                      {msg.phone && <a href={whatsappUrl(msg.phone, `Hare Krishna ${String(msg.name || '').split(' ')[0]}! About your message:`)} target="_blank" rel="noopener noreferrer" className="h-9 px-3 inline-flex items-center gap-1.5 rounded-md border border-line text-[14px] hover:bg-paper"><MessageCircle size={15} className="text-green-700" /> Reply</a>}
                      {msg.status === 'new' && <button type="button" onClick={() => markHandled(msg)} className="h-9 px-3 inline-flex items-center gap-1.5 rounded-md border border-line text-[14px] hover:bg-paper"><Check size={15} /> Done</button>}
                    </div>
                  </div>
                  <p className="mt-1 text-[15px] user-text">{msg.message}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {isAdmin && (
        <div className="grid gap-5 lg:grid-cols-2">
          <Panel title="Shared admin login">
            <p className="text-ink-muted text-[15px]">Create or reset the <span className="font-semibold text-ink">admin</span> login. Anyone signed in with the old password is signed out.</p>
            <div className="mt-4"><AdminPasswordFields password={pw} confirm={pw2} onPasswordChange={setPw} onConfirmChange={setPw2} disabled={adminBusy} /></div>
            {adminMsg && <p role={adminMsg.tone === 'err' ? 'alert' : 'status'} className={`mt-3 rounded-md px-3 py-2 text-[14px] ${adminMsg.tone === 'err' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-800'}`}>{adminMsg.text}</p>}
            <button type="button" onClick={provision} disabled={adminBusy} className="btn-dark mt-4"><ShieldCheck size={17} /> {adminBusy ? 'Working…' : 'Create / reset admin login'}</button>
          </Panel>
          <Panel title="System">
            <ul className="space-y-4 text-[15px]">
              <li className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-2"><Server size={17} className="text-ink-muted" /> Backend server</span>
                <span className={`font-semibold ${backend === 'online' ? 'text-green-700' : backend === 'checking' ? 'text-ink-muted' : 'text-red-700'}`}>{backend === 'online' ? 'Online' : backend === 'checking' ? 'Checking…' : 'Unreachable'}</span>
              </li>
              <li>
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-2"><Database size={17} className="text-ink-muted" /> Phone login index</span>
                  <button type="button" onClick={rebuildIndex} className="h-9 px-3 rounded-md border border-line text-[14px] hover:bg-paper">Rebuild</button>
                </div>
                <p className="mt-1 text-[13px] text-ink-muted">{indexMsg || 'Run once after this update so existing members can sign in with their phone number quickly.'}</p>
              </li>
            </ul>
          </Panel>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
