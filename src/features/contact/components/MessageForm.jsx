import React from 'react';
import { Send, CheckCircle2 } from 'lucide-react';
import { Card, Button, Field, Select, Textarea } from '../../../components/ui';
import { TOPICS, MIN_LENGTH, MAX_LENGTH } from '../lib/topics';

const SentNotice = ({ onReset }) => (
  <div role="status" className="flex gap-3 rounded-xl bg-green-50 p-5 text-green-800">
    <CheckCircle2 className="mt-0.5 shrink-0" aria-hidden="true" />
    <div>
      <p className="font-semibold">Message sent</p>
      <p className="mt-0.5">A coordinator will get back to you. For anything urgent, WhatsApp us.</p>
      <Button type="button" variant="link" onClick={onReset} className="mt-3 text-green-900">Send another</Button>
    </div>
  </div>
);

const MessageForm = ({ topic, setTopic, text, setText, status, canSend, submit, reset, className }) => (
  <Card data-reveal className={className}>
    <h2 className="font-display text-[22px] font-semibold text-navy">Send a message</h2>
    <p className="mt-1 text-[15px] text-ink-muted">The team reads these in the app and will reply on your phone number.</p>
    <div className="mt-6">
      {status === 'sent' ? (
        <SentNotice onReset={reset} />
      ) : (
        <form onSubmit={submit} className="space-y-5">
          <Field label="Topic">
            <Select value={topic} onChange={(e) => setTopic(e.target.value)}>
              {TOPICS.map((t) => <option key={t}>{t}</option>)}
            </Select>
          </Field>
          <Field label="Message" hint={`At least a few words, up to ${MAX_LENGTH} characters.`}>
            <Textarea required minLength={MIN_LENGTH} maxLength={MAX_LENGTH} className="min-h-[150px]" value={text} onChange={(e) => setText(e.target.value)} placeholder="How can we help?" />
          </Field>
          {status === 'error' && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-red-700">Could not send. Please try again, or WhatsApp us.</p>}
          <Button type="submit" size="lg" loading={status === 'sending'} disabled={!canSend} className="w-full sm:w-auto">
            {status !== 'sending' && <Send size={17} aria-hidden="true" />} {status === 'sending' ? 'Sending…' : 'Send message'}
          </Button>
        </form>
      )}
    </div>
  </Card>
);

export default MessageForm;
