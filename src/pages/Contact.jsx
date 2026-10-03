import React, { useState } from 'react';
import { MessageCircle, Phone, MapPin, Instagram, Send, CheckCircle2, Mail } from 'lucide-react';
import { addDoc, collection, serverTimestamp } from '../lib/pgstore';
import { db } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';
import { SITE, whatsappLink } from '../content/site';
import { Field, inputClass, textareaClass } from '../components/ui/Modal';

const TOPICS = ['General question', 'Programs & events', 'Residency', 'Yatras', 'Seva', 'Donations', 'Something else'];

const Contact = () => {
  const { user } = useAuth();
  const [topic, setTopic] = useState(TOPICS[0]);
  const [text, setText] = useState('');
  const [state, setState] = useState('idle'); // idle | sending | sent | error
  const wa = whatsappLink();

  // Messages are stored for the FOLK team to read in the Command Center.
  // (The old form only pretended to send.)
  const send = async (e) => {
    e.preventDefault();
    const message = text.trim();
    if (message.length < 5) return;
    setState('sending');
    try {
      await addDoc(collection(db, 'contact_messages'), {
        userId: user.uid,
        name: user.name || user.displayName || 'Member',
        phone: user.phone || user.phoneNumber || '',
        email: user.email || '',
        topic,
        message: message.slice(0, 2000),
        status: 'new',
        createdAt: serverTimestamp(),
      });
      setText('');
      setState('sent');
    } catch (err) {
      console.error('Contact message failed:', err);
      setState('error');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="display-lg">Contact</h1>
        <p className="mt-1 text-ink-muted">Reach the FOLK Vizag team. WhatsApp is usually the quickest.</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-5">
        <div className="lg:col-span-2 space-y-3">
          {wa && (
            <a href={wa} target="_blank" rel="noopener noreferrer" className="card p-5 flex items-center gap-4 hover:border-ink">
              <span className="w-11 h-11 rounded-md bg-green-50 text-green-700 inline-flex items-center justify-center"><MessageCircle size={22} /></span>
              <span><span className="block font-display font-bold">WhatsApp</span><span className="text-ink-muted">{SITE.contact.phone}</span></span>
            </a>
          )}
          {SITE.contact.phone && (
            <a href={`tel:${SITE.contact.phone.replace(/\s/g, '')}`} className="card p-5 flex items-center gap-4 hover:border-ink">
              <span className="w-11 h-11 rounded-md bg-navy-50 text-navy-700 inline-flex items-center justify-center"><Phone size={22} /></span>
              <span><span className="block font-display font-bold">Call</span><span className="text-ink-muted">{SITE.contact.phone}</span></span>
            </a>
          )}
          {SITE.contact.email && (
            <a href={`mailto:${SITE.contact.email}`} className="card p-5 flex items-center gap-4 hover:border-ink">
              <span className="w-11 h-11 rounded-md bg-marigold/15 text-marigold-dark inline-flex items-center justify-center"><Mail size={22} /></span>
              <span className="min-w-0"><span className="block font-display font-bold">Email</span><span className="text-ink-muted user-text">{SITE.contact.email}</span></span>
            </a>
          )}
          {SITE.contact.address && (
            <div className="card p-5 flex items-center gap-4">
              <span className="w-11 h-11 rounded-md bg-saffron-50 text-saffron inline-flex items-center justify-center"><MapPin size={22} /></span>
              <span><span className="block font-display font-bold">Visit</span>
                {SITE.contact.mapsUrl
                  ? <a href={SITE.contact.mapsUrl} target="_blank" rel="noopener noreferrer" className="text-ink-muted hover:underline">{SITE.contact.address}</a>
                  : <span className="text-ink-muted">{SITE.contact.address}</span>}
              </span>
            </div>
          )}
          {SITE.social.instagram && (
            <a href={SITE.social.instagram} target="_blank" rel="noopener noreferrer" className="card p-5 flex items-center gap-4 hover:border-ink">
              <span className="w-11 h-11 rounded-md bg-paper text-ink inline-flex items-center justify-center"><Instagram size={22} /></span>
              <span><span className="block font-display font-bold">Instagram</span><span className="text-ink-muted">@folkvizag</span></span>
            </a>
          )}
        </div>

        <section className="card p-5 sm:p-6 lg:col-span-3">
          <h2 className="display-md">Send a message</h2>
          <p className="mt-1 text-ink-muted">The team reads these in the app and will reply on your phone number.</p>
          {state === 'sent' ? (
            <div role="status" className="mt-6 rounded-md bg-green-50 text-green-800 p-5 flex gap-3">
              <CheckCircle2 className="shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Message sent</p>
                <p className="mt-0.5">A coordinator will get back to you. For anything urgent, WhatsApp us.</p>
                <button type="button" onClick={() => setState('idle')} className="mt-3 font-semibold text-green-900 underline">Send another</button>
              </div>
            </div>
          ) : (
            <form onSubmit={send} className="mt-6 space-y-4">
              <Field label="Topic">
                <select className={inputClass} value={topic} onChange={(e) => setTopic(e.target.value)}>
                  {TOPICS.map((t) => <option key={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="Message" hint="At least a few words, up to 2000 characters.">
                <textarea required minLength={5} maxLength={2000} className={`${textareaClass} min-h-[140px]`} value={text} onChange={(e) => setText(e.target.value)} placeholder="How can we help?" />
              </Field>
              {state === 'error' && <p role="alert" className="rounded-md bg-red-50 text-red-700 px-4 py-3">Could not send. Please try again, or WhatsApp us.</p>}
              <button type="submit" disabled={state === 'sending' || text.trim().length < 5} className="btn-primary"><Send size={17} /> {state === 'sending' ? 'Sending…' : 'Send message'}</button>
            </form>
          )}
        </section>
      </div>
    </div>
  );
};

export default Contact;
