import React from 'react'
import { Button, Field, Input, Modal, Textarea } from '../../../components/ui'

const CourseFormModal = ({ open, isNew, form, onChange, onSubmit, onClose, saving, error }) => (
  <Modal
    open={open}
    onClose={onClose}
    title={isNew ? 'New course' : 'Edit course'}
    footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" form="course-form" loading={saving}>Save</Button></>}
  >
    <form id="course-form" onSubmit={onSubmit} className="space-y-4">
      {error && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-[14px] text-red-700">{error}</p>}
      <Field label="Title"><Input required value={form.title} onChange={(e) => onChange('title', e.target.value)} placeholder="e.g. Bhagavad-gita: an introduction" /></Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Number of sessions"><Input type="number" min={1} max={100} value={form.sessions} onChange={(e) => onChange('sessions', e.target.value)} /></Field>
        <Field label="Schedule"><Input value={form.schedule} onChange={(e) => onChange('schedule', e.target.value)} placeholder="e.g. Saturdays, 6 pm" /></Field>
      </div>
      <Field label="Description"><Textarea value={form.description} onChange={(e) => onChange('description', e.target.value)} /></Field>
      <label className="flex min-h-[44px] items-center gap-3">
        <input type="checkbox" checked={form.active} onChange={(e) => onChange('active', e.target.checked)} className="h-5 w-5 accent-navy" />
        <span className="text-[15px]">Open for enrolment</span>
      </label>
    </form>
  </Modal>
)

export default CourseFormModal
