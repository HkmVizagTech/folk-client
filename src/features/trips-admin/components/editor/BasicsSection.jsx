import React from 'react'
import { Field, Input, Textarea } from '../../../../components/ui/Field'
import Button from '../../../../components/ui/Button'
import { slugify } from '../../lib/format'
import { StringListEditor } from '../FormBits'
import { useEditor } from './EditorContext'

const BasicsSection = () => {
  const { form, setField, errors, showErrors, changeTitle, changeSlug, regenerateSlug } = useEditor()
  const err = (k) => (showErrors ? errors[k] : '')

  return (
    <>
      <Field label="Trip title" error={err('title')}>
        <Input value={form.title} onChange={(e) => changeTitle(e.target.value)} placeholder="Vrindavan Yatra 2026" />
      </Field>

      <Field label="Slug" hint={`Public page: /trip/${form.slug || '…'}`} error={err('slug')}>
        <span className="flex gap-2">
          <Input
            value={form.slug}
            onChange={(e) => changeSlug(e.target.value)}
            onBlur={(e) => setField('slug', slugify(e.target.value))}
            placeholder="vrindavan-yatra-2026"
            className="min-w-0 font-mono"
          />
          <Button type="button" variant="soft" className="rounded-xl" aria-label="Regenerate slug from title" onClick={regenerateSlug}>Auto</Button>
        </span>
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Subtitle">
          <Input value={form.subtitle} onChange={(e) => setField('subtitle', e.target.value)} placeholder="Kartik month pilgrimage" />
        </Field>
        <Field label="Location">
          <Input value={form.location} onChange={(e) => setField('location', e.target.value)} placeholder="Vrindavan, Uttar Pradesh" />
        </Field>
      </div>

      <Field label="Description">
        <Textarea rows={5} value={form.description} onChange={(e) => setField('description', e.target.value)} placeholder="What devotees will experience on this yatra…" />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Meeting point">
          <Input value={form.meetingPoint} onChange={(e) => setField('meetingPoint', e.target.value)} placeholder="HKM Vizag temple gate, 5:00 AM" />
        </Field>
        <Field label="Contact phone">
          <Input type="tel" value={form.contactPhone} onChange={(e) => setField('contactPhone', e.target.value)} placeholder="+91 90000 00000" />
        </Field>
      </div>

      <StringListEditor label="Highlights" items={form.highlights} onChange={(v) => setField('highlights', v)} placeholder="Govardhan parikrama" />
    </>
  )
}

export default BasicsSection
