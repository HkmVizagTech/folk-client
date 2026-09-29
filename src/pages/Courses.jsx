import React, { useMemo, useState } from 'react';
import { GraduationCap, Plus, CheckCircle2, Users, Pencil, Minus } from 'lucide-react';
import { collection, addDoc, doc, setDoc, updateDoc, where, serverTimestamp, increment } from 'firebase/firestore';
import { useAuth } from '../hooks/useAuth';
import { useFirestore } from '../hooks/useFirestore';
import { db } from '../lib/firebase';
import Modal, { Field, inputClass, textareaClass } from '../components/ui/Modal';

const EMPTY = { title: '', description: '', sessions: 6, schedule: '', active: true };

const Progress = ({ done, total }) => {
  const pct = total ? Math.min(100, Math.round((done / total) * 100)) : 0;
  return (
    <div>
      <div className="h-2 rounded-full bg-paper overflow-hidden" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className={`h-full ${pct >= 100 ? 'bg-green-600' : 'bg-saffron'}`} style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-1 text-[13px] text-ink-muted">{done} of {total} sessions</p>
    </div>
  );
};

/** Staff view of one course's enrolments. */
const Roster = ({ course }) => {
  const q = useMemo(() => [where('courseId', '==', course.id)], [course.id]);
  const { data, loading } = useFirestore('enrollments', q);
  const [err, setErr] = useState('');
  const rows = data.slice().sort((a, b) => String(a.userName).localeCompare(String(b.userName)));

  const bump = async (e, delta) => {
    setErr('');
    const next = Math.max(0, Math.min(course.sessions || 0, (e.sessionsAttended || 0) + delta));
    try {
      await updateDoc(doc(db, 'enrollments', e.id), {
        sessionsAttended: increment(next - (e.sessionsAttended || 0)),
        status: next >= (course.sessions || 0) ? 'completed' : 'enrolled',
        updatedAt: serverTimestamp(),
      });
    } catch (x) { console.error(x); setErr('Could not update. Please try again.'); }
  };

  if (loading) return <div className="h-24 rounded-md bg-paper animate-pulse" />;
  if (!rows.length) return <p className="text-ink-muted">Nobody has enrolled yet.</p>;
  return (
    <>
      {err && <p role="alert" className="mb-3 rounded-md bg-red-50 text-red-700 px-3 py-2">{err}</p>}
      <ul className="divide-y divide-line">
        {rows.map((e) => (
          <li key={e.id} className="py-3 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{e.userName || 'Member'} {e.status === 'completed' && <CheckCircle2 size={16} className="inline text-green-600 -mt-0.5" />}</p>
              <Progress done={e.sessionsAttended || 0} total={course.sessions || 0} />
            </div>
            <div className="flex gap-1">
              <button type="button" onClick={() => bump(e, -1)} aria-label="One session less" className="w-9 h-9 inline-flex items-center justify-center rounded-md border border-line hover:bg-paper"><Minus size={16} /></button>
              <button type="button" onClick={() => bump(e, 1)} aria-label="Mark a session attended" className="w-9 h-9 inline-flex items-center justify-center rounded-md border border-line hover:bg-paper"><Plus size={16} /></button>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
};

const Courses = () => {
  const { user } = useAuth();
  const isStaff = user?.role === 'admin' || user?.role === 'folks_head';
  const { data: courses, loading } = useFirestore('courses');
  const mineQ = useMemo(() => [where('userId', '==', user?.uid || '__none__')], [user?.uid]);
  const { data: myEnrollments } = useFirestore('enrollments', mineQ);
  const enrolledBy = useMemo(() => new Map(myEnrollments.map((e) => [e.courseId, e])), [myEnrollments]);

  const [editing, setEditing] = useState(null); // course | 'new'
  const [form, setForm] = useState(EMPTY);
  const [roster, setRoster] = useState(null);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  const visible = courses
    .filter((c) => isStaff || c.active !== false)
    .sort((a, b) => Number(b.active !== false) - Number(a.active !== false) || String(a.title).localeCompare(String(b.title)));

  const enroll = async (c) => {
    setBusy(c.id);
    setError('');
    try {
      // Deterministic id: enrolling twice is a no-op, not a duplicate.
      await setDoc(doc(db, 'enrollments', `${c.id}_${user.uid}`), {
        courseId: c.id,
        courseTitle: c.title,
        userId: user.uid,
        userName: user.name || user.displayName || 'Member',
        userPhone: user.phone || '',
        status: 'enrolled',
        sessionsAttended: 0,
        createdAt: serverTimestamp(),
      });
    } catch (e) {
      console.error('Enroll failed:', e);
      setError('Could not enroll. Please try again.');
    } finally {
      setBusy('');
    }
  };

  const openEdit = (c) => {
    setError('');
    setForm(c === 'new' ? EMPTY : { title: c.title || '', description: c.description || '', sessions: c.sessions || 6, schedule: c.schedule || '', active: c.active !== false });
    setEditing(c);
  };

  const save = async (e) => {
    e.preventDefault();
    const sessions = parseInt(form.sessions, 10);
    if (!form.title.trim() || !Number.isInteger(sessions) || sessions < 1 || sessions > 100) { setError('Add a title and between 1 and 100 sessions.'); return; }
    setBusy('save');
    try {
      const data = { title: form.title.trim(), description: form.description.trim(), sessions, schedule: form.schedule.trim(), active: !!form.active, updatedAt: serverTimestamp() };
      if (editing === 'new') await addDoc(collection(db, 'courses'), { ...data, createdAt: serverTimestamp(), createdBy: user.uid });
      else await updateDoc(doc(db, 'courses', editing.id), data);
      setEditing(null);
    } catch (err) {
      console.error('Course save failed:', err);
      setError('Could not save the course.');
    } finally {
      setBusy('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="display-lg">Courses</h1>
          <p className="mt-1 text-ink-muted">Step-by-step courses on the Bhagavad-gita, meditation and spiritual life.</p>
        </div>
        {isStaff && <button type="button" onClick={() => openEdit('new')} className="btn-primary"><Plus size={17} /> New course</button>}
      </div>

      {error && !editing && <p role="alert" className="rounded-md bg-red-50 text-red-700 px-4 py-3">{error}</p>}

      {loading ? <div className="grid gap-5 md:grid-cols-2"><div className="card h-56 animate-pulse" /><div className="card h-56 animate-pulse" /></div> : visible.length === 0 ? (
        <div className="card p-10 text-center">
          <GraduationCap size={36} className="mx-auto text-ink-muted" />
          <p className="mt-4 font-display font-bold">No courses open right now</p>
          <p className="mt-1 text-ink-muted">{isStaff ? 'Create the first course with “New course”.' : 'New courses are announced here and on WhatsApp.'}</p>
        </div>
      ) : (
        <ul className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((c) => {
            const mine = enrolledBy.get(c.id);
            return (
              <li key={c.id} className={`card p-5 sm:p-6 flex flex-col ${c.active === false ? 'opacity-70' : ''}`}>
                <div className="flex items-start justify-between gap-3">
                  <span className="w-11 h-11 rounded-md bg-navy text-white inline-flex items-center justify-center shrink-0"><GraduationCap size={22} /></span>
                  {c.active === false && <span className="text-[12px] font-bold uppercase tracking-label text-ink-muted">Closed</span>}
                </div>
                <h2 className="mt-4 font-display text-xl font-bold leading-snug user-text">{c.title}</h2>
                <p className="mt-1 text-[14px] text-ink-muted">{c.sessions} sessions{c.schedule ? ` · ${c.schedule}` : ''}</p>
                {c.description && <p className="mt-3 text-[15px] leading-relaxed user-text">{c.description}</p>}
                <div className="mt-auto pt-5 space-y-3">
                  {mine ? (
                    mine.status === 'completed'
                      ? <p className="flex items-center gap-2 text-green-700 font-semibold"><CheckCircle2 size={18} /> Completed. Jaya!</p>
                      : <Progress done={mine.sessionsAttended || 0} total={c.sessions || 0} />
                  ) : c.active !== false && (
                    <button type="button" onClick={() => enroll(c)} disabled={busy === c.id} className="btn-dark w-full">{busy === c.id ? 'Enrolling…' : 'Enroll'}</button>
                  )}
                  {isStaff && (
                    <div className="grid grid-cols-2 gap-2">
                      <button type="button" onClick={() => setRoster(c)} className="btn border border-line text-ink hover:bg-paper min-h-[40px] normal-case tracking-normal text-[14px]"><Users size={16} /> Participants</button>
                      <button type="button" onClick={() => openEdit(c)} className="btn border border-line text-ink hover:bg-paper min-h-[40px] normal-case tracking-normal text-[14px]"><Pencil size={16} /> Edit</button>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing === 'new' ? 'New course' : 'Edit course'}
        footer={<>
          <button type="button" onClick={() => setEditing(null)} className="btn border border-line text-ink hover:bg-paper">Cancel</button>
          <button type="submit" form="course-form" disabled={busy === 'save'} className="btn-primary">{busy === 'save' ? 'Saving…' : 'Save'}</button>
        </>}>
        <form id="course-form" onSubmit={save} className="space-y-4">
          {error && <p role="alert" className="rounded-md bg-red-50 text-red-700 px-3 py-2">{error}</p>}
          <Field label="Title"><input required className={inputClass} value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. Bhagavad-gita: an introduction" /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Number of sessions"><input type="number" min={1} max={100} className={inputClass} value={form.sessions} onChange={(e) => setForm((f) => ({ ...f, sessions: e.target.value }))} /></Field>
            <Field label="Schedule"><input className={inputClass} value={form.schedule} onChange={(e) => setForm((f) => ({ ...f, schedule: e.target.value }))} placeholder="e.g. Saturdays, 6 pm" /></Field>
          </div>
          <Field label="Description"><textarea className={textareaClass} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} /></Field>
          <label className="flex items-center gap-3">
            <input type="checkbox" checked={form.active} onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))} className="w-5 h-5 accent-navy" />
            <span>Open for enrolment</span>
          </label>
        </form>
      </Modal>

      <Modal open={!!roster} onClose={() => setRoster(null)} title={roster ? `${roster.title} · participants` : ''} size="lg">
        {roster && <Roster course={roster} />}
      </Modal>
    </div>
  );
};

export default Courses;
