import React, { useMemo, useState } from 'react';
import { Search, Plus, Download, Pencil, Trash2, QrCode, UserPlus, Layers, MessageCircle, X } from 'lucide-react';
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '../hooks/useAuth';
import { useMembers } from '../hooks/useMembers';
import { db } from '../lib/firebase';
import { STAGES, stageLabel } from '../content/journey';
import { normalizePhone, formatPhone, whatsappUrl } from '../lib/phone';
import { todayIST, daysBetween } from '../lib/dates';
import Modal, { Field, inputClass } from '../components/ui/Modal';

const EMPTY = { name: '', phone: '', city: '', address: '', stage: 'new', guideId: '', role: 'devotee' };

const lastChant = (m) => {
  if (!m.lastSadhanaDate) return { label: 'Never', tone: 'text-ink-muted' };
  const d = daysBetween(m.lastSadhanaDate, todayIST());
  if (d === 0) return { label: 'Today', tone: 'text-green-700' };
  if (d === 1) return { label: 'Yesterday', tone: 'text-green-700' };
  return { label: `${d} days ago`, tone: d > 7 ? 'text-red-700' : 'text-amber-700' };
};

const StageChip = ({ stage }) => (
  <span className="inline-flex h-6 items-center px-2.5 rounded-full bg-navy-50 text-navy-700 text-[12px] font-bold">{stageLabel(stage)}</span>
);

