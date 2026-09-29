import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Bell, CalendarDays, X, LogOut } from 'lucide-react';
import { orderBy, limit } from 'firebase/firestore';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../../hooks/useAuth';
import { useFirestore } from '../../hooks/useFirestore';
import { findNavItem } from './navConfig';

const toDate = (value) => (value?.toDate ? value.toDate() : value ? new Date(value) : new Date());
const timeAgo = (value) => {
  try { return formatDistanceToNow(toDate(value), { addSuffix: true }); } catch { return 'Just now'; }
};

const TITLES = { 'trip-detail': 'Yatra', 'admin-setup': 'Site admin' };

const SEEN_KEY = 'notif_seen_at';
const readSeen = () => { try { return Number(localStorage.getItem(SEEN_KEY)) || 0; } catch { return 0; } };

const NotificationRow = ({ n, onOpen }) => (
  <button type="button" onClick={onOpen} className="w-full text-left p-4 border-b border-line last:border-0 hover:bg-paper flex gap-3">
    <span className="w-8 h-8 rounded-full bg-navy-50 text-navy inline-flex items-center justify-center shrink-0">
      <CalendarDays size={15} />
    </span>
    <span className="min-w-0">
      <span className="block text-[15px] font-semibold text-ink user-text">{n.title}</span>
      {n.message && <span className="block text-[14px] text-ink-muted mt-0.5 user-text">{n.message}</span>}
      <span className="block text-[12px] text-ink-muted/80 mt-1">{timeAgo(n.createdAt)}</span>
    </span>
  </button>
);

/** Mounted only while open, so the full history is fetched only on demand. */
const AllNotifications = ({ onClose, onOpen }) => {
  const q = useMemo(() => [orderBy('createdAt', 'desc'), limit(100)], []);
  const { data, loading } = useFirestore('notifications', q);
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center sm:p-4" role="dialog" aria-modal="true" aria-label="All activity">
      <div className="absolute inset-0 bg-ink/60" onClick={onClose} />
      <div className="relative w-full sm:max-w-lg bg-white sm:rounded-xl rounded-t-xl flex flex-col max-h-[85vh]">
        <div className="px-5 h-14 border-b border-line flex justify-between items-center">
          <h2 className="font-display font-bold">All activity</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="w-10 h-10 inline-flex items-center justify-center rounded-md hover:bg-paper"><X size={18} /></button>
        </div>
        <div className="overflow-y-auto">
          {loading ? <p className="p-10 text-center text-ink-muted">Loading…</p>
            : data.length ? data.map((n) => <NotificationRow key={n.id} n={n} onOpen={onOpen} />)
            : <p className="p-10 text-center text-ink-muted">No activity yet</p>}
        </div>
      </div>
    </div>
  );
};

/** Sticky white bar above every app screen: page title + notifications. */
const Navbar = ({ activeTab, setActiveTab }) => {
  const { logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [seenAt, setSeenAt] = useState(readSeen);
  const ref = useRef(null);

  const recentQ = useMemo(() => [orderBy('createdAt', 'desc'), limit(10)], []);
  const { data: recent } = useFirestore('notifications', recentQ);
  const unread = recent.filter((n) => toDate(n.createdAt).getTime() > seenAt).length;

  useEffect(() => {
    const onDown = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  const toggle = () => {
    setOpen((v) => !v);
    // Opening the panel marks everything in it as seen.
    const now = Date.now();
    try { localStorage.setItem(SEEN_KEY, String(now)); } catch { /* private mode */ }
    setSeenAt(now);
  };

  const goEvents = () => { setOpen(false); setShowAll(false); setActiveTab('events'); };
  const title = TITLES[activeTab] || findNavItem(activeTab)?.label || 'FOLK Vizag';

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-line">
      <div className="h-14 sm:h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <img src="/folk_logo_blue.png" alt="FOLK Vizag" className="h-9 w-auto lg:hidden" />
          <h1 className="font-display text-lg sm:text-xl font-bold truncate">{title}</h1>
        </div>

        <div className="flex items-center gap-1">
          <div className="relative" ref={ref}>
            <button
              type="button"
              onClick={toggle}
              aria-label={unread ? `Notifications, ${unread} new` : 'Notifications'}
              aria-expanded={open}
              className="relative w-11 h-11 inline-flex items-center justify-center rounded-md text-ink-muted hover:bg-paper hover:text-ink"
            >
              <Bell size={21} />
              {unread > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-saffron text-white text-[11px] font-bold inline-flex items-center justify-center">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </button>
            {open && (
              <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] max-w-sm bg-white rounded-xl border border-line shadow-premium-xl overflow-hidden z-50">
                <div className="px-4 h-12 border-b border-line flex items-center justify-between">
                  <h2 className="font-display text-[15px] font-bold">Notifications</h2>
                </div>
                <div className="max-h-[360px] overflow-y-auto">
                  {recent.length
                    ? recent.map((n) => <NotificationRow key={n.id} n={n} onOpen={goEvents} />)
                    : <p className="p-8 text-center text-ink-muted">You&apos;re all caught up</p>}
                </div>
                <button
                  type="button"
                  onClick={() => { setOpen(false); setShowAll(true); }}
                  className="w-full h-11 border-t border-line font-display text-[13px] font-bold uppercase tracking-label text-saffron hover:bg-paper"
                >
                  See all activity
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={logout}
            aria-label="Sign out"
            title="Sign out"
            className="lg:hidden w-11 h-11 inline-flex items-center justify-center rounded-md text-ink-muted hover:bg-paper hover:text-ink"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>

      {showAll && <AllNotifications onClose={() => setShowAll(false)} onOpen={goEvents} />}
    </header>
  );
};

export default Navbar;
