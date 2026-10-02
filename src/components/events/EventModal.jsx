import React, { useEffect, useState } from 'react';
import { ImagePlus, Trash2, Globe, HeartHandshake, Building2 } from 'lucide-react';
import { collection, addDoc, doc, updateDoc, deleteDoc, serverTimestamp } from '../../lib/pgstore';
import { auth, db } from '../../lib/firebase';
import { useAuth } from '../../hooks/useAuth';
import { audiencesFor, canManageEvent } from '../../content/audiences';
import Modal, { Field, inputClass, textareaClass } from '../ui/Modal';

const CATEGORIES = ['Weekly Program', 'Retreats', 'Kirtans', 'Festivals', 'Yatras', 'Seminars', 'Other'];

const AUDIENCE_ICONS = { all: Globe, mine: HeartHandshake, residents: Building2 };

/** 'YYYY-MM-DDTHH:mm' in IST, for <input type="datetime-local">. */
const toLocalInput = (value) => {
  const d = value instanceof Date ? value : new Date(value);
  if (!d || Number.isNaN(d.getTime())) return '';
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(d).reduce((o, p) => ({ ...o, [p.type]: p.value }), {});
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour === '24' ? '00' : parts.hour}:${parts.minute}`;
};

const emptyForm = (role) => ({
  title: '',
  date: '',
  location: '',
  category: 'Weekly Program',
  description: '',
  img: '',
  audience: role === 'admin' ? 'all' : 'mine',
});

/** Shrinks a chosen photo so the event document stays small. */
const readImage = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onerror = () => reject(new Error('Could not read that file.'));
  reader.onload = (ev) => {
    const img = new Image();
    img.onerror = () => reject(new Error('That image could not be opened.'));
    img.onload = () => {
      const scale = Math.min(1, 1000 / img.width);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.72));
    };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
});

/**
 * Create or edit an event. Used by the Events page and the FOLK calendar.
 *
 * `event` = null creates (optionally pre-filled with `defaultDate`, the
 * 'YYYY-MM-DD' the guide tapped in the calendar); otherwise it edits.
 */
const EventModal = ({ open, onClose, event = null, defaultDate = '', onSaved }) => {
  const { user } = useAuth();
  const editing = !!event;
  const choices = audiencesFor(user?.role);
  const [form, setForm] = useState(() => emptyForm(user?.role));
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setError('');
    if (event) {
      setForm({
        title: event.title || '',
        date: toLocalInput(event.dateISO || event.date),
        location: event.location || '',
        category: event.category || 'Weekly Program',
        description: event.description || '',
        img: event.img || '',
        audience: event.audience || 'all',
      });
    } else {
      const base = emptyForm(user?.role);
      // A day tapped in the calendar opens the form on that day at 6.30pm,
      // when most FOLK programs start.
      setForm({ ...base, date: defaultDate ? `${defaultDate}T18:30` : '' });
    }
  }, [open, event, defaultDate, user?.role]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const onImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('Please choose an image file.'); return; }
    try {
      set('img', await readImage(file));
    } catch (err) {
      setError(err.message);
    }
  };

  const save = async (e) => {
    e.preventDefault();
    const when = new Date(form.date);
    if (!form.title.trim()) { setError('Give the program a title.'); return; }
    if (Number.isNaN(when.getTime())) { setError('Pick a date and time.'); return; }
    setSaving(true);
    setError('');
    try {
      const label = when.toLocaleString('en-IN', {
        weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata',
      });
      const payload = {
        title: form.title.trim(),
        category: form.category,
        location: form.location.trim(),
        description: form.description.trim(),
        img: form.img || '',
        date: label,
        dateISO: when.toISOString(),
        audience: form.audience,
        updatedAt: serverTimestamp(),
      };

      if (editing) {
        await updateDoc(doc(db, 'events', event.id), payload);
      } else {
        await addDoc(collection(db, 'events'), {
          ...payload,
          attendingCount: 0,
          declinedCount: 0,
          ownerId: user?.uid || auth.currentUser?.uid || null,
          ownerName: user?.name || user?.displayName || 'FOLK team',
          groupId: auth.currentUser?.uid || 'system',
          createdAt: serverTimestamp(),
        });
        // Only public events go to the notification bell: everyone signed in
        // can read notifications, so announcing a guide's private program
        // there would show its title to the whole club. Scoped events appear
        // in the right people's calendar instead (and on WhatsApp if the
        // guide broadcasts it).
        if (form.audience === 'all') {
          await addDoc(collection(db, 'notifications'), {
            type: 'new_event',
            title: `New event: ${form.title.trim()}`,
            message: `${form.category}${form.location ? ` at ${form.location.trim()}` : ''} on ${label}.`,
            link: '/events',
            createdAt: serverTimestamp(),
            createdBy: auth.currentUser?.uid || 'system',
          });
        }
      }
      onSaved?.();
      onClose();
    } catch (err) {
      console.error('Save event failed:', err);
      setError(
        err.code === 'permission-denied'
          ? 'You can only create events for your own members or the residency. Ask an admin for a public event.'
          : 'Could not save the event. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!event) return;
    setRemoving(true);
    setError('');
    try {
      await deleteDoc(doc(db, 'events', event.id));
      onSaved?.();
      onClose();
    } catch (err) {
      console.error('Delete event failed:', err);
      setError(err.code === 'permission-denied' ? 'Only the guide who created this event (or an admin) can delete it.' : 'Could not delete the event.');
    } finally {
      setRemoving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Edit program' : 'New program'}
      footer={<>
        {editing && canManageEvent(user, event) && (
          <button type="button" onClick={remove} disabled={removing || saving} className="btn text-red-700 hover:bg-red-50 mr-auto normal-case tracking-normal text-[14px]">
            <Trash2 size={16} /> {removing ? 'Deleting…' : 'Delete'}
          </button>
        )}
        <button type="button" onClick={onClose} className="btn border border-line text-ink hover:bg-paper">Cancel</button>
        <button type="submit" form="event-form" disabled={saving} className="btn-primary">
          {saving ? 'Saving…' : editing ? 'Save changes' : 'Create program'}
        </button>
      </>}
    >
      <form id="event-form" onSubmit={save} className="space-y-4">
        {error && <p role="alert" className="rounded-md bg-red-50 text-red-700 px-4 py-3 text-[15px]">{error}</p>}

        <Field label="Title">
          <input required className={inputClass} value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. Gita circle at the hostel" />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Date & time">
            <input required type="datetime-local" className={inputClass} value={form.date} onChange={(e) => set('date', e.target.value)} />
          </Field>
          <Field label="Category">
            <select className={inputClass} value={form.category} onChange={(e) => set('category', e.target.value)}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
        </div>

        <fieldset>
          <legend className="block mb-1.5 text-[14px] font-semibold text-ink">Who is it for?</legend>
          <div className="grid gap-2 sm:grid-cols-3">
            {choices.map((a) => {
              const Icon = AUDIENCE_ICONS[a.id] || Globe;
              const on = form.audience === a.id;
              return (
                <button
                  key={a.id}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => set('audience', a.id)}
                  className={`text-left rounded-xl border p-3 transition-colors ${on ? 'border-saffron bg-saffron-50 ring-1 ring-saffron/30' : 'border-line hover:bg-paper'}`}
                >
                  <span className={`inline-flex items-center gap-2 font-semibold text-[14px] ${on ? 'text-saffron-dark' : 'text-ink'}`}>
                    <Icon size={16} aria-hidden="true" /> {a.label}
                  </span>
                  <span className="block mt-1 text-[12px] leading-snug text-ink-muted">{a.desc}</span>
                </button>
              );
            })}
          </div>
          {user?.role !== 'admin' && (
            <p className="mt-2 text-[13px] text-ink-muted">Public events go on the website, so an admin creates those.</p>
          )}
        </fieldset>

        <Field label="Location">
          <input className={inputClass} value={form.location} onChange={(e) => set('location', e.target.value)} placeholder="e.g. Temple hall" />
        </Field>

        <Field label="Description">
          <textarea className={textareaClass} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="What will happen, who it's for, what to bring" />
        </Field>

        <Field label="Photo" hint="Optional. A real photo from a past program works best.">
          <div className="flex items-center gap-4">
            <label className="btn border border-line text-ink hover:bg-paper normal-case tracking-normal text-[14px] cursor-pointer">
              <ImagePlus size={17} /> Choose photo
              <input type="file" accept="image/*" className="sr-only" onChange={onImage} />
            </label>
            {form.img && <img src={form.img} alt="Selected" className="h-14 w-24 object-cover rounded-md" />}
            {form.img && (
              <button type="button" onClick={() => set('img', '')} className="text-[13px] font-semibold text-ink-muted hover:text-ink">Remove</button>
            )}
          </div>
        </Field>
      </form>
    </Modal>
  );
};

export default EventModal;
