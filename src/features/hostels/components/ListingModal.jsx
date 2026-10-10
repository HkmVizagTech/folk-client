import React from 'react'
import { ImagePlus } from 'lucide-react'
import { Button, Field, Input, Modal, Textarea } from '../../../components/ui'
import { readListingImage } from '../lib/hostels'

const ListingModal = ({ dialog, submitting }) => {
  const { open, editing, form, setForm, close, submit } = dialog
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))
  const onImage = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const img = await readListingImage(file)
      setForm((f) => ({ ...f, img }))
    } catch (err) {
      alert(err.message)
    }
  }
  return (
    <Modal
      open={open}
      onClose={close}
      title={editing ? 'Edit listing' : 'New hostel listing'}
      description="Add a room or bed available for youth stays."
      footer={<>
        <Button type="button" variant="secondary" onClick={close} disabled={submitting}>Cancel</Button>
        <Button type="submit" form="listing-form" loading={submitting}>{editing ? 'Save changes' : 'Create listing'}</Button>
      </>}
    >
      <form id="listing-form" onSubmit={submit} className="grid gap-5">
        <Field label="Name"><Input required value={form.name} onChange={set('name')} placeholder="e.g. Boys Dormitory - Block A" /></Field>
        <Field label="Description"><Textarea rows={3} value={form.description} onChange={set('description')} placeholder="Brief details about the room..." /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Capacity (beds)"><Input required type="number" min={1} value={form.capacity} onChange={set('capacity')} /></Field>
          <Field label="Amenities" hint="Comma-separated"><Input value={form.amenities} onChange={set('amenities')} placeholder="WiFi, AC, Attached bath" /></Field>
        </div>
        <div>
          <p className="mb-1.5 text-[14px] font-semibold text-ink">Photo</p>
          <div className="flex flex-wrap items-center gap-3">
            <Button asChild variant="secondary" size="sm" className="cursor-pointer">
              <label><ImagePlus size={17} aria-hidden="true" /> {form.img ? 'Change image' : 'Choose an image'}<input type="file" accept="image/*" className="sr-only" onChange={onImage} /></label>
            </Button>
            {form.img && <img src={form.img} alt="Selected" className="h-14 w-24 rounded-lg object-cover" />}
          </div>
        </div>
      </form>
    </Modal>
  )
}

export default ListingModal
