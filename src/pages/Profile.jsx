import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Camera, Pencil, Save, X, CalendarCheck, CreditCard, UserRound, Download } from 'lucide-react';
import { doc, setDoc, serverTimestamp, where } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '../hooks/useAuth';
import { useFirestore } from '../hooks/useFirestore';
import { db, storage } from '../lib/firebase';
import { compressImage } from '../lib/performance';
import { toDate, formatDay } from '../lib/dates';
import { stageOf, stageLabel } from '../content/journey';
import { normalizePhone } from '../lib/phone';
import { Field, inputClass } from '../components/ui/Modal';

// The only profile fields a member edits themselves. Stage, guide, role and
// sadhana numbers are managed elsewhere (and firestore.rules enforces it).
const EDITABLE = ['name', 'phone', 'email', 'gender', 'dob', 'occupation', 'qualification', 'college', 'city', 'state', 'country', 'fatherName', 'fatherPhone'];

const SECTIONS = [
  { title: 'Personal', fields: [
    ['name', 'Full name', 'text', { required: true, autoComplete: 'name' }],
    ['phone', 'Mobile', 'tel', { required: true, autoComplete: 'tel' }],
    ['email', 'Email', 'email', { autoComplete: 'email' }],
    ['gender', 'Gender', 'select', { options: ['', 'Male', 'Female'] }],
    ['dob', 'Date of birth', 'date', {}],
  ] },
  { title: 'Study & work', fields: [
    ['occupation', 'Occupation', 'text', { placeholder: 'e.g. Student, Software engineer' }],
    ['college', 'College / company', 'text', {}],
    ['qualification', 'Qualification', 'text', { placeholder: 'e.g. B.Tech 3rd year' }],
  ] },
  { title: 'Location', fields: [
    ['city', 'City', 'text', {}],
    ['state', 'State', 'text', {}],
    ['country', 'Country', 'text', {}],
  ] },
  { title: 'Family contact', fields: [
    ['fatherName', "Parent's name", 'text', {}],
    ['fatherPhone', "Parent's mobile", 'tel', {}],
  ] },
];

const initials = (n = '') => n.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() || '').join('') || '?';
const isRealPhoto = (src) => src && !/dicebear|ui-avatars/.test(src);

