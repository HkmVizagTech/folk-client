import React from 'react'
import { Banknote, CheckCircle2, Undo2 } from 'lucide-react'
import Modal from '../../../../components/ui/Modal'
import Button from '../../../../components/ui/Button'
import { Field, Input } from '../../../../components/ui/Field'
import { formatINR, toNumber } from '../../lib/format'
import Alert from '../Alert'

/** Staff attestation of cash received. `cash` is the object returned by useCashRecording. */
export const RecordCashDialog = ({ cash }) => {
  const reg = cash.recordTarget
  const amount = toNumber(cash.draft)
  const due = reg ? toNumber(reg.amountDue) : 0

  return (
    <Modal
      open={!!reg}
      onClose={cash.cancelRecord}
      size="sm"
      title="Record cash received"
      footer={(
        <>
          <Button variant="secondary" onClick={cash.cancelRecord} disabled={cash.saving}>Cancel</Button>
          <Button onClick={cash.confirmRecord} disabled={!(amount > 0)} loading={cash.saving}>
            {!cash.saving && <CheckCircle2 size={16} />} Record {formatINR(amount)}
          </Button>
        </>
      )}
    >
      {reg && (
        <div className="space-y-4">
          <p className="flex items-start gap-3 text-[15px] leading-relaxed text-ink-muted user-text">
            <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700"><Banknote size={18} /></span>
            <span>
              Confirming that <strong className="text-ink">{reg.userName || 'this devotee'}</strong> handed over cash for{' '}
              <strong className="text-ink">{reg.tripTitle || 'this trip'}</strong>. This is your attestation as staff — it is what
              the Collected total and the CSV will report.
            </span>
          </p>
          <Field label="Amount received (₹)" hint={`Due ${formatINR(reg.amountDue)}`}>
            <Input type="number" min={0} step="1" inputMode="numeric" value={cash.draft} onChange={(e) => cash.setDraft(e.target.value)} />
          </Field>
          {amount > 0 && amount !== due && (
            <Alert tone="warning">
              That is {amount < due ? 'less' : 'more'} than the {formatINR(due)} due — a part payment is fine, just make sure it is
              what you counted.
            </Alert>
          )}
          {cash.error && <Alert>{cash.error}</Alert>}
        </div>
      )}
    </Modal>
  )
}

/** Mis-tap recovery for a recorded cash payment. */
export const UndoCashDialog = ({ cash }) => {
  const reg = cash.undoTarget
  return (
    <Modal
      open={!!reg}
      onClose={cash.cancelUndo}
      size="sm"
      title="Undo this cash record?"
      footer={(
        <>
          <Button variant="secondary" onClick={cash.cancelUndo} disabled={cash.saving}>Keep it</Button>
          <Button variant="danger" onClick={cash.confirmUndo} loading={cash.saving}>
            {!cash.saving && <Undo2 size={16} />} Undo record
          </Button>
        </>
      )}
    >
      {reg && (
        <div className="space-y-4">
          <p className="text-[15px] leading-relaxed text-ink-muted user-text">
            <strong className="text-ink">{reg.userName || 'This devotee'}</strong> goes back to{' '}
            <strong className="text-ink">cash pending collection</strong>, and the {formatINR(reg.cashAmount ?? reg.amountDue)} comes
            straight back out of the Collected total. Only do this if the money was never actually received.
          </p>
          {cash.error && <Alert>{cash.error}</Alert>}
        </div>
      )}
    </Modal>
  )
}
