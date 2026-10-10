import React from 'react'
import { Button, Field, Input, Modal, Select, Textarea } from '../../../components/ui'
import { Alert } from '../../staff-common/components'
import { STAGES } from '../../../content/journey'
import { cn } from '../../../lib/utils'
import { CHANNELS } from '../lib/memberMetrics'

const FollowUpModal = ({ member, form, error, busy, today, onChange, onSubmit, onClose }) => (
  <Modal
    open={!!member}
    onClose={onClose}
    title={`Follow-up · ${member?.displayName || ''}`}
    footer={<>
      <Button variant="secondary" onClick={onClose}>Cancel</Button>
      <Button type="submit" form="followup-form" loading={busy}>Save</Button>
    </>}
  >
    <form id="followup-form" onSubmit={onSubmit} className="space-y-5">
      {error && <Alert>{error}</Alert>}
      <div>
        <span className="mb-1.5 block text-[14px] font-semibold text-ink">How did you connect?</span>
        <div className="flex flex-wrap gap-2">
          {CHANNELS.map((c) => (
            <button
              key={c}
              type="button"
              aria-pressed={form.channel === c}
              onClick={() => onChange({ channel: c })}
              className={cn('min-h-[44px] rounded-full border px-4 text-[14px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron', form.channel === c ? 'border-navy bg-navy text-white' : 'border-line bg-white text-ink hover:bg-paper')}
            >
              {c}
            </button>
          ))}
        </div>
      </div>
      <Field label="Notes" hint="Only FOLK guides and admins can see these.">
        <Textarea required value={form.note} onChange={(e) => onChange({ note: e.target.value })} placeholder="How are they doing? Anything they need?" />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Next follow-up"><Input type="date" min={today} value={form.nextDate} onChange={(e) => onChange({ nextDate: e.target.value })} /></Field>
        <Field label="Stage">
          <Select value={form.stage} onChange={(e) => onChange({ stage: e.target.value })}>
            {STAGES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </Select>
        </Field>
      </div>
    </form>
  </Modal>
)

export default FollowUpModal
