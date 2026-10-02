import { useMemo, useState } from 'react';
import { MessageCircle, Phone, Check, Sparkles, Loader2 } from 'lucide-react';
import { doc, updateDoc, orderBy, limit, serverTimestamp } from '../../lib/pgstore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../hooks/useAuth';
import { useFirestore } from '../../hooks/useFirestore';
import { formatPhone, whatsappUrl, telUrl } from '../../lib/phone';
import { toDate, formatDay } from '../../lib/dates';

/**
 * Everyone who came for the first time and has not been welcomed yet.
 *
 * A first visit is the whole point of a youth club and also the easiest thing
 * to lose: somebody takes a name at the door and it is never looked at again.
 * This list keeps them in front of the team until a person has actually been
 * in touch.
 */
const FirstTimers = () => {
  const { user } = useAuth();
  const q = useMemo(() => [orderBy('createdAt', 'desc'), limit(100)], []);
  const { data: visitors, loading } = useFirestore('visitors', q);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');
  const [showDone, setShowDone] = useState(false);

  const waiting = visitors.filter((v) => v.status !== 'followed_up');
  const done = visitors.filter((v) => v.status === 'followed_up');
  const shown = showDone ? done : waiting;

  const markWelcomed = async (v) => {
    if (busyId) return;
    setBusyId(v.id);
    setError('');
    try {
      await updateDoc(doc(db, 'visitors', v.id), {
        status: 'followed_up',
        followedUpAt: serverTimestamp(),
        followedUpBy: user?.uid || null,
        followedUpByName: user?.name || user?.displayName || 'Team',
      });
    } catch (err) {
      console.error('Mark welcomed failed:', err);
      setError(err.code === 'permission-denied' ? 'Only the FOLK team can update this.' : 'Could not save. Please try again.');
    } finally {
      setBusyId(null);
    }
  };

  if (!loading && visitors.length === 0) return null;

  return (
    <section className="card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold">First-timers to welcome</h2>
          <p className="mt-0.5 text-[14px] text-ink-muted">Everyone who came for the first time. Reach out within a day or two — that is what brings them back.</p>
        </div>
        <div className="flex p-1 bg-paper rounded-md" role="tablist" aria-label="Which first-timers">
          {[[false, `To welcome (${waiting.length})`], [true, `Welcomed (${done.length})`]].map(([v, label]) => (
            <button
              key={label}
              type="button"
              role="tab"
              aria-selected={showDone === v}
              onClick={() => setShowDone(v)}
              className={`h-9 px-3.5 rounded text-[14px] font-semibold ${showDone === v ? 'bg-white text-ink shadow-card' : 'text-ink-muted hover:text-ink'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {error && <p role="alert" className="mt-4 rounded-md bg-red-50 px-4 py-3 text-[15px] text-red-700">{error}</p>}

      {loading ? (
        <div className="mt-5 space-y-2" aria-hidden="true">
          {[0, 1].map((i) => <div key={i} className="h-16 rounded-xl bg-paper animate-pulse" />)}
        </div>
      ) : shown.length === 0 ? (
        <p className="mt-5 text-ink-muted">
          {showDone ? 'Nobody has been ticked off yet.' : 'Everyone has been welcomed. Hare Krishna!'}
        </p>
      ) : (
        <ul className="mt-5 grid gap-3 lg:grid-cols-2">
          {shown.map((v) => (
            <li key={v.id} className="rounded-xl border border-line p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-display font-bold user-text">{v.name}</p>
                  <p className="text-[14px] text-ink-muted">
                    {v.phone ? formatPhone(v.phone) : 'No number'}
                    {v.createdAt ? ` · ${formatDay(toDate(v.createdAt))}` : ''}
                  </p>
                </div>
                <span className="chip bg-saffron-50 text-saffron-dark border border-saffron/30 shrink-0">
                  <Sparkles size={12} aria-hidden="true" /> First visit
                </span>
              </div>

              <p className="mt-2 text-[14px] text-ink-muted user-text">
                At <span className="font-semibold text-ink">{v.eventTitle || 'a program'}</span>
                {v.createdByName ? ` · taken down by ${v.createdByName}` : ''}
              </p>
              {v.note && <p className="mt-1.5 text-[14px] text-ink user-text">{v.note}</p>}
              {v.status === 'followed_up' && v.followedUpByName && (
                <p className="mt-1.5 text-[14px] text-green-700">Welcomed by {v.followedUpByName}</p>
              )}

              {v.status !== 'followed_up' && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {v.phone && (
                    <a
                      href={whatsappUrl(v.phone, `Hare Krishna ${String(v.name || '').split(' ')[0]}! It was lovely to have you at ${v.eventTitle || 'our program'}. Do come again — let me know if you have any questions.`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn border border-line text-green-700 hover:bg-paper normal-case tracking-normal text-[14px] min-h-[40px]"
                    >
                      <MessageCircle size={16} /> WhatsApp
                    </a>
                  )}
                  {v.phone && (
                    <a href={telUrl(v.phone)} className="btn border border-line text-ink hover:bg-paper normal-case tracking-normal text-[14px] min-h-[40px]">
                      <Phone size={16} /> Call
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => markWelcomed(v)}
                    disabled={busyId === v.id}
                    className="btn-dark min-h-[40px] normal-case tracking-normal text-[14px] ml-auto"
                  >
                    {busyId === v.id ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} Welcomed
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default FirstTimers;
