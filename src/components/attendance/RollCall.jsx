import { useMemo, useState } from 'react';
import { Check, Search, Users, UserCheck, Loader2, AlertCircle, UserPlus, Sparkles, Phone } from 'lucide-react';
import { setDoc, deleteDoc, doc, where, orderBy, limit, serverTimestamp } from '../../lib/pgstore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../hooks/useAuth';
import { useMembers } from '../../hooks/useMembers';
import { useFirestore } from '../../hooks/useFirestore';
import { stageLabel } from '../../content/journey';
import { formatPhone, whatsappUrl } from '../../lib/phone';
import VisitorModal from './VisitorModal';

const initials = (n) => String(n || '').trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() || '').join('') || '?';

// How many programs someone has been to decides which group they're in. The
// boundary between "new" and a regular is deliberately low: by the fourth
// program a boy is usually part of the crowd, and what matters is that the
// team spots the first three visits while a welcome still counts.
const NEW_UNTIL = 3;

const groupOf = (priorVisits) => (priorVisits === 0 ? 'first' : priorVisits <= NEW_UNTIL ? 'new' : 'regular');

const GROUPS = [
  { id: 'all', label: 'Everyone' },
  { id: 'first', label: 'First time', tone: 'text-saffron-dark' },
  { id: 'new', label: 'New boys', tone: 'text-navy-700' },
  { id: 'regular', label: 'Regulars', tone: 'text-green-700' },
];

const VisitBadge = ({ priorVisits, present }) => {
  if (priorVisits === 0) {
    return (
      <span className="chip bg-saffron-50 text-saffron-dark border border-saffron/30">
        <Sparkles size={12} aria-hidden="true" /> {present ? 'First visit' : 'Never been'}
      </span>
    );
  }
  const n = priorVisits + (present ? 1 : 0);
  return (
    <span className={`chip border ${priorVisits <= NEW_UNTIL ? 'bg-navy-50 text-navy-700 border-navy-200' : 'bg-green-50 text-green-800 border-green-600/30'}`}>
      {n} program{n === 1 ? '' : 's'}
    </span>
  );
};

/**
 * Who came to a program.
 *
 * Presence is simply whether an `attendance` record exists, with the same
 * deterministic id the QR scanner uses (`<eventId>_<uid>`) — so a devotee who
 * scanned in already shows as present here, and un-ticking removes the record
 * rather than storing an "absent" one. Nothing double-counts.
 *
 * Everyone is sorted into first-timers, new boys and regulars by how many
 * programs they have been to before this one, because those three need very
 * different things at the door: a welcome, a name remembered, or a nod.
 * People with no account at all are taken down as visitors.
 */