const Profile = () => {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState('details');
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [photo, setPhoto] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState(null);
  const fileRef = useRef(null);
  const qrRef = useRef(null);

  const mine = useMemo(() => [where('userId', '==', user?.uid || '__none__')], [user?.uid]);
  const { data: attendance, loading: attLoading } = useFirestore('attendance', mine);
  const { data: payments, loading: payLoading } = useFirestore('payments', mine);

  useEffect(() => {
    if (!user) return;
    setForm(Object.fromEntries(EDITABLE.map((k) => [k, user[k] ?? (k === 'name' ? user.displayName || '' : '')])));
    setPhoto(user.photo || user.photoURL || '');
  }, [user]);

  const flash = (message, tone = 'ok') => { setToast({ message, tone }); setTimeout(() => setToast(null), 3500); };

  const save = async (e) => {
    e.preventDefault();
    if (!String(form.name || '').trim() || !String(form.phone || '').trim()) { flash('Name and mobile are required.', 'err'); return; }
    setSaving(true);
    try {
      const data = Object.fromEntries(EDITABLE.map((k) => [k, String(form[k] ?? '').trim()]));
      await setDoc(doc(db, 'users', user.uid), { ...data, phoneNormalized: normalizePhone(data.phone), photo, updatedAt: serverTimestamp() }, { merge: true });
      setEditing(false);
      flash('Profile saved.');
    } catch (err) {
      console.error('Profile save failed:', err);
      flash('Could not save your profile. Please try again.', 'err');
    } finally {
      setSaving(false);
    }
  };

  const onPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { flash('Please choose an image.', 'err'); return; }
    if (file.size > 8 * 1024 * 1024) { flash('That photo is too large (max 8 MB).', 'err'); return; }
    setUploading(true);
    try {
      let blob = file;
      try { blob = await compressImage(file, { maxWidth: 600, maxHeight: 600, quality: 0.75 }); } catch { /* use original */ }
      const r = ref(storage, `profileImages/${user.uid}`);
      await uploadBytes(r, blob);
      const url = await getDownloadURL(r);
      setPhoto(url);
      await setDoc(doc(db, 'users', user.uid), { photo: url, updatedAt: serverTimestamp() }, { merge: true });
      flash('Photo updated.');
    } catch (err) {
      console.error('Photo upload failed:', err);
      flash('Could not upload the photo right now.', 'err');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const downloadQR = () => {
    const svg = qrRef.current?.querySelector('svg');
    if (!svg) return;
    const data = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = 420; c.height = 520;
      const x = c.getContext('2d');
      x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height);
      x.drawImage(img, 30, 30, 360, 360);
      x.fillStyle = '#101217'; x.font = 'bold 22px Montserrat, sans-serif'; x.textAlign = 'center';
      x.fillText(form.name || 'Member', c.width / 2, 440);
      x.fillStyle = '#5B6170'; x.font = '15px sans-serif';
      x.fillText('FOLK Vizag member ID', c.width / 2, 472);
      const a = document.createElement('a');
      a.download = `FOLK-ID-${(form.name || 'member').replace(/\s+/g, '-')}.png`;
      a.href = c.toDataURL('image/png');
      a.click();
    };
    img.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(data)))}`;
  };

  const stage = stageOf(user);
  const memberSince = toDate(user?.createdAt);

  return (
    <div className="space-y-6">
      {toast && (
        <div role={toast.tone === 'err' ? 'alert' : 'status'} className={`fixed z-[210] left-1/2 -translate-x-1/2 bottom-24 lg:bottom-8 rounded-md px-4 py-3 text-[15px] shadow-premium-xl ${toast.tone === 'err' ? 'bg-red-600 text-white' : 'bg-ink text-white'}`}>
          {toast.message}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Identity + QR */}
        <section className="card p-6 lg:row-span-2 flex flex-col items-center text-center">
          <div className="relative">
            <span className="w-24 h-24 rounded-full bg-navy text-white font-display text-3xl font-bold inline-flex items-center justify-center overflow-hidden">
              {isRealPhoto(photo) ? <img src={photo} alt="" className="w-full h-full object-cover" /> : initials(form.name || user?.displayName)}
            </span>
            <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} aria-label="Change photo"
              className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-saffron text-white inline-flex items-center justify-center border-2 border-white disabled:opacity-60">
              <Camera size={16} />
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={onPhoto} />
          </div>
          <h1 className="mt-4 font-display text-2xl font-bold user-text">{form.name || 'Member'}</h1>
          <p className="mt-1 inline-flex items-center gap-2 h-7 px-3 rounded-full bg-navy-50 text-navy-700 font-display text-[12px] font-bold uppercase tracking-label">{stageLabel(stage)}</p>
          {memberSince && <p className="mt-2 text-[14px] text-ink-muted">Member since {memberSince.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</p>}

          <div className="mt-6 w-full border-t border-line pt-6">
            <p className="font-display text-[13px] font-bold uppercase tracking-label text-ink-muted">Check-in QR</p>
            {user?.qrToken ? (
              <>
                <div ref={qrRef} className="mt-4 inline-block p-3 bg-white border border-line rounded-lg">
                  <QRCodeSVG value={user.qrToken} size={200} level="M" />
                </div>
                <p className="mt-2 text-[13px] text-ink-muted">ID {String(user.qrToken).slice(0, 8).toUpperCase()}</p>
                <button type="button" onClick={downloadQR} className="btn border border-line text-ink hover:bg-paper normal-case tracking-normal text-[14px] mt-4">
                  <Download size={16} /> Save to phone
                </button>
              </>
            ) : (
              <p className="mt-3 text-ink-muted">Your QR is being set up. Refresh in a moment.</p>
            )}
          </div>
        </section>

        {/* Tabs */}
        <section className="card lg:col-span-2 overflow-hidden">
          <div className="flex border-b border-line overflow-x-auto scrollbar-hide" role="tablist">
            {[['details', 'Details', UserRound], ['attendance', 'Attendance', CalendarCheck], ['payments', 'Payments', CreditCard]].map(([id, label, Icon]) => (
              <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)}
                className={`shrink-0 h-12 px-5 inline-flex items-center gap-2 font-semibold border-b-2 -mb-px ${tab === id ? 'border-saffron text-ink' : 'border-transparent text-ink-muted hover:text-ink'}`}>
                <Icon size={17} /> {label}
              </button>
            ))}
          </div>

          <div className="p-5 sm:p-6">
            {tab === 'details' && (
              <form onSubmit={save}>
                <div className="flex justify-end gap-2 -mt-1 mb-2">
                  {editing ? (
                    <>
                      <button type="button" onClick={() => { setEditing(false); setForm(Object.fromEntries(EDITABLE.map((k) => [k, user?.[k] ?? '']))); }} className="btn border border-line text-ink hover:bg-paper normal-case tracking-normal text-[14px] min-h-[40px]"><X size={16} /> Cancel</button>
                      <button type="submit" disabled={saving} className="btn-primary min-h-[40px]"><Save size={16} /> {saving ? 'Saving…' : 'Save'}</button>
                    </>
                  ) : (
                    <button type="button" onClick={() => setEditing(true)} className="btn border border-line text-ink hover:bg-paper normal-case tracking-normal text-[14px] min-h-[40px]"><Pencil size={16} /> Edit</button>
                  )}
                </div>
                <div className="space-y-7">
                  {SECTIONS.map((s) => (
                    <fieldset key={s.title}>
                      <legend className="font-display text-[13px] font-bold uppercase tracking-label text-ink-muted">{s.title}</legend>
                      <div className="mt-3 grid gap-4 sm:grid-cols-2">
                        {s.fields.map(([k, label, type, opts]) => (
                          editing ? (
                            <Field key={k} label={label}>
                              {type === 'select' ? (
                                <select className={inputClass} value={form[k] || ''} onChange={(e) => setForm({ ...form, [k]: e.target.value })}>
                                  {opts.options.map((o) => <option key={o} value={o}>{o || 'Prefer not to say'}</option>)}
                                </select>
                              ) : (
                                <input type={type} className={inputClass} value={form[k] || ''} required={opts.required} autoComplete={opts.autoComplete} placeholder={opts.placeholder}
                                  onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
                              )}
                            </Field>
                          ) : (
                            <div key={k}>
                              <p className="text-[13px] text-ink-muted">{label}</p>
                              <p className="mt-0.5 font-semibold user-text">{type === 'date' && form[k] ? formatDay(new Date(`${form[k]}T12:00:00+05:30`)) : form[k] || <span className="font-normal text-ink-muted">Not added</span>}</p>
                            </div>
                          )
                        ))}
                      </div>
                    </fieldset>
                  ))}
                </div>
              </form>
            )}

            {tab === 'attendance' && (
              attLoading ? <div className="h-32 rounded-md bg-paper animate-pulse" /> : attendance.length ? (
                <ul className="divide-y divide-line">
                  {attendance.slice().sort((a, b) => (toDate(b.createdAt)?.getTime() || 0) - (toDate(a.createdAt)?.getTime() || 0)).map((a) => (
                    <li key={a.id} className="py-3 flex items-center justify-between gap-3">
                      <span className="min-w-0"><span className="block font-semibold truncate">{a.session || a.eventTitle || 'Program'}</span><span className="text-[14px] text-ink-muted">{formatDay(toDate(a.createdAt || a.timestamp))}</span></span>
                      <span className="shrink-0 text-[12px] font-bold uppercase tracking-label text-green-700 bg-green-50 rounded-full px-2.5 py-1">Present</span>
                    </li>
                  ))}
                </ul>
              ) : <p className="text-ink-muted">When staff scan your QR at a program, it will be recorded here.</p>
            )}

            {tab === 'payments' && (
              payLoading ? <div className="h-32 rounded-md bg-paper animate-pulse" /> : payments.length ? (
                <ul className="divide-y divide-line">
                  {payments.slice().sort((a, b) => (toDate(b.createdAt)?.getTime() || 0) - (toDate(a.createdAt)?.getTime() || 0)).map((p) => {
                    const status = String(p.status || 'pending').toLowerCase();
                    const tone = status === 'completed' ? 'text-green-700 bg-green-50' : status === 'failed' || status === 'amount_mismatch' ? 'text-red-700 bg-red-50' : 'text-amber-700 bg-amber-50';
                    return (
                      <li key={p.id} className="py-3 flex items-center justify-between gap-3">
                        <span className="min-w-0"><span className="block font-semibold truncate">{p.purpose === 'trip' ? 'Yatra booking' : p.sevaType || 'Donation'}</span><span className="text-[14px] text-ink-muted">{formatDay(toDate(p.createdAt))}</span></span>
                        <span className="text-right shrink-0">
                          <span className="block font-display font-bold">₹{Number(p.amount || 0).toLocaleString('en-IN')}</span>
                          <span className={`text-[12px] font-bold uppercase tracking-label rounded-full px-2 py-0.5 ${tone}`}>{status === 'amount_mismatch' ? 'Needs review' : status}</span>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              ) : <p className="text-ink-muted">Your donations and yatra payments will show up here.</p>
            )}
          </div>
        </section>
      </div>

      <button type="button" onClick={logout} className="lg:hidden btn border border-line text-ink hover:bg-paper w-full">Sign out</button>
    </div>
  );
};

export default Profile;
