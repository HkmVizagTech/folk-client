import React from 'react'
import { Send } from 'lucide-react'
import { Button, Field, Input, Modal, Textarea } from '../../../components/ui'
import GuestStepper from './GuestStepper'

const BookingModal = ({ dialog, submitting }) => {
  const { listing, form, setForm, close, submit } = dialog
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))
  return (
    <Modal
      open={!!listing}
      onClose={close}
      title={listing ? `Book: ${listing.name}` : ''}
      description="Submit a request. Staff will confirm your stay."
      footer={<>
        <Button type="button" variant="secondary" onClick={close} disabled={submitting}>Cancel</Button>
        <Button type="submit" form="booking-form" loading={submitting}>
          {!submitting && <Send size={16} aria-hidden="true" />} {submitting ? 'Submitting...' : 'Submit request'}
        </Button>
      </>}
    >
      <form id="booking-form" onSubmit={submit} className="grid gap-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Check-in"><Input required type="date" value={form.checkIn} onChange={set('checkIn')} /></Field>
          <Field label="Check-out"><Input required type="date" min={form.checkIn || undefined} value={form.checkOut} onChange={set('checkOut')} /></Field>
        </div>
        <div>
          <p className="mb-1.5 text-[14px] font-semibold text-ink">Number of guests</p>
          <GuestStepper value={form.guestCount} onChange={(guestCount) => setForm((f) => ({ ...f, guestCount }))} />
        </div>
        <Field label="Notes (optional)"><Textarea rows={3} value={form.notes} onChange={set('notes')} placeholder="Any special requirements..." /></Field>
      </form>
    </Modal>
  )
}

export default BookingModal
