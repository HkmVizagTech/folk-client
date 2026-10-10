import { CheckCircle2, Info, X } from 'lucide-react'
import { cn } from '../../../lib/utils'

const TONES = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  warn: 'border-amber-200 bg-amber-50 text-amber-800',
  info: 'border-line bg-white text-ink-soft',
}

const NoticeBanner = ({ notice, onDismiss }) => {
  if (!notice) return null
  const Icon = notice.tone === 'success' ? CheckCircle2 : Info
  return (
    <div role="status" className={cn('mb-6 flex items-start gap-3 rounded-2xl border p-4 shadow-soft animate-pop-in', TONES[notice.tone] || TONES.info)}>
      <Icon size={20} className="mt-0.5 shrink-0" />
      <p className="user-text min-w-0 flex-1 text-[15px] leading-relaxed">{notice.text}</p>
      <button type="button" onClick={onDismiss} aria-label="Dismiss message" className="-m-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl hover:bg-ink/5">
        <X size={16} />
      </button>
    </div>
  )
}

export default NoticeBanner
