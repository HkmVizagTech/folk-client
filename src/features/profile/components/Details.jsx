import React from 'react'
import { Input, Select } from '../../../components/ui'
import { cn } from '../../../lib/utils'

/**
 * Compound read/edit field list:
 *   <Details><Details.Section title icon><Details.Item … /></Details.Section></Details>
 */
const Details = ({ className, ...p }) => <div className={cn('space-y-8', className)} {...p} />

const Section = ({ title, icon: Icon, children }) => (
  <section>
    <h3 className="mb-3 flex items-center gap-2 text-[12px] font-bold uppercase tracking-label text-ink-muted">
      {Icon && <Icon size={15} className="text-saffron" aria-hidden="true" />} {title}
    </h3>
    <div className="grid gap-3 sm:grid-cols-2">{children}</div>
  </section>
)

const Item = ({ icon: Icon, label, name, value, editing, onChange, type = 'text', options, readOnly }) => {
  const editable = editing && !readOnly
  const id = `profile-${name}`
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-line bg-white p-4 transition-colors hover:border-marigold/50">
      <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-saffron-50 text-saffron-dark"><Icon size={20} aria-hidden="true" /></span>
      <div className="min-w-0 flex-1">
        <label htmlFor={id} className="mb-1 block text-[12px] font-semibold uppercase tracking-label text-ink-muted">{label}</label>
        {editable ? (
          options ? (
            <Select id={id} value={value} onChange={(e) => onChange(name, e.target.value)} className="h-10">
              {!options.includes(value) && <option value="">Select</option>}
              {options.map((o) => <option key={o} value={o}>{o}</option>)}
            </Select>
          ) : (
            <Input id={id} type={type} value={value} onChange={(e) => onChange(name, e.target.value)} className="h-10" />
          )
        ) : (
          <p id={id} className="user-text truncate text-[16px] font-semibold text-ink">{value || <span className="font-normal italic text-ink-muted/60">Not specified</span>}</p>
        )}
      </div>
    </div>
  )
}

Details.Section = Section
Details.Item = Item

export default Details
