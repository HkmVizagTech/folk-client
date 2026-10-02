import { useEffect, useState } from 'react';
import { collection, addDoc, serverTimestamp } from '../../lib/pgstore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../hooks/useAuth';
import { normalizePhone, isValidIndianPhone } from '../../lib/phone';
import Modal, { Field, inputClass, textareaClass } from '../ui/Modal';

/**
 * Take down someone who has come for the first time and has no account yet.
 *
 * Deliberately short — it is filled in at the door, often with the person
 * standing there. A name is enough to record the visit; the mobile number is
 * what lets the team welcome them afterwards, so it is strongly encouraged
 * but not forced (some people would rather not give it on day one).
 */
const VisitorModal = ({ open, onClose, eventId, eventTitle, onSaved }) => {
  const { user } = useAuth();
  const [form, setForm] = useState({ name: '', phone: '', note: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) { setForm({ name: '', phone: '', note: '' }); setError(''); }
  }, [open]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async (e) => {
    e.preventDefault();
    const name = form.name.trim();
    const phone = form.phone.trim();
    if (!name) { setError('Please write their name.'); return; }
    if (phone && !isValidIndianPhone(phone)) { setError('That mobile number does not look right. Use 10 digits, or leave it blank.'); return; }
    setSaving(true);
    setError('');
    try {
      await addDoc(collection(db, 'visitors'), {
        name: name.slice(0, 80),
        phone,
        // Same shape as users/{uid}.phoneNormalized, so the team can tell
        // later whether this person has since created an account.
        phoneNormalized: phone ? normalizePhone(phone) : '',
        eventId,
        eventTitle: eventTitle || 'Program',
        note: form.note.trim().slice(0, 500),
        status: 'new',
        createdBy: user?.uid || null,
        createdByName: user?.name || user?.displayName || 'Team',
        createdAt: serverTimestamp(),
      });
      onSaved?.();
      onClose();
    } catch (err) {
      console.error('Save visitor failed:', err);
      setError(err.code === 'permission-denied' ? 'Only the FOLK team can add a first-timer.' : 'Could not save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="First time here"
      footer={<>
        <button type="button" onClick={onClose} className="btn border border-line text-ink hover:bg-paper">Cancel</button>
        <button type="submit" form="visitor-form" disabled={saving} className="btn-primary">{saving ? 'Saving…' : 'Add first-timer'}</button>
      </>}
    >
      <form id="visitor-form" onSubmit={save} className="space-y-4">
        {error && <p role="alert" className="rounded-md bg-red-50 text-red-700 px-4 py-3 text-[15px]">{error}</p>}

        <p className="text-[15px] text-ink-muted">
          For someone who has come to <span className="font-semibold text-ink user-text">{eventTitle || 'this program'}</span> for the first time and has no FOLK account yet.
        </p>

        <Field label="Name">
          <input required autoFocus className={inputClass} value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Ravi Kumar" />
        </Field>

        <Field label="Mobile" hint="So a FOLK guide can welcome them afterwards. You can leave it blank.">
          <input type="tel" inputMode="tel" className={inputClass} value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="10-digit mobile" />
        </Field>

        <Field label="Anything to remember" hint="Optional — college, who brought them, what they asked about.">
          <textarea className={textareaClass} value={form.note} onChange={(e) => set('note', e.target.value)} placeholder="e.g. 2nd year at Andhra University, came with Giri" />
        </Field>
      </form>
    </Modal>
  );
};

export default VisitorModal;
