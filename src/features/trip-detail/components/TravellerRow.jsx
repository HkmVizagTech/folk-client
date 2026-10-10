import { Field, Input, Select } from '../../../components/ui'
import { GENDERS, ID_TYPES, YEARS } from '../lib/travellers'

const TravellerRow = ({ index, row, onChange }) => {
  const bind = (key) => ({ value: row[key], onChange: (e) => onChange(index, key, e.target.value) })
  return (
    <div className="rounded-xl border border-line/80 bg-white/80 p-4">
      <p className="mb-3 text-[13px] font-semibold uppercase tracking-label text-saffron-dark">Traveller {index + 1}{index === 0 ? ' (you)' : ''}</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Full name, as on the ID" className="sm:col-span-2"><Input {...bind('name')} placeholder="e.g. Ravi Kumar" /></Field>
        <Field label="Age"><Input type="number" min={1} max={120} inputMode="numeric" {...bind('age')} placeholder="21" /></Field>
        <Field label="Gender">
          <Select {...bind('gender')}>
            <option value="">Select</option>
            {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
          </Select>
        </Field>
        <Field label="ID type">
          <Select {...bind('idType')}>{ID_TYPES.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}</Select>
        </Field>
        <Field label="ID number"><Input {...bind('idNumber')} placeholder="As printed on the ID" /></Field>
        <Field label="College or workplace" className="sm:col-span-2"><Input {...bind('college')} placeholder="e.g. Andhra University" /></Field>
        <Field label="Course"><Input {...bind('course')} placeholder="e.g. B.Tech CSE" /></Field>
        <Field label="Year">
          <Select {...bind('year')}>
            <option value="">Select</option>
            {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
          </Select>
        </Field>
      </div>
    </div>
  )
}

export default TravellerRow
