import React from 'react'
import { CalendarDays, CheckCircle2, Home, Send, Users } from 'lucide-react'
import { Button, Card, Field, Input, Select, Textarea } from '../../../components/ui'
import { STAY_TYPES } from '../lib/accommodation'

const IconInput = ({ icon: Icon, ...props }) => (
  <div className="relative">
    <Icon size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" aria-hidden="true" />
    <Input className="pl-11" {...props} />
  </div>
)

/** Presentational booking form; state lives in useRequestForm. */
const RequestForm = ({ form, set, onSubmit, submitting, error, sent }) => (
  <Card padded={false} className="relative overflow-hidden">
    <Home size={120} className="pointer-events-none absolute -right-4 -top-4 text-marigold opacity-10" aria-hidden="true" />
    <Card.Header>
      <div className="flex items-center gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-saffron-50 text-saffron-dark"><Home size={20} aria-hidden="true" /></span>
        <div>
          <Card.Title>Request a room</Card.Title>
          <Card.Description className="mt-0">Staff review every request and confirm by message.</Card.Description>
        </div>
      </div>
    </Card.Header>
    <Card.Body className="relative">
      <form onSubmit={onSubmit} className="grid gap-5">
        {error && <p role="alert" className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-[14px] font-semibold text-red-700">{error}</p>}
        {sent && (
          <p role="status" className="flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-[14px] font-semibold text-emerald-700">
            <CheckCircle2 size={16} aria-hidden="true" /> Request sent. Staff will review it and confirm your stay.
          </p>
        )}

        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Accommodation type">
            <Select value={form.type} onChange={(e) => set('type', e.target.value)}>
              {STAY_TYPES.map((t) => <option key={t}>{t}</option>)}
            </Select>
          </Field>
          <Field label="Number of guests">
            <IconInput icon={Users} type="number" min={1} value={form.guestCount} onChange={(e) => set('guestCount', e.target.value)} />
          </Field>
          <Field label="Arrival date">
            <IconInput icon={CalendarDays} required type="date" value={form.arrivalDate} onChange={(e) => set('arrivalDate', e.target.value)} />
          </Field>
          <Field label="Departure date">
            <IconInput icon={CalendarDays} required type="date" min={form.arrivalDate || undefined} value={form.departureDate} onChange={(e) => set('departureDate', e.target.value)} />
          </Field>
        </div>

        <Field label="Special requirements / purpose">
          <Textarea rows={4} value={form.requirements} onChange={(e) => set('requirements', e.target.value)} placeholder="E.g. Ground floor preferred, coming for Janmashtami seva..." />
        </Field>

        <Button type="submit" size="lg" loading={submitting} className="w-full">
          {!submitting && <Send size={18} aria-hidden="true" />}
          {submitting ? 'Submitting...' : 'Submit booking request'}
        </Button>
      </form>
    </Card.Body>
  </Card>
)

export default RequestForm