const RollCall = ({ eventId, eventTitle }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const { members, staff, loading: membersLoading } = useMembers();

  const attQ = useMemo(() => [where('eventId', '==', eventId)], [eventId]);
  const { data: attendance, loading: attLoading } = useFirestore('attendance', attQ);

  // Enough history to say how many programs each member has been to.
  const historyQ = useMemo(() => [orderBy('createdAt', 'desc'), limit(4000)], []);
  const { data: history } = useFirestore('attendance', historyQ);

  const visitorQ = useMemo(() => [where('eventId', '==', eventId)], [eventId]);
  const { data: visitors } = useFirestore('visitors', visitorQ);

  const [guideId, setGuideId] = useState(user?.uid || '');
  const [scope, setScope] = useState('mine'); // 'mine' | 'all'
  const [group, setGroup] = useState('all');
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');
  const [addingVisitor, setAddingVisitor] = useState(false);

  const presentIds = useMemo(
    () => new Set(attendance.map((a) => a.userId || a.uid).filter(Boolean)),
    [attendance]
  );

  // Programs each member attended before this one.
  const priorByUser = useMemo(() => {
    const map = new Map();
    for (const a of history) {
      const uid = a.userId || a.uid;
      if (!uid || !a.eventId || a.eventId === eventId) continue;
      if (!map.has(uid)) map.set(uid, new Set());
      map.get(uid).add(a.eventId);
    }
    return map;
  }, [history, eventId]);

  const roll = useMemo(() => {
    const term = search.trim().toLowerCase();
    return members
      .filter((m) => !m.isStaff)
      .filter((m) => (scope === 'all' ? true : m.guideId === guideId))
      .map((m) => {
        const priorVisits = (priorByUser.get(m.id) || new Set()).size;
        return { ...m, priorVisits, group: groupOf(priorVisits), present: presentIds.has(m.id) };
      })
      .filter((m) => group === 'all' || m.group === group)
      .filter((m) => !term || m.displayName.toLowerCase().includes(term) || String(m.phone || '').includes(term));
  }, [members, scope, guideId, search, group, presentIds, priorByUser]);

  // Counts for the tabs come from the same scope but ignore the group filter,
  // so switching tabs doesn't change the numbers on them.
  const counts = useMemo(() => {
    const base = members
      .filter((m) => !m.isStaff)
      .filter((m) => (scope === 'all' ? true : m.guideId === guideId))
      .map((m) => groupOf((priorByUser.get(m.id) || new Set()).size));
    return {
      all: base.length,
      first: base.filter((g) => g === 'first').length,
      new: base.filter((g) => g === 'new').length,
      regular: base.filter((g) => g === 'regular').length,
    };
  }, [members, scope, guideId, priorByUser]);

  const presentCount = roll.filter((r) => r.present).length;
  const totalPresent = presentIds.size + visitors.length;

  const toggle = async (member) => {
    if (busyId) return;
    setBusyId(member.id);
    setError('');
    const ref = doc(db, 'attendance', `${eventId}_${member.id}`);
    try {
      if (member.present) {
        await deleteDoc(ref);
      } else {
        await setDoc(ref, {
          userId: member.id,
          name: member.displayName,
          eventId,
          session: eventTitle || 'Program',
          status: 'On-time',
          method: 'roll-call',
          markedBy: user?.uid || null,
          markedByName: user?.name || user?.displayName || 'Team',
          time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' }),
          createdAt: serverTimestamp(),
        });
      }
    } catch (err) {
      console.error('Roll call failed:', err);
      setError(
        err.code === 'permission-denied'
          ? 'Only the FOLK team can mark attendance.'
          : 'Could not save that. Check your connection and try again.'
      );
    } finally {
      setBusyId(null);
    }
  };

  const loading = membersLoading || attLoading;

  return (
    <section className="card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-lg font-bold">Roll call</h2>
          <p className="mt-0.5 text-[14px] text-ink-muted">
            Tap a name to mark them present at <span className="font-semibold text-ink user-text">{eventTitle || 'this program'}</span>. People who scanned their QR are already ticked.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="chip bg-green-50 text-green-800 border border-green-600/30">
            <UserCheck size={13} aria-hidden="true" /> {totalPresent} here
          </span>
          <button type="button" onClick={() => setAddingVisitor(true)} className="btn border border-line text-ink hover:bg-paper normal-case tracking-normal text-[14px] min-h-[40px]">
            <UserPlus size={16} /> First-timer
          </button>
        </div>
      </div>

      {/* Who is being shown: a guide's own members, or the whole club. */}
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <div className="flex p-1 bg-paper rounded-md" role="tablist" aria-label="Which members">
          {[['mine', isAdmin ? "This guide's members" : 'My members'], ['all', 'Everyone']].map(([v, label]) => (
            <button
              key={v}
              type="button"
              role="tab"
              aria-selected={scope === v}
              onClick={() => setScope(v)}
              className={`h-9 px-3.5 rounded text-[14px] font-semibold ${scope === v ? 'bg-white text-ink shadow-card' : 'text-ink-muted hover:text-ink'}`}
            >
              {label}
            </button>
          ))}
        </div>

        {isAdmin && scope === 'mine' && (
          <select
            aria-label="Guide"
            value={guideId}
            onChange={(e) => setGuideId(e.target.value)}
            className="h-9 px-3 rounded-md border border-line bg-white text-[14px] font-semibold text-ink outline-none focus:border-navy"
          >
            {staff.map((s) => <option key={s.id} value={s.id}>{s.id === user?.uid ? 'Me' : s.displayName}</option>)}
          </select>
        )}

        <div className="relative flex-1 min-w-[12rem]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search a name or number"
            className="w-full h-9 pl-9 pr-3 rounded-md border border-line bg-white text-[15px] outline-none focus:border-navy"
          />
        </div>
      </div>

      {/* First time / new / regular */}
      <div className="mt-3 flex flex-wrap gap-2" role="tablist" aria-label="Which group">
        {GROUPS.map((g) => (
          <button
            key={g.id}
            type="button"
            role="tab"
            aria-selected={group === g.id}
            onClick={() => setGroup(g.id)}
            className={`h-9 px-3.5 rounded-full border text-[14px] font-semibold transition-colors ${
              group === g.id ? 'bg-navy text-white border-navy' : 'bg-white border-line text-ink hover:bg-paper'
            }`}
          >
            {g.label} <span className={group === g.id ? 'text-white/70' : 'text-ink-muted'}>{counts[g.id] ?? 0}</span>
          </button>
        ))}
      </div>

      {error && (
        <p role="alert" className="mt-4 flex items-center gap-2 rounded-md bg-red-50 px-4 py-3 text-[15px] text-red-700">
          <AlertCircle size={17} className="shrink-0" /> {error}
        </p>
      )}

      {loading ? (
        <div className="mt-5 space-y-2" aria-hidden="true">
          {[0, 1, 2].map((i) => <div key={i} className="h-14 rounded-xl bg-paper animate-pulse" />)}
        </div>
      ) : roll.length === 0 ? (
        <div className="mt-6 text-center py-8">
          <Users size={28} className="mx-auto text-ink-muted" aria-hidden="true" />
          <p className="mt-3 text-ink-muted">
            {search ? 'Nobody matches that search.'
              : group !== 'all' ? 'Nobody in this group.'
              : scope === 'mine' ? 'No members assigned to this guide yet.' : 'No members yet.'}
          </p>
        </div>
      ) : (
        <>
          <p className="mt-5 text-[13px] text-ink-muted">{presentCount} of {roll.length} shown are present</p>
          <ul className="mt-2 grid gap-2 sm:grid-cols-2">
            {roll.map((m) => (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => toggle(m)}
                  disabled={busyId === m.id}
                  aria-pressed={m.present}
                  className={`w-full flex items-center gap-3 rounded-xl border p-3 text-left transition-colors disabled:opacity-60 ${
                    m.present ? 'border-green-600/40 bg-green-50' : m.group === 'first' ? 'border-saffron/40 hover:bg-saffron-50' : 'border-line hover:bg-paper'
                  }`}
                >
                  <span className={`w-10 h-10 shrink-0 rounded-full inline-flex items-center justify-center font-display font-bold ${m.present ? 'bg-green-600 text-white' : 'bg-paper-dark text-ink-muted'}`}>
                    {busyId === m.id ? <Loader2 size={16} className="animate-spin" /> : m.present ? <Check size={18} /> : initials(m.displayName)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold truncate user-text">{m.displayName}</span>
                    <span className="block text-[13px] text-ink-muted">{m.present ? 'Present' : stageLabel(m.stage)}</span>
                  </span>
                  <VisitBadge priorVisits={m.priorVisits} present={m.present} />
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      {/* People with no account, taken down at the door. */}
      <div className="mt-6 pt-5 border-t border-line">
        <h3 className="font-sans text-[13px] font-bold uppercase tracking-label text-ink-muted">
          First-timers today {visitors.length > 0 && <span className="text-saffron-dark">· {visitors.length}</span>}
        </h3>
        {visitors.length === 0 ? (
          <p className="mt-2 text-[14px] text-ink-muted">
            Nobody yet. Use <span className="font-semibold text-ink">First-timer</span> above for anyone who has come for the first time and has no FOLK account.
          </p>
        ) : (
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {visitors.map((v) => (
              <li key={v.id} className="flex items-center gap-3 rounded-xl border border-saffron/30 bg-saffron-50 p-3">
                <span className="w-10 h-10 shrink-0 rounded-full bg-saffron text-white inline-flex items-center justify-center font-display font-bold">
                  {initials(v.name)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold truncate user-text">{v.name}</span>
                  <span className="block text-[13px] text-ink-muted truncate">{v.phone ? formatPhone(v.phone) : 'No number'}{v.note ? ` · ${v.note}` : ''}</span>
                </span>
                {v.phone && (
                  <a
                    href={whatsappUrl(v.phone, `Hare Krishna ${String(v.name || '').split(' ')[0]}! It was lovely to have you at ${eventTitle || 'our program'}.`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`WhatsApp ${v.name}`}
                    className="shrink-0 w-10 h-10 inline-flex items-center justify-center rounded-md bg-white border border-line text-green-700 hover:bg-paper"
                  >
                    <Phone size={17} />
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <VisitorModal
        open={addingVisitor}
        onClose={() => setAddingVisitor(false)}
        eventId={eventId}
        eventTitle={eventTitle}
      />
    </section>
  );
};

export default RollCall;
