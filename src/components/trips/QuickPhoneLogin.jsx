import { useEffect, useRef, useState } from 'react';
import { Phone, KeyRound, User, Loader2, ArrowRight, RefreshCw, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import Modal from '../ui/Modal';

/**
 * Signing in without leaving the yatra.
 *
 * Boys arrive on a trip page from a WhatsApp link. Sending them to a separate
 * login screen lost them twice over: the yatra disappeared, and afterwards
 * they landed on the dashboard and had to find it again. Three short steps
 * here — number, code, name — and the booking form opens straight after.
 */

const field = 'w-full min-w-0 min-h-[52px] pl-11 pr-4 bg-cream/40 border border-saffron/15 rounded-2xl outline-none focus:bg-white focus:border-saffron/50 transition-all font-semibold text-[16px] text-gray-900';
const iconCls = 'absolute left-4 top-1/2 -translate-y-1/2 text-saffron';

const QuickPhoneLogin = ({ open, onClose, onSignedIn, tripTitle }) => {
  const { user, sendOTP, verifyOTP, completeProfile } = useAuth();
  const [step, setStep] = useState('phone'); // phone | code | name
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const handedOff = useRef(false);

  useEffect(() => {
    if (!open) return;
    handedOff.current = false;
    setStep('phone'); setPhone(''); setCode(''); setName('');
    setError(''); setNote(''); setBusy(false);
  }, [open]);

  // Signed in and the profile is complete: hand straight over to booking.
  useEffect(() => {
    if (!open || handedOff.current) return;
    if (user && !user.requiresRole) {
      handedOff.current = true;
      onSignedIn?.();
      onClose();
    } else if (user?.requiresRole && step !== 'name') {
      setStep('name');
      setName(user.displayName || '');
    }
  }, [open, user, step, onSignedIn, onClose]);

  const send = async (e) => {
    e?.preventDefault();
    const digits = phone.replace(/\D/g, '').slice(-10);
    if (digits.length !== 10) { setError('Enter your 10-digit mobile number.'); return; }
    setBusy(true); setError(''); setNote('');
    try {
      const r = await sendOTP(`+91${digits}`);
      if (r && r.sent === false) throw new Error('The code could not be sent just now. Please try again in a moment.');
      setStep('code');
      setNote('Code sent on WhatsApp.');
    } catch (err) {
      setError(err.message || 'The code could not be sent. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    setResending(true); setError(''); setNote('');
    try {
      const digits = phone.replace(/\D/g, '').slice(-10);
      const r = await sendOTP(`+91${digits}`);
      if (r && r.sent === false) throw new Error('Could not resend just now.');
      setNote('A new code is on its way.');
    } catch (err) {
      setError(err.message || 'Could not resend the code.');
    } finally {
      setResending(false);
    }
  };

  const verify = async (e) => {
    e?.preventDefault();
    if (code.length < 6) return;
    setBusy(true); setError('');
    try {
      await verifyOTP(code);
      // The effect above takes it from here: straight to booking, or to the
      // name step for somebody new.
    } catch (err) {
      setError(err.code === 'auth/invalid-verification-code' || /invalid/i.test(err.message || '')
        ? 'That code was not right. Check it and try again.'
        : (err.message || 'Could not check that code.'));
      setBusy(false);
    }
  };

  const saveName = async (e) => {
    e?.preventDefault();
    if (!name.trim()) { setError('Please tell us your name.'); return; }
    setBusy(true); setError('');
    try {
      await completeProfile('devotee', name.trim());
      handedOff.current = true;
      onSignedIn?.();
      onClose();
    } catch (err) {
      setError(err.message || 'Could not save your name. Please try again.');
      setBusy(false);
    }
  };

  const title = step === 'phone' ? 'Your mobile number' : step === 'code' ? 'Enter the code' : 'Your name';

  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <div className="space-y-4">
        <p className="text-[15px] text-gray-500 font-medium">
          {step === 'phone' && <>To hold your seat for <span className="font-bold text-gray-900 user-text">{tripTitle || 'this yatra'}</span>, we just need your mobile number.</>}
          {step === 'code' && <>We sent a 6-digit code on WhatsApp to <span className="font-bold text-gray-900">+91 {phone.replace(/\D/g, '').slice(-10)}</span>.</>}
          {step === 'name' && 'Last thing — what should we call you?'}
        </p>

        {error && (
          <p role="alert" className="flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-[14px] text-red-700">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" /> {error}
          </p>
        )}
        {note && !error && <p role="status" className="rounded-xl bg-emerald-50 px-4 py-3 text-[14px] text-emerald-800">{note}</p>}

        {step === 'phone' && (
          <form onSubmit={send} className="space-y-4">
            <div className="relative">
              <Phone size={18} className={iconCls} aria-hidden="true" />
              <input
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                autoFocus
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="98765 43210"
                className={field}
                aria-label="Mobile number"
              />
            </div>
            <button type="submit" disabled={busy} className="btn-primary w-full">
              {busy ? <Loader2 size={17} className="animate-spin" /> : <>Send code on WhatsApp <ArrowRight size={17} /></>}
            </button>
          </form>
        )}

        {step === 'code' && (
          <form onSubmit={verify} className="space-y-4">
            <div className="relative">
              <KeyRound size={18} className={iconCls} aria-hidden="true" />
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                autoFocus
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="6-digit code"
                className={`${field} tracking-[0.35em]`}
                aria-label="6-digit code"
              />
            </div>
            <button type="submit" disabled={busy || code.length < 6} className="btn-primary w-full">
              {busy ? <Loader2 size={17} className="animate-spin" /> : 'Verify and continue'}
            </button>
            <div className="flex items-center justify-between text-[14px]">
              <button type="button" onClick={resend} disabled={resending} className="font-bold text-saffron-dark hover:underline disabled:opacity-50 inline-flex items-center gap-1.5">
                <RefreshCw size={14} className={resending ? 'animate-spin' : ''} /> Resend
              </button>
              <button type="button" onClick={() => { setStep('phone'); setCode(''); setError(''); setNote(''); }} className="font-bold text-gray-500 hover:text-gray-900">
                Change number
              </button>
            </div>
          </form>
        )}

        {step === 'name' && (
          <form onSubmit={saveName} className="space-y-4">
            <div className="relative">
              <User size={18} className={iconCls} aria-hidden="true" />
              <input
                type="text"
                autoComplete="name"
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ravi Kumar"
                className={field}
                aria-label="Your name"
              />
            </div>
            <button type="submit" disabled={busy} className="btn-primary w-full">
              {busy ? <Loader2 size={17} className="animate-spin" /> : <>Continue to booking <ArrowRight size={17} /></>}
            </button>
          </form>
        )}
      </div>
    </Modal>
  );
};

export default QuickPhoneLogin;
