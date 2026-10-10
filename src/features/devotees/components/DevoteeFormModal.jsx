import React, { useState } from 'react'
import { MapPin, Phone, User } from 'lucide-react'
import { Button, Field, Input, Modal, Select } from '../../../components/ui'
import { Alert } from '../../staff-common/components'
import { EMPTY_FORM, LEVELS, formFromDevotee, levelLabel, roleLabel } from '../lib/levels'
import { errorText } from '../lib/errors'

const IconInput = ({ icon: Icon, ...props }) => (
  <div className="relative">
    <Icon size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" aria-hidden="true" />
    <Input className="pl-10" {...props} />
  </div>
)

/** Mounted only while open, so its form state always starts from the devotee being edited. */
const DevoteeFormModal = ({ devotee, isAdmin, onSubmit, onClose }) => {
  const [form, setForm] = useState(devotee ? formFromDevotee(devotee) : EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    if (saving) return
    setSaving(true)
    setError('')
    try {
      await onSubmit(form)
      onClose()
    } catch (err) {
      console.error('Error saving devotee:', err)
      setError(errorText(err, 'Could not save this devotee. Please try again.'))
      setSaving(false)
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={devotee ? 'Edit devotee' : 'Add new devotee'}
      footer={<>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button type="submit" form="devotee-form" loading={saving}>{devotee ? 'Update devotee' : 'Save devotee'}</Button>
      </>}
    >
      <form id="devotee-form" onSubmit={submit} className="space-y-4">
        {error && <Alert>{error}</Alert>}
        <Field label="Full name"><IconInput icon={User} required value={form.name} onChange={set('name')} placeholder="e.g. Rahul Sharma" /></Field>
        <Field label="Phone number"><IconInput icon={Phone} required type="tel" value={form.phone} onChange={set('phone')} placeholder="e.g. +91 9876543210" /></Field>
        <Field label="Address (town / city)"><IconInput icon={MapPin} value={form.address} onChange={set('address')} placeholder="e.g. Visakhapatnam" /></Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Role" hint={isAdmin ? undefined : 'Only an admin can change roles'}>
            {isAdmin ? (
              <Select value={form.role} onChange={set('role')}>
                <option value="devotee">Devotee</option>
                <option value="folks_head">Folks Head</option>
                <option value="admin">Admin</option>
              </Select>
            ) : (
              <Input readOnly disabled value={roleLabel(devotee ? form.role : 'devotee')} />
            )}
          </Field>
          <Field label="Level">
            <Select value={form.level} onChange={set('level')}>
              {/* A devotee still on the old numeric scale would otherwise open a blank select and be re-levelled on save. */}
              {form.level && !LEVELS.includes(form.level) && <option value={form.level}>{levelLabel(form.level)}</option>}
              {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
            </Select>
          </Field>
        </div>
      </form>
    </Modal>
  )
}

export default DevoteeFormModal
