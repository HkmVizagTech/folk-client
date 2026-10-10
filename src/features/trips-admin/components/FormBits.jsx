import React, { useState } from 'react'
import { Image as ImageIcon, Loader2, Plus, X } from 'lucide-react'
import { Input } from '../../../components/ui/Field'
import Button from '../../../components/ui/Button'
import { cn } from '../../../lib/utils'
import { UPLOAD_PHASE_LABEL } from '../lib/constants'
import Alert from './Alert'

/** Label + hint row for controls that are not a single <input> (a plain Field would wrap them in one <label>). */
export const FieldGroup = ({ label, hint, error, children, className }) => (
  <div className={cn('block user-text-box', className)}>
    <div className="mb-1.5 flex items-baseline justify-between gap-2">
      <span className="text-[14px] font-semibold text-ink">{label}</span>
      {hint && <span className="min-w-0 text-right text-[13px] text-ink-muted user-text">{hint}</span>}
    </div>
    {children}
    {error && <span className="mt-1 block text-[13px] text-red-600 user-text">{error}</span>}
  </div>
)

export const InfoNote = ({ children, className }) => (
  <p className={cn('rounded-xl border border-line bg-paper p-4 text-[14px] leading-relaxed text-ink-muted', className)}>{children}</p>
)

export const UploadStatus = ({ phase, error }) => {
  if (!phase && !error) return null
  if (phase) {
    return (
      <p className="flex items-center gap-1.5 text-[13px] font-semibold text-saffron-dark">
        <Loader2 size={13} className="shrink-0 animate-spin" /> {UPLOAD_PHASE_LABEL[phase] || 'Working…'}
      </p>
    )
  }
  return <p className="text-[13px] text-red-600 user-text">{error}</p>
}

/** Dashed file-drop button used by the cover and every location row. */
export const FilePick = ({ phase, disabled, label, onChange, multiple, compact }) => {
  const blocked = !!phase || disabled
  return (
    <label className={cn(
      'flex min-h-[44px] w-full items-center gap-3 rounded-xl border-2 border-dashed p-3 transition-colors',
      blocked ? 'cursor-not-allowed border-line bg-paper opacity-70' : 'cursor-pointer border-marigold/50 bg-white hover:bg-saffron-50 focus-within:ring-2 focus-within:ring-saffron',
      compact && 'p-2.5',
    )}>
      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-saffron-50 text-saffron-dark">
        {phase ? <Loader2 size={16} className="animate-spin" /> : <ImageIcon size={16} />}
      </span>
      <span className="text-[14px] font-semibold text-ink-soft">{phase ? (UPLOAD_PHASE_LABEL[phase] || 'Working…') : label}</span>
      <input type="file" accept="image/*" multiple={multiple} disabled={blocked} onChange={onChange} className="sr-only" />
    </label>
  )
}

export const IconButton = ({ tone = 'neutral', className, ...props }) => (
  <button
    type="button"
    className={cn(
      'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron disabled:opacity-30 disabled:pointer-events-none',
      tone === 'danger' ? 'border-red-100 bg-red-50 text-red-500 hover:bg-red-100' : 'border-line bg-white text-ink-muted hover:text-saffron-dark hover:border-marigold/60',
      className,
    )}
    {...props}
  />
)

/** Free-text list: Enter or comma adds rows, each row is editable. */
export const StringListEditor = ({ label, hint, items, onChange, placeholder }) => {
  const [draft, setDraft] = useState('')

  const commitDraft = () => {
    const parts = draft.split(',').map((s) => s.trim()).filter(Boolean)
    if (parts.length === 0) return
    onChange([...(items || []), ...parts])
    setDraft('')
  }

  return (
    <FieldGroup label={label} hint={hint || 'Enter to add · commas split'}>
      <div className="space-y-2">
        {(items || []).map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <Input
              value={item}
              aria-label={`${label} item ${i + 1}`}
              onChange={(e) => onChange(items.map((v, idx) => (idx === i ? e.target.value : v)))}
              className="min-w-0"
            />
            <IconButton tone="danger" aria-label={`Remove ${label} item ${i + 1}`} onClick={() => onChange(items.filter((_, idx) => idx !== i))}>
              <X size={16} />
            </IconButton>
          </div>
        ))}
        <div className="flex items-center gap-2">
          <Input
            value={draft}
            placeholder={placeholder}
            aria-label={`Add ${label}`}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); commitDraft() } }}
            onBlur={commitDraft}
            className="min-w-0"
          />
          <Button type="button" variant="soft" size="icon" className="h-11 w-11 rounded-xl" aria-label={`Add ${label}`} onClick={commitDraft}>
            <Plus size={18} />
          </Button>
        </div>
      </div>
    </FieldGroup>
  )
}

export { Alert }
