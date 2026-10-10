import React from 'react'
import { Trash2 } from 'lucide-react'
import Modal from '../../../../components/ui/Modal'
import Button from '../../../../components/ui/Button'
import { Field, Input } from '../../../../components/ui/Field'
import Alert from '../Alert'

/** Typed-slug confirmation. `del` is the object returned by useDeleteTrip. */
const DeleteTripDialog = ({ del, regCount }) => {
  const trip = del.target
  const matches = trip && del.text.trim() === (trip.slug || '')

  return (
    <Modal
      open={!!trip}
      onClose={del.cancel}
      size="sm"
      title="Delete this trip?"
      footer={(
        <>
          <Button variant="secondary" onClick={del.cancel} disabled={del.deleting}>Keep it</Button>
          <Button variant="danger" onClick={del.confirm} disabled={!matches} loading={del.deleting}>
            {!del.deleting && <Trash2 size={16} />} Delete trip
          </Button>
        </>
      )}
    >
      {trip && (
        <div className="space-y-4">
          <p className="text-[15px] leading-relaxed text-ink-muted user-text">
            <strong className="text-ink">{trip.title}</strong> will be removed permanently and{' '}
            <strong className="text-ink">/trip/{trip.slug}</strong> will stop working. Its {regCount} registration(s) are kept
            but will no longer point at a live trip.
          </p>
          <Field label={<>Type <span className="font-mono text-saffron-dark">{trip.slug}</span> to confirm</>}>
            <Input value={del.text} onChange={(e) => del.setText(e.target.value)} placeholder={trip.slug} className="font-mono" autoComplete="off" />
          </Field>
          {del.error && <Alert>{del.error}</Alert>}
        </div>
      )}
    </Modal>
  )
}

export default DeleteTripDialog
