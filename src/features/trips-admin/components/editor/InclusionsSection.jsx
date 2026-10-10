import React from 'react'
import { StringListEditor } from '../FormBits'
import { useEditor } from './EditorContext'

const InclusionsSection = () => {
  const { form, setField } = useEditor()
  return (
    <>
      <StringListEditor label="Inclusions" items={form.inclusions} onChange={(v) => setField('inclusions', v)} placeholder="AC bus travel, prasadam, accommodation" />
      <div className="h-px bg-line" aria-hidden="true" />
      <StringListEditor label="Exclusions" items={form.exclusions} onChange={(v) => setField('exclusions', v)} placeholder="Personal shopping, entry tickets" />
    </>
  )
}

export default InclusionsSection
