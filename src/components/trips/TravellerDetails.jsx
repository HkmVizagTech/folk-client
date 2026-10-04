import { useEffect, useMemo, useState } from 'react';
import { Check, Loader2, IdCard, AlertTriangle } from 'lucide-react';
import { doc, updateDoc, serverTimestamp } from '../../lib/pgstore';
import { db } from '../../lib/firebase';

/**
 * Who is travelling, filled in after the seat is booked.
 *
 * Booking itself asks for almost nothing, so a boy can take a seat in
 * seconds; the team needs rather more to buy bus and train tickets. Asking
 * for it here, once the seat is safe, means nobody abandons the booking
 * half-way through a long form.
 *
 * ID details are typed, never photographed: the file store behind this app
 * serves anything uploaded to it at a public link, which is no place for
 * somebody's Aadhaar card. A number, a name and an age are what a ticket
 * needs anyway.
 */

const ID_TYPES = [
  { id: '', label: 'Select' },
  { id: 'aadhaar', label: 'Aadhaar' },
  { id: 'pan', label: 'PAN' },
  { id: 'passport', label: 'Passport' },
  { id: 'voter', label: 'Voter ID' },
  { id: 'driving', label: 'Driving licence' },
  { id: 'student', label: 'Student ID' },
  { id: 'other', label: 'Other' },
];

const GENDERS = ['Male', 'Female'];

const blank = () => ({ name: '', age: '', gender: '', idType: '', idNumber: '', college: '', course: '', year: '' });

// Most FOLK members are students, so the year is a short list rather than a
// free-text box — quicker on a phone, and tidier for the team afterwards.
const YEARS = ['1st year', '2nd year', '3rd year', '4th year', '5th year', 'Postgraduate', 'Working', 'Other'];

/** Everything a ticket needs, for every seat. */
export const detailsComplete = (registration) => {
  const seats = parseInt(registration?.seats, 10) || 0;
  const list = registration?.travellers || [];
  if (!seats || list.length < seats) return false;
  return list.slice(0, seats).every((t) => String(t?.name || '').trim() && Number(t?.age) > 0 && t?.gender);
};

const field = 'w-full min-w-0 min-h-[46px] px-3.5 py-2.5 bg-cream/30 border border-saffron/10 rounded-xl outline-none focus:bg-white focus:border-saffron/40 transition-all font-medium text-[15px]';
const label = 'block text-[10px] font-black text-gray-400 uppercase tracking-[0.16em] ml-1 mb-1.5';

