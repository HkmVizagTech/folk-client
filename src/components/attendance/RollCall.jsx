import { useMemo, useState } from 'react';
import { Check, Search, Users, UserCheck, Loader2, AlertCircle } from 'lucide-react';
import { setDoc, deleteDoc, doc, where, serverTimestamp } from '../../lib/pgstore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../hooks/useAuth';
import { useMembers } from '../../hooks/useMembers';
import { useFirestore } from '../../hooks/useFirestore';
import { stageLabel } from '../../content/journey';

const initials = (n) => String(n || '').trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() || '').join('') || '?';

/**
 * Tick the people who came to a program.
 *
 * Presence is simply whether an `attendance` record exists, with the same
 * deterministic id the QR scanner uses (`<eventId>_<uid>`) — so a devotee who
 * scanned in already shows as present here, and un-ticking removes the record
 * rather than storing an "absent" one. Nothing double-counts.
 */
const RollCall = ({ eventId, eventTitle }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const { members, staff, loading: membersLoading } = useMembers();

  const attQ = useMemo(() => [where('eventId', '==', eventId)], [eventId]);
  const { data: attendance, loading: attLoading } = useFirestore('attendance', attQ);

  const [guideId, setGuideId] = useState(user?.uid || '');
  const [scope, setScope] = useState('mine'); // 'mine' | 'all'
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');

  const presentIds = useMemo(
    () => new Set(attendance.map((a) => a.userId || a.uid).filter(Boolean)),
    [attendance]
  );

  const roll = useMemo(() => {
    const term = search.trim().toLowerCase();
    return members
      .filter((m) => !m.isStaff)
      .filter((m) => (scope === 'all' ? true : m.guideId === guideId))
      .filter((m) => !term || m.displayName.toLowerCase().includes(term) || String(m.phone || '').includes(term))
      .map((m) => ({ ...m, present: presentIds.has(m.id) }));
  }, [members, scope, guideId, search, presentIds]);

  const presentCount = roll.filter((r) => r.present).length;

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
        <span className="chip bg-saffron-50 text-saffron-dark border border-saffron/30">
          <UserCheck size={13} aria-hidden="true" /> {presentCount} of {roll.length} present
        </span>
      </div>

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
            {search ? 'Nobody matches that search.' : scope === 'mine' ? 'No members assigned to this guide yet.' : 'No members yet.'}
          </p>
        </div>
      ) : (
        <ul className="mt-5 grid gap-2 sm:grid-cols-2">
          {roll.map((m) => (
            <li key={m.id}>
              <button
                type="button"
                onClick={() => toggle(m)}
                disabled={busyId === m.id}
                aria-pressed={m.present}
                className={`w-full flex items-center gap-3 rounded-xl border p-3 text-left transition-colors disabled:opacity-60 ${
                  m.present ? 'border-green-600/40 bg-green-50' : 'border-line hover:bg-paper'
                }`}
              >
                <span className={`w-10 h-10 shrink-0 rounded-full inline-flex items-center justify-center font-display font-bold ${m.present ? 'bg-green-600 text-white' : 'bg-paper-dark text-ink-muted'}`}>
                  {busyId === m.id ? <Loader2 size={16} className="animate-spin" /> : m.present ? <Check size={18} /> : initials(m.displayName)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold truncate user-text">{m.displayName}</span>
                  <span className="block text-[13px] text-ink-muted">{m.present ? 'Present' : stageLabel(m.stage)}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default RollCall;
