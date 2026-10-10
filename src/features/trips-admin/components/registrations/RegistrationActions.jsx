import React from 'react'
import { Ban, Banknote, CheckCircle2, Hourglass, MessageSquare, Undo2 } from 'lucide-react'
import Button from '../../../../components/ui/Button'
import { cn } from '../../../../lib/utils'

/** Status, cash and note controls for one registration (shared by card and table row). */
const RegistrationActions = ({ reg, pay, status, expanded, busy, actions, cash }) => {
  const name = reg.userName || 'registration'
  const who = reg.userName || 'this devotee'
  return (
    <>
      {/* Cash actions only for a declared-cash seat, or to undo one staff already recorded. */}
      {pay.declared === 'cash' && !pay.cashDone && pay.state !== 'online_paid' && (
        <Button size="sm" disabled={busy} onClick={() => cash.askRecord(reg)} aria-label={`Record cash received from ${who}`} className="min-h-[44px] rounded-xl bg-teal-600 hover:bg-teal-700">
          <Banknote size={14} /> Record cash
        </Button>
      )}
      {pay.cashDone && (
        <Button size="sm" variant="secondary" disabled={busy} onClick={() => cash.askUndo(reg)} aria-label={`Undo the cash record for ${who}`} className="min-h-[44px] rounded-xl text-teal-700">
          <Undo2 size={14} /> Undo cash
        </Button>
      )}
      <Button size="sm" disabled={busy || status === 'confirmed'} onClick={() => actions.setStatus(reg, 'confirmed')} aria-label={`Confirm ${name}`} className="min-h-[44px] rounded-xl bg-emerald-600 hover:bg-emerald-700">
        <CheckCircle2 size={14} /> Confirm
      </Button>
      <Button size="sm" variant="secondary" disabled={busy || status === 'waitlisted'} onClick={() => actions.setStatus(reg, 'waitlisted')} aria-label={`Waitlist ${name}`} className="min-h-[44px] rounded-xl text-amber-700">
        <Hourglass size={14} /> Wait
      </Button>
      <Button size="sm" variant="secondary" disabled={busy || status === 'cancelled'} onClick={() => actions.setStatus(reg, 'cancelled')} aria-label={`Cancel ${name}`} className="min-h-[44px] rounded-xl text-red-600">
        <Ban size={14} /> Cancel
      </Button>
      <button
        type="button" onClick={() => actions.toggleNote(reg, expanded)} aria-label={`Staff note for ${name}`} aria-expanded={expanded}
        className={cn(
          'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron',
          reg.staffNotes ? 'bg-saffron-50 text-saffron-dark' : 'bg-paper-dark text-ink-muted hover:text-ink',
        )}
      >
        <MessageSquare size={16} />
      </button>
    </>
  )
}

export default RegistrationActions