const TravellerDetails = ({ registration, tripTitle }) => {
  const seats = parseInt(registration?.seats, 10) || 1;
  const [rows, setRows] = useState(() => Array.from({ length: seats }, (_, i) => ({ ...blank(), ...(registration?.travellers?.[i] || {}) })));
  const [emergency, setEmergency] = useState(registration?.emergencyContact || '');
  const [pickup, setPickup] = useState(registration?.pickup || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setRows(Array.from({ length: seats }, (_, i) => ({ ...blank(), ...(registration?.travellers?.[i] || {}) })));
    setEmergency(registration?.emergencyContact || '');
    setPickup(registration?.pickup || '');
  }, [registration?.id, registration?.travellers, registration?.emergencyContact, registration?.pickup, seats]);

  const done = useMemo(() => detailsComplete(registration), [registration]);
  const set = (i, k, v) => setRows((r) => r.map((row, idx) => (idx === i ? { ...row, [k]: v } : row)));

  const save = async (e) => {
    e.preventDefault();
    const missing = rows.findIndex((t) => !String(t.name || '').trim() || !(Number(t.age) > 0));
    if (missing !== -1) {
      setError(`Traveller ${missing + 1} still needs a name and age.`);
      return;
    }
    setSaving(true);
    setError('');
    try {
      await updateDoc(doc(db, 'trip_registrations', registration.id), {
        travellers: rows.map((t) => ({
          name: String(t.name || '').trim().slice(0, 80),
          age: Number(t.age) || null,
          gender: t.gender || '',
          idType: t.idType || '',
          idNumber: String(t.idNumber || '').trim().slice(0, 40),
          college: String(t.college || '').trim().slice(0, 120),
          course: String(t.course || '').trim().slice(0, 80),
          year: t.year || '',
        })),
        emergencyContact: String(emergency || '').trim().slice(0, 120),
        pickup: String(pickup || '').trim().slice(0, 120),
        updatedAt: serverTimestamp(),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 4000);
    } catch (err) {
      console.error('Saving traveller details failed:', err);
      setError(err.code === 'permission-denied' ? 'Those details could not be saved against this booking.' : 'Could not save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className={`rounded-2xl border p-5 sm:p-6 ${done ? 'border-emerald-200 bg-emerald-50/40' : 'border-saffron/30 bg-saffron-50/50'}`}>
      <div className="flex items-start gap-3">
        <span className={`w-10 h-10 shrink-0 rounded-xl inline-flex items-center justify-center ${done ? 'bg-emerald-100 text-emerald-700' : 'bg-saffron text-white'}`}>
          {done ? <Check size={20} /> : <IdCard size={20} />}
        </span>
        <div className="min-w-0">
          <h3 className="font-display text-lg font-bold text-gray-900">
            {done ? 'Travel details received' : 'We need your travel details'}
          </h3>
          <p className="mt-0.5 text-[14px] text-gray-500 font-medium">
            {done
              ? 'Thank you — the team has what it needs to book your tickets. You can still correct anything below.'
              : `Your seat for ${tripTitle || 'the yatra'} is held. The team needs these to book tickets.`}
          </p>
        </div>
      </div>

      <form onSubmit={save} className="mt-5 space-y-5">
        {rows.map((t, i) => (
          <div key={i} className="rounded-xl border border-saffron/10 bg-white/70 p-4">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-saffron-dark mb-3">
              Traveller {i + 1}{i === 0 ? ' (you)' : ''}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className={label} htmlFor={`t${i}-name`}>Full name, as on the ID</label>
                <input id={`t${i}-name`} className={field} value={t.name} onChange={(e) => set(i, 'name', e.target.value)} placeholder="e.g. Ravi Kumar" />
              </div>
              <div>
                <label className={label} htmlFor={`t${i}-age`}>Age</label>
                <input id={`t${i}-age`} type="number" min={1} max={120} inputMode="numeric" className={field} value={t.age} onChange={(e) => set(i, 'age', e.target.value)} placeholder="21" />
              </div>
              <div>
                <label className={label} htmlFor={`t${i}-gender`}>Gender</label>
                <select id={`t${i}-gender`} className={field} value={t.gender} onChange={(e) => set(i, 'gender', e.target.value)}>
                  <option value="">Select</option>
                  {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className={label} htmlFor={`t${i}-idtype`}>ID type</label>
                <select id={`t${i}-idtype`} className={field} value={t.idType} onChange={(e) => set(i, 'idType', e.target.value)}>
                  {ID_TYPES.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className={label} htmlFor={`t${i}-idnum`}>ID number</label>
                <input id={`t${i}-idnum`} className={field} value={t.idNumber} onChange={(e) => set(i, 'idNumber', e.target.value)} placeholder="As printed on the ID" />
              </div>

              <div className="sm:col-span-2">
                <label className={label} htmlFor={`t${i}-college`}>College or workplace</label>
                <input id={`t${i}-college`} className={field} value={t.college} onChange={(e) => set(i, 'college', e.target.value)} placeholder="e.g. Andhra University" />
              </div>
              <div>
                <label className={label} htmlFor={`t${i}-course`}>Course</label>
                <input id={`t${i}-course`} className={field} value={t.course} onChange={(e) => set(i, 'course', e.target.value)} placeholder="e.g. B.Tech CSE" />
              </div>
              <div>
                <label className={label} htmlFor={`t${i}-year`}>Year</label>
                <select id={`t${i}-year`} className={field} value={t.year} onChange={(e) => set(i, 'year', e.target.value)}>
                  <option value="">Select</option>
                  {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>
          </div>
        ))}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={label} htmlFor="td-emergency">Emergency contact</label>
            <input id="td-emergency" className={field} value={emergency} onChange={(e) => setEmergency(e.target.value)} placeholder="Name & number of someone at home" />
          </div>
          <div>
            <label className={label} htmlFor="td-pickup">Boarding point (optional)</label>
            <input id="td-pickup" className={field} value={pickup} onChange={(e) => setPickup(e.target.value)} placeholder="e.g. RTC Complex" />
          </div>
        </div>

        <p className="text-[12px] text-gray-500 font-medium leading-relaxed">
          Only the FOLK team can see these, and they are used for your travel tickets. Please type the number rather than sending a photo of the card.
        </p>

        {error && (
          <p role="alert" className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-[14px] text-red-700">
            <AlertTriangle size={16} className="shrink-0" /> {error}
          </p>
        )}

        <button type="submit" disabled={saving} className="btn-primary w-full sm:w-auto">
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
          {saving ? 'Saving…' : saved ? 'Saved' : done ? 'Update details' : 'Save travel details'}
        </button>
      </form>
    </section>
  );
};

export default TravellerDetails;
