import { AlertTriangle, ArrowRight, KeyRound, Phone, RefreshCw, User } from 'lucide-react'
import { Button, Input, Modal } from '../../../components/ui'
import { useQuickLogin } from '../hooks/useQuickLogin'

const TITLES = { phone: 'Your mobile number', code: 'Enter the code', name: 'Your name' }

const IconInput = ({ icon: Icon, className, ...p }) => (
  <div className="relative">
    <Icon size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-saffron" aria-hidden="true" />
    <Input className={`h-12 pl-11 font-medium ${className || ''}`} autoFocus {...p} />
  </div>
)

const QuickPhoneLogin = ({ open, onClose, onSignedIn, tripTitle }) => {
  const s = useQuickLogin({ open, onClose, onSignedIn })

  return (
    <Modal open={open} onClose={onClose} title={TITLES[s.step]} size="sm">
      <div className="space-y-4">
        <p className="text-[15px] leading-relaxed text-ink-muted">
          {s.step === 'phone' && <>To hold your seat for <b className="user-text text-ink">{tripTitle || 'this yatra'}</b>, we just need your mobile number.</>}
          {s.step === 'code' && <>We sent a 6-digit code on WhatsApp to <b className="text-ink">+91 {s.shownPhone}</b>.</>}
          {s.step === 'name' && 'Last thing: what should we call you?'}
        </p>

        {s.error && (
          <p role="alert" className="flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-[14px] text-red-700">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" /> {s.error}
          </p>
        )}
        {s.note && !s.error && <p role="status" className="rounded-xl bg-emerald-50 px-4 py-3 text-[14px] text-emerald-800">{s.note}</p>}

        {s.step === 'phone' && (
          <form onSubmit={s.send} className="space-y-4">
            <IconInput icon={Phone} type="tel" inputMode="numeric" autoComplete="tel" value={s.phone} onChange={(e) => s.setPhone(e.target.value)} placeholder="98765 43210" aria-label="Mobile number" />
            <Button type="submit" size="lg" className="w-full" loading={s.busy}>Send code on WhatsApp <ArrowRight size={17} /></Button>
          </form>
        )}

        {s.step === 'code' && (
          <form onSubmit={s.verify} className="space-y-4">
            <IconInput
              icon={KeyRound} type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6} className="tracking-[0.35em]"
              value={s.code} onChange={(e) => s.setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="6-digit code" aria-label="6-digit code"
            />
            <Button type="submit" size="lg" className="w-full" loading={s.busy} disabled={s.code.length < 6}>Verify and continue</Button>
            <div className="flex items-center justify-between">
              <Button type="button" variant="link" onClick={s.resend} disabled={s.resending} className="min-h-[44px]">
                <RefreshCw size={14} className={s.resending ? 'animate-spin' : ''} /> Resend
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={s.changeNumber}>Change number</Button>
            </div>
          </form>
        )}

        {s.step === 'name' && (
          <form onSubmit={s.saveName} className="space-y-4">
            <IconInput icon={User} type="text" autoComplete="name" value={s.name} onChange={(e) => s.setName(e.target.value)} placeholder="e.g. Ravi Kumar" aria-label="Your name" />
            <Button type="submit" size="lg" className="w-full" loading={s.busy}>Continue to booking <ArrowRight size={17} /></Button>
          </form>
        )}
      </div>
    </Modal>
  )
}

export default QuickPhoneLogin
