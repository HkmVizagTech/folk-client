import React, { useMemo, useState } from 'react';
import { CalendarDays, MapPin, Plus, Users, CheckCircle2, XCircle, ImagePlus, Ticket } from 'lucide-react';
import { collection, addDoc, serverTimestamp, doc, where, increment, writeBatch } from '../lib/pgstore';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '../hooks/useAuth';
import { auth, db } from '../lib/firebase';
import { useFirestore } from '../hooks/useFirestore';
import { toDate, formatDay, formatTime } from '../lib/dates';
import Modal, { Field, inputClass, textareaClass } from '../components/ui/Modal';

const CATEGORIES = ['Weekly Program', 'Retreats', 'Kirtans', 'Festivals', 'Yatras', 'Seminars', 'Other'];
const EMPTY_FORM = { title: '', date: '', location: '', category: 'Weekly Program', description: '', img: '' };

// Old events were created with a random stock photo as their default image.
const realImage = (src) => (src && !/picsum\.photos|unsplash\.com\/random/.test(src) ? src : '');

const eventDate = (e) => toDate(e.dateISO || e.date);

const Events = () => {
  const { user } = useAuth();
  const isStaff = user?.role === 'admin' || user?.role === 'folks_head';
  const { data: allEvents, loading } = useFirestore('events');
  const regQuery = useMemo(() => [where('userId', '==', user?.uid || 'guest')], [user?.uid]);
  const { data: registrations } = useFirestore('registrations', regQuery);

  const [category, setCategory] = useState('All');
  const [when, setWhen] = useState('upcoming');
  const [busy, setBusy] = useState({});
  const [error, setError] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const regByEvent = useMemo(() => new Map(registrations.map((r) => [r.eventId, r])), [registrations]);

  const events = useMemo(() => {
    const cutoff = Date.now() - 6 * 3600 * 1000;
    return allEvents
      .map((e) => ({ ...e, _d: eventDate(e) }))
      .filter((e) => (category === 'All' || e.category === category))
      .filter((e) => (when === 'upcoming' ? !e._d || e._d.getTime() >= cutoff : e._d && e._d.getTime() < cutoff))
      .sort((a, b) => (when === 'upcoming' ? 1 : -1) * ((a._d?.getTime() || 0) - (b._d?.getTime() || 0)));
  }, [allEvents, category, when]);

  const usedCategories = useMemo(
    () => ['All', ...CATEGORIES.filter((c) => allEvents.some((e) => e.category === c)), ...[...new Set(allEvents.map((e) => e.category).filter((c) => c && !CATEGORIES.includes(c)))]],
    [allEvents]
  );

  const rsvp = async (event, attending) => {
    if (!user) return;
    const status = attending ? 'Attending' : 'Not Attending';
    const prev = regByEvent.get(event.id)?.status;
    if (prev === status) return;
    setBusy((b) => ({ ...b, [event.id]: true }));
    setError('');
    try {
      // One batch, so the counter can never drift from the registrations.
      const batch = writeBatch(db);
      batch.update(doc(db, 'events', event.id), {
        attendingCount: increment(attending ? 1 : prev === 'Attending' ? -1 : 0),
        declinedCount: increment(!attending ? 1 : prev === 'Not Attending' ? -1 : 0),
      });
      batch.set(doc(db, 'registrations', `${event.id}_${user.uid}`), {
        eventId: event.id,
        eventTitle: event.title,
        userId: user.uid,
        userName: user.name || user.fullName || auth.currentUser?.displayName || 'Member',
        token: attending ? uuidv4().slice(0, 8).toUpperCase() : null,
        status,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      await batch.commit();
    } catch (e) {
      console.error('RSVP failed:', e);
      setError('Could not save your RSVP. Please try again.');
    } finally {
      setBusy((b) => ({ ...b, [event.id]: false }));
    }
  };

  const onImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('Please choose an image file.'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        // Downscale so the event document stays small.
        const scale = Math.min(1, 1000 / img.width);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        setForm((f) => ({ ...f, img: canvas.toDataURL('image/jpeg', 0.72) }));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  const create = async (e) => {
    e.preventDefault();
    const d = new Date(form.date);
    if (!form.title.trim() || Number.isNaN(d.getTime())) { setError('Add a title and a valid date and time.'); return; }
    setSaving(true);
    setError('');
    try {
      const label = d.toLocaleString('en-IN', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' });
      await addDoc(collection(db, 'events'), {
        title: form.title.trim(),
        category: form.category,
        location: form.location.trim(),
        description: form.description.trim(),
        img: form.img || '',
        date: label,
        dateISO: d.toISOString(),
        attendingCount: 0,
        declinedCount: 0,
        groupId: auth.currentUser?.uid || 'system',
        createdAt: serverTimestamp(),
      });
      await addDoc(collection(db, 'notifications'), {
        type: 'new_event',
        title: `New event: ${form.title.trim()}`,
        message: `${form.category}${form.location ? ` at ${form.location.trim()}` : ''} on ${label}.`,
        link: '/events',
        createdAt: serverTimestamp(),
        createdBy: auth.currentUser?.uid || 'system',
      });
      setFormOpen(false);
      setForm(EMPTY_FORM);
    } catch (err) {
      console.error('Create event failed:', err);
      setError('Could not create the event. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="display-lg">Events</h1>
          <p className="mt-1 text-ink-muted">Programs, festivals and retreats. RSVP so the team knows you&apos;re coming.</p>
        </div>
        {isStaff && (
          <button type="button" onClick={() => { setForm(EMPTY_FORM); setFormOpen(true); }} className="btn-primary"><Plus size={18} /> New event</button>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-1 px-1" role="tablist" aria-label="Category">
          {usedCategories.map((c) => (
            <button
              key={c}
              type="button"
              role="tab"
              aria-selected={category === c}
              onClick={() => setCategory(c)}
              className={`shrink-0 h-9 px-3.5 rounded-full border text-[14px] font-semibold ${category === c ? 'bg-navy text-white border-ink' : 'bg-white border-line text-ink hover:bg-paper'}`}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="flex p-1 bg-white border border-line rounded-md" role="tablist" aria-label="When">
          {[['upcoming', 'Upcoming'], ['past', 'Past']].map(([k, l]) => (
            <button key={k} type="button" role="tab" aria-selected={when === k} onClick={() => setWhen(k)} className={`h-8 px-3 rounded text-[14px] font-semibold ${when === k ? 'bg-paper text-ink' : 'text-ink-muted'}`}>{l}</button>
          ))}
        </div>
      </div>

      {error && <p role="alert" className="rounded-md bg-red-50 text-red-700 px-4 py-3">{error}</p>}

      {loading && allEvents.length === 0 ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3" aria-busy="true">
          {[0, 1, 2].map((i) => <div key={i} className="h-80 card animate-pulse" />)}
        </div>
      ) : events.length === 0 ? (
        <div className="card p-10 text-center">
          <CalendarDays size={36} className="mx-auto text-ink-muted" />
          <h2 className="mt-4 font-display text-lg font-bold">{when === 'upcoming' ? 'No upcoming events' : 'No past events'}</h2>
          <p className="mt-1 text-ink-muted">{when === 'upcoming' ? 'New programs are announced here and on WhatsApp.' : 'Past events will be listed here.'}</p>
        </div>
      ) : (
        <ul className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {events.map((e) => {
            const reg = regByEvent.get(e.id);
            const going = reg?.status === 'Attending';
            const declined = reg?.status === 'Not Attending';
            const img = realImage(e.img);
            const past = when === 'past';
            return (
              <li key={e.id} className="card overflow-hidden flex flex-col">
                {/* Event images are usually posters with the date and venue in
                    the artwork, so they're shown whole (contain), not cropped. */}
                <div className="relative aspect-[4/3] bg-paper-dark overflow-hidden">
                  {img ? <img src={img} alt={`${e.title} poster`} loading="lazy" className="absolute inset-0 w-full h-full object-contain" /> : (
                    <div className="absolute inset-0 flex items-center justify-center"><CalendarDays size={40} className="text-white/30" /></div>
                  )}
                  {e._d && (
                    <div className="absolute top-3 left-3 bg-white rounded-md px-2.5 py-1.5 text-center leading-none">
                      <div className="font-display text-xl font-extrabold">{e._d.toLocaleDateString('en-IN', { day: '2-digit', timeZone: 'Asia/Kolkata' })}</div>
                      <div className="mt-0.5 font-display text-[11px] font-bold text-saffron">{e._d.toLocaleDateString('en-IN', { month: 'short', timeZone: 'Asia/Kolkata' }).toUpperCase()}</div>
                    </div>
                  )}
                  {e.category && <span className="absolute top-3 right-3 bg-ink/80 text-white rounded-full px-2.5 py-1 text-[12px] font-semibold">{e.category}</span>}
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <h2 className="font-display text-lg font-bold leading-snug user-text">{e.title}</h2>
                  <p className="mt-2 text-[15px] text-ink-muted flex flex-col gap-1">
                    {e._d && <span className="inline-flex items-center gap-2"><CalendarDays size={16} className="shrink-0" /> {formatDay(e._d)}, {formatTime(e._d)}</span>}
                    {e.location && <span className="inline-flex items-center gap-2 user-text"><MapPin size={16} className="shrink-0" /> {e.location}</span>}
                    {(e.attendingCount || 0) > 0 && <span className="inline-flex items-center gap-2"><Users size={16} className="shrink-0" /> {e.attendingCount} going</span>}
                  </p>
                  {e.description && <p className="mt-3 text-[15px] text-ink line-clamp-3 user-text">{e.description}</p>}

                  {!past && (
                    <div className="mt-auto pt-5">
                      {going && reg?.token && (
                        <p className="mb-3 flex items-center gap-2 rounded-md bg-green-50 text-green-800 px-3 py-2 text-[14px]">
                          <Ticket size={16} className="shrink-0" /> Check-in code <span className="font-display font-bold tracking-wider">{reg.token}</span>
                        </p>
                      )}
                      <div className="grid grid-cols-2 gap-2">
                        <button type="button" disabled={busy[e.id]} onClick={() => rsvp(e, true)} aria-pressed={going}
                          className={`btn normal-case tracking-normal text-[14px] ${going ? 'bg-green-600 text-white' : 'bg-navy text-white hover:bg-navy'}`}>
                          <CheckCircle2 size={17} /> {going ? 'Going' : "I'm going"}
                        </button>
                        <button type="button" disabled={busy[e.id]} onClick={() => rsvp(e, false)} aria-pressed={declined}
                          className={`btn normal-case tracking-normal text-[14px] border ${declined ? 'border-ink bg-paper text-ink' : 'border-line text-ink hover:bg-paper'}`}>
                          <XCircle size={17} /> {declined ? "Can't go" : "Can't make it"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title="New event"
        footer={<>
          <button type="button" onClick={() => setFormOpen(false)} className="btn border border-line text-ink hover:bg-paper">Cancel</button>
          <button type="submit" form="event-form" disabled={saving} className="btn-primary">{saving ? 'Creating…' : 'Create event'}</button>
        </>}
      >
        <form id="event-form" onSubmit={create} className="space-y-4">
          <Field label="Title"><input required className={inputClass} value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. Sunday Feast Program" /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Date & time"><input required type="datetime-local" className={inputClass} value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} /></Field>
            <Field label="Category">
              <select className={inputClass} value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Location"><input className={inputClass} value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} placeholder="e.g. Temple hall" /></Field>
          <Field label="Description"><textarea className={textareaClass} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="What will happen, who it's for, what to bring" /></Field>
          <Field label="Photo" hint="Optional. A real photo from a past program works best.">
            <div className="flex items-center gap-4">
              <label className="btn border border-line text-ink hover:bg-paper normal-case tracking-normal text-[14px] cursor-pointer">
                <ImagePlus size={17} /> Choose photo
                <input type="file" accept="image/*" className="sr-only" onChange={onImage} />
              </label>
              {form.img && <img src={form.img} alt="Selected" className="h-14 w-24 object-cover rounded-md" />}
            </div>
          </Field>
        </form>
      </Modal>
    </div>
  );
};

export default Events;