const Devotees = () => {
  const { user: me } = useAuth();
  const isAdmin = me?.role === 'admin';
  const { members, staff, loading } = useMembers();

  const [q, setQ] = useState('');
  const [stage, setStage] = useState('all');
  const [guide, setGuide] = useState('all');
  const [selected, setSelected] = useState(new Set());
  const [editing, setEditing] = useState(null); // member | 'new' | null
  const [form, setForm] = useState(EMPTY);
  const [bulk, setBulk] = useState(null); // 'guide' | 'stage'
  const [bulkValue, setBulkValue] = useState('');
  const [qrFor, setQrFor] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const staffById = useMemo(() => new Map(staff.map((s) => [s.id, s])), [staff]);

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const digits = needle.replace(/\D/g, '');
    return members.filter((m) => {
      if (stage !== 'all' && m.stage !== stage) return false;
      if (guide === 'none' && (m.guideId || m.isStaff)) return false;
      if (guide !== 'all' && guide !== 'none' && m.guideId !== guide) return false;
      if (!needle) return true;
      return m.displayName.toLowerCase().includes(needle) || (digits.length >= 3 && normalizePhone(m.phone).includes(digits));
    });
  }, [members, q, stage, guide]);

  // A FOLK guide may only edit plain members (firestore.rules enforces this too).
  const canEdit = (m) => isAdmin || m.role === 'devotee' || !m.role;
  const editable = list.filter(canEdit);
  const allSelected = editable.length > 0 && editable.every((m) => selected.has(m.id));
  const toggle = (id) => setSelected((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(editable.map((m) => m.id)));

  const guideFields = (guideId) => {
    const g = staffById.get(guideId);
    return g
      ? { guideId: g.id, guideName: g.displayName, guidePhone: g.phone || '' }
      : { guideId: '', guideName: '', guidePhone: '' };
  };

  const openEdit = (m) => {
    setError('');
    if (m === 'new') { setForm(EMPTY); setEditing('new'); return; }
    setForm({ name: m.displayName, phone: m.phone || '', city: m.city || '', address: m.address || '', stage: m.stage, guideId: m.guideId || '', role: m.role || 'devotee' });
    setEditing(m);
  };

  const save = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Name is required.'); return; }
    setBusy(true);
    setError('');
    try {
      const data = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        phoneNormalized: normalizePhone(form.phone),
        city: form.city.trim(),
        address: form.address.trim(),
        stage: form.stage,
        ...guideFields(form.guideId),
        updatedAt: serverTimestamp(),
      };
      if (editing === 'new') {
        await addDoc(collection(db, 'users'), {
          ...data,
          role: 'devotee',
          qrToken: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `FOLK-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
          createdAt: serverTimestamp(),
          createdBy: me.uid,
        });
      } else {
        await updateDoc(doc(db, 'users', editing.id), isAdmin ? { ...data, role: form.role } : data);
      }
      setEditing(null);
    } catch (err) {
      console.error('Save member failed:', err);
      setError(err.code === 'permission-denied' ? "You don't have permission to change this profile." : 'Could not save. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const applyBulk = async () => {
    if (!bulk || !selected.size) return;
    setBusy(true);
    setError('');
    try {
      const ids = [...selected];
      // Firestore batches hold at most 500 writes.
      for (let i = 0; i < ids.length; i += 450) {
        const batch = writeBatch(db);
        ids.slice(i, i + 450).forEach((id) => batch.update(doc(db, 'users', id), {
          ...(bulk === 'guide' ? guideFields(bulkValue) : { stage: bulkValue }),
          updatedAt: serverTimestamp(),
        }));
        await batch.commit();
      }
      setBulk(null);
      setSelected(new Set());
    } catch (err) {
      console.error('Bulk update failed:', err);
      setError('Some members could not be updated. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (m) => {
    if (!window.confirm(`Delete ${m.displayName}'s profile? This cannot be undone.`)) return;
    try { await deleteDoc(doc(db, 'users', m.id)); } catch (err) { console.error(err); setError('Could not delete this profile.'); }
  };

  // QR tokens are left out on purpose: anyone holding one can check in as that member.
  const exportCSV = () => {
    const rows = [['Name', 'Phone', 'City', 'Stage', 'Guide', 'Role', 'Streak', 'Last chanted']]
      .concat(list.map((m) => [m.displayName, formatPhone(m.phone), m.city || '', stageLabel(m.stage), m.guideName || '', m.role || 'devotee', m.streak || 0, m.lastSadhanaDate || '']));
    const csv = rows.map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([String.fromCharCode(0xFEFF) + csv], { type: 'text/csv;charset=utf-8;' }));
    const a = Object.assign(document.createElement('a'), { href: url, download: `folk-members-${todayIST()}.csv` });
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="display-lg">Members</h1>
          <p className="mt-1 text-ink-muted">{members.length} profiles · {members.filter((m) => !m.isStaff && !m.guideId).length} without a guide</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={exportCSV} className="btn border border-line bg-white text-ink hover:bg-paper normal-case tracking-normal text-[14px]"><Download size={16} /> Export</button>
          <button type="button" onClick={() => openEdit('new')} className="btn-primary"><Plus size={17} /> Add member</button>
        </div>
      </div>

      <div className="card p-3 sm:p-4 grid gap-3 md:grid-cols-[1fr_12rem_14rem]">
        <label className="relative">
          <span className="sr-only">Search</span>
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input className={`${inputClass} pl-10`} placeholder="Search name or phone" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
        <select aria-label="Stage" className={inputClass} value={stage} onChange={(e) => setStage(e.target.value)}>
          <option value="all">All stages</option>
          {STAGES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
        <select aria-label="Guide" className={inputClass} value={guide} onChange={(e) => setGuide(e.target.value)}>
          <option value="all">All guides</option>
          <option value="none">No guide assigned</option>
          {me && <option value={me.uid}>My members</option>}
          {staff.filter((s) => s.id !== me?.uid).map((s) => <option key={s.id} value={s.id}>{s.displayName}</option>)}
        </select>
      </div>

      {selected.size > 0 && (
        <div className="sticky top-16 z-20 card p-3 flex flex-wrap items-center gap-3 border-navy">
          <span className="font-semibold">{selected.size} selected</span>
          <button type="button" onClick={() => { setBulk('guide'); setBulkValue(''); }} className="btn border border-line text-ink hover:bg-paper normal-case tracking-normal text-[14px] min-h-[40px]"><UserPlus size={16} /> Assign guide</button>
          <button type="button" onClick={() => { setBulk('stage'); setBulkValue('regular'); }} className="btn border border-line text-ink hover:bg-paper normal-case tracking-normal text-[14px] min-h-[40px]"><Layers size={16} /> Set stage</button>
          <button type="button" onClick={() => setSelected(new Set())} className="ml-auto inline-flex items-center gap-1 text-ink-muted hover:text-ink"><X size={16} /> Clear</button>
        </div>
      )}

      {error && !editing && <p role="alert" className="rounded-md bg-red-50 text-red-700 px-4 py-3">{error}</p>}

      {loading ? (
        <div className="card h-64 animate-pulse" aria-busy="true" />
      ) : list.length === 0 ? (
        <div className="card p-10 text-center text-ink-muted">No members match these filters.</div>
      ) : (
        <div className="card overflow-hidden">
          <table className="hidden md:table w-full text-left">
            <thead className="bg-paper text-[13px] font-display font-bold uppercase tracking-label text-ink-muted">
              <tr>
                <th className="w-10 px-4 py-3"><input type="checkbox" aria-label="Select all" checked={allSelected} onChange={toggleAll} className="w-4 h-4 accent-navy" /></th>
                <th className="px-3 py-3">Member</th>
                <th className="px-3 py-3">Stage</th>
                <th className="px-3 py-3">Guide</th>
                <th className="px-3 py-3">Last chanted</th>
                <th className="px-3 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {list.map((m) => {
                const lc = lastChant(m);
                return (
                  <tr key={m.id} className={selected.has(m.id) ? 'bg-navy-50/50' : 'hover:bg-paper/60'}>
                    <td className="px-4 py-3">{canEdit(m) && <input type="checkbox" aria-label={`Select ${m.displayName}`} checked={selected.has(m.id)} onChange={() => toggle(m.id)} className="w-4 h-4 accent-navy" />}</td>
                    <td className="px-3 py-3">
                      <p className="font-semibold user-text">{m.displayName} {m.isStaff && <span className="ml-1 text-[11px] font-bold uppercase text-saffron">{m.role === 'admin' ? 'Admin' : 'Guide'}</span>}</p>
                      <p className="text-[14px] text-ink-muted">{formatPhone(m.phone) || 'No phone'}{m.city ? ` · ${m.city}` : ''}</p>
                    </td>
                    <td className="px-3 py-3"><StageChip stage={m.stage} /></td>
                    <td className="px-3 py-3 text-[15px]">{m.guideName || <span className="text-amber-700">Not assigned</span>}</td>
                    <td className={`px-3 py-3 text-[15px] ${lc.tone}`}>{lc.label}{m.streak ? <span className="text-ink-muted"> · {m.streak}d streak</span> : null}</td>
                    <td className="px-3 py-3">
                      <div className="flex justify-end gap-1">
                        {m.phone && <a href={whatsappUrl(m.phone, `Hare Krishna ${m.displayName.split(' ')[0]}!`)} target="_blank" rel="noopener noreferrer" aria-label={`WhatsApp ${m.displayName}`} className="w-9 h-9 inline-flex items-center justify-center rounded-md hover:bg-paper text-green-700"><MessageCircle size={17} /></a>}
                        <button type="button" onClick={() => setQrFor(m)} aria-label={`QR for ${m.displayName}`} className="w-9 h-9 inline-flex items-center justify-center rounded-md hover:bg-paper"><QrCode size={17} /></button>
                        {canEdit(m) && <button type="button" onClick={() => openEdit(m)} aria-label={`Edit ${m.displayName}`} className="w-9 h-9 inline-flex items-center justify-center rounded-md hover:bg-paper"><Pencil size={17} /></button>}
                        {isAdmin && m.id !== me?.uid && <button type="button" onClick={() => remove(m)} aria-label={`Delete ${m.displayName}`} className="w-9 h-9 inline-flex items-center justify-center rounded-md hover:bg-red-50 text-red-700"><Trash2 size={17} /></button>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <ul className="md:hidden divide-y divide-line">
            {list.map((m) => {
              const lc = lastChant(m);
              return (
                <li key={m.id} className="p-4 flex gap-3">
                  {canEdit(m) && <input type="checkbox" aria-label={`Select ${m.displayName}`} checked={selected.has(m.id)} onChange={() => toggle(m.id)} className="mt-1 w-5 h-5 accent-navy shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold user-text">{m.displayName}</p>
                    <p className="text-[14px] text-ink-muted">{formatPhone(m.phone) || 'No phone'}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[14px]">
                      <StageChip stage={m.stage} />
                      <span className={m.guideName ? 'text-ink-muted' : 'text-amber-700'}>{m.guideName ? `Guide: ${m.guideName}` : 'No guide'}</span>
                      <span className={lc.tone}>· {lc.label}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    {canEdit(m) && <button type="button" onClick={() => openEdit(m)} aria-label={`Edit ${m.displayName}`} className="w-10 h-10 inline-flex items-center justify-center rounded-md border border-line"><Pencil size={17} /></button>}
                    <button type="button" onClick={() => setQrFor(m)} aria-label={`QR for ${m.displayName}`} className="w-10 h-10 inline-flex items-center justify-center rounded-md border border-line"><QrCode size={17} /></button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing === 'new' ? 'Add member' : 'Edit member'}
        footer={<>
          <button type="button" onClick={() => setEditing(null)} className="btn border border-line text-ink hover:bg-paper">Cancel</button>
          <button type="submit" form="member-form" disabled={busy} className="btn-primary">{busy ? 'Saving…' : 'Save'}</button>
        </>}>
        <form id="member-form" onSubmit={save} className="space-y-4">
          {error && <p role="alert" className="rounded-md bg-red-50 text-red-700 px-3 py-2">{error}</p>}
          <Field label="Full name"><input required className={inputClass} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Mobile"><input type="tel" className={inputClass} value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="+91 98765 43210" /></Field>
            <Field label="City"><input className={inputClass} value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} /></Field>
          </div>
          <Field label="Address"><input className={inputClass} value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Stage">
              <select className={inputClass} value={form.stage} onChange={(e) => setForm((f) => ({ ...f, stage: e.target.value }))}>
                {STAGES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </Field>
            <Field label="FOLK guide">
              <select className={inputClass} value={form.guideId} onChange={(e) => setForm((f) => ({ ...f, guideId: e.target.value }))}>
                <option value="">Not assigned</option>
                {staff.map((s) => <option key={s.id} value={s.id}>{s.displayName}</option>)}
              </select>
            </Field>
          </div>
          {isAdmin && editing !== 'new' && editing?.id !== me?.uid && (
            <Field label="Role" hint="FOLK guides can see and follow up with members. Admins manage everything.">
              <select className={inputClass} value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}>
                <option value="devotee">Member</option>
                <option value="folks_head">FOLK guide</option>
                <option value="admin">Admin</option>
              </select>
            </Field>
          )}
        </form>
      </Modal>

      <Modal open={!!bulk} onClose={() => setBulk(null)} size="sm" title={bulk === 'guide' ? `Assign guide to ${selected.size}` : `Set stage for ${selected.size}`}
        footer={<>
          <button type="button" onClick={() => setBulk(null)} className="btn border border-line text-ink hover:bg-paper">Cancel</button>
          <button type="button" onClick={applyBulk} disabled={busy || (bulk === 'stage' && !bulkValue)} className="btn-primary">{busy ? 'Updating…' : 'Apply'}</button>
        </>}>
        {bulk === 'guide' ? (
          <Field label="FOLK guide">
            <select className={inputClass} value={bulkValue} onChange={(e) => setBulkValue(e.target.value)}>
              <option value="">Remove guide</option>
              {staff.map((s) => <option key={s.id} value={s.id}>{s.displayName}</option>)}
            </select>
          </Field>
        ) : (
          <Field label="Stage">
            <select className={inputClass} value={bulkValue} onChange={(e) => setBulkValue(e.target.value)}>
              {STAGES.map((s) => <option key={s.id} value={s.id}>{s.label} · {s.desc}</option>)}
            </select>
          </Field>
        )}
      </Modal>

      <Modal open={!!qrFor} onClose={() => setQrFor(null)} size="sm" title={qrFor?.displayName || 'QR'}>
        {qrFor?.qrToken ? (
          <div className="text-center">
            <div className="inline-block p-3 border border-line rounded-lg"><QRCodeSVG value={qrFor.qrToken} size={220} /></div>
            <p className="mt-2 text-[13px] text-ink-muted">ID {String(qrFor.qrToken).slice(0, 8).toUpperCase()}</p>
          </div>
        ) : (
          <p className="text-ink-muted">This member has no QR yet. It&apos;s created the next time they sign in.</p>
        )}
      </Modal>
    </div>
  );
};

export default Devotees;
