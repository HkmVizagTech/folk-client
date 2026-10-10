import React from 'react'
import Button from '../../../../components/ui/Button'
import { Textarea } from '../../../../components/ui/Field'
import { formatINR, formatStamp } from '../../lib/format'

const Detail = ({ label, tone = 'text-ink-muted', children }) => (
  <p className="user-text">
    <span className={`block text-[12px] font-semibold uppercase tracking-label ${tone}`}>{label}</span>
    {children}
  </p>
)

/** Cash trail, Razorpay order, traveller notes and the staff-note editor. */
const RegistrationDetails = ({ reg, pay, expanded, busy, actions }) => (
  <div className="grid grid-cols-1 gap-4 text-[14px] text-ink-muted user-text-box lg:grid-cols-2">
    <div className="space-y-2.5 user-text-box">
      {pay.cashDone && (
        <Detail label="Cash recorded" tone="text-teal-700">
          {formatINR(pay.cashAmount)} · {formatStamp(pay.cashAt)}
          {pay.cashBy ? <> · by <span className="font-mono">{pay.cashBy}</span></> : null}
        </Detail>
      )}
      {pay.orderId && <Detail label="Razorpay order"><span className="font-mono">{pay.orderId}</span></Detail>}
      {reg.travellerNotes && <Detail label="Traveller note">{reg.travellerNotes}</Detail>}
      {reg.emergencyContact && <Detail label="Emergency contact">{reg.emergencyContact}</Detail>}
      {!expanded && reg.staffNotes && <Detail label="Staff note">{reg.staffNotes}</Detail>}
    </div>
    {expanded && (
      <div className="space-y-2 user-text-box">
        <label htmlFor={`note-${reg.id}`} className="block text-[14px] font-semibold text-ink">Staff note</label>
        <Textarea
          id={`note-${reg.id}`} rows={2} value={actions.noteDrafts[reg.id] ?? (reg.staffNotes || '')}
          onChange={(e) => actions.editNote(reg.id, e.target.value)}
          placeholder="Seat allotted in bus 2, balance due on departure…" className="min-h-[72px] resize-none"
        />
        <div className="flex flex-wrap gap-2">
          <Button size="sm" className="min-h-[44px]" loading={busy} onClick={() => actions.saveNote(reg)}>Save note</Button>
          <Button size="sm" variant="secondary" className="min-h-[44px]" onClick={actions.closeNote}>Close</Button>
        </div>
      </div>
    )}
  </div>
)

export default RegistrationDetails
