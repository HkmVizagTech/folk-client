import React from 'react'
import { Button, Field, Input, Modal, Select, Textarea } from '../../../components/ui'
import { SEVA_TYPES } from '../lib/seva'

const SevaFormModal = ({ open, form, onChange, onSubmit, onClose, saving, error }) => {
  const bind = (name) => ({ value: form[name], onChange: (e) => onChange(name, e.target.value) })
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Open new seva"
      description="Opportunities to serve are blessings."
      footer={<><Button variant="secondary" onClick={onClose}>Discard</Button><Button type="submit" form="seva-form" loading={saving}>Create seva</Button></>}
    >
      <form id="seva-form" onSubmit={onSubmit} className="space-y-4">
        {error && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-[14px] text-red-700">{error}</p>}
        <Field label="Service title"><Input required placeholder="e.g. Temple cleaning" {...bind('title')} /></Field>
        <Field label="Description"><Textarea required placeholder="Describe the seva details..." {...bind('description')} /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Seva type"><Select {...bind('sevaType')}>{SEVA_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}</Select></Field>
          <Field label="Max slots"><Input required type="number" min={1} {...bind('maxVolunteers')} /></Field>
          <Field label="Date"><Input required type="date" {...bind('date')} /></Field>
          <Field label="Time"><Input required type="time" {...bind('time')} /></Field>
        </div>
        <Field label="Location"><Input required placeholder="e.g. Main temple hall" {...bind('location')} /></Field>
      </form>
    </Modal>
  )
}

export default SevaFormModal
