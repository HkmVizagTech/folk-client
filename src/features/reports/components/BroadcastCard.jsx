import React from 'react'
import { Copy, Send } from 'lucide-react'
import { Button, Card, Field, Input, Select } from '../../../components/ui'
import { Alert } from '../../staff-common/components'
import { STAGES } from '../../../content/journey'

const BroadcastCard = ({ isAdmin, form }) => {
  const { audience, chooseAudience, stage, setStage, templateId, setTemplateId, params, setParams, sending, result, dismissResult, recipients, send, copyNumbers } = form
  return (
    <Card data-reveal padded={false}>
      <Card.Header>
        <div>
          <Card.Title>WhatsApp broadcast</Card.Title>
          <Card.Description>Sends an approved WhatsApp template (from your Gupshup account) to a group. The server checks who you&apos;re allowed to message.</Card.Description>
        </div>
      </Card.Header>
      <Card.Body>
        <form onSubmit={send} className="grid gap-5 lg:grid-cols-2">
          <div className="space-y-4">
            <Field label="Send to">
              <Select value={audience} onChange={(e) => chooseAudience(e.target.value)}>
                <option value="mine">My members</option>
                {isAdmin && <option value="all">All members</option>}
                {isAdmin && <option value="stage">Members at a stage</option>}
              </Select>
            </Field>
            {audience === 'stage' && (
              <Field label="Stage">
                <Select value={stage} onChange={(e) => setStage(e.target.value)}>
                  {STAGES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                </Select>
              </Field>
            )}
            <p className="rounded-xl bg-paper px-4 py-3 text-[14px] text-ink-muted"><span className="font-display text-[18px] font-semibold text-ink">{recipients.length}</span> people with a valid mobile number.</p>
          </div>
          <div className="space-y-4">
            <Field label="Template ID" hint="The approved template's ID in Gupshup."><Input value={templateId} onChange={(e) => setTemplateId(e.target.value)} placeholder="e.g. weekly_program_reminder" /></Field>
            <Field label="Template values" hint="Separate values with |, in the template's order."><Input value={params} onChange={(e) => setParams(e.target.value)} placeholder="Sunday feast | 6 pm | Temple hall" /></Field>
          </div>
          {result && <Alert tone={result.tone} onDismiss={dismissResult} className="lg:col-span-2">{result.text}</Alert>}
          <div className="flex flex-wrap gap-2 lg:col-span-2">
            <Button type="submit" loading={sending} disabled={!templateId.trim() || recipients.length === 0}><Send size={17} aria-hidden="true" /> {sending ? 'Sending…' : `Send to ${recipients.length}`}</Button>
            <Button type="button" variant="secondary" onClick={copyNumbers} disabled={!recipients.length}><Copy size={16} aria-hidden="true" /> Copy numbers</Button>
          </div>
        </form>
      </Card.Body>
    </Card>
  )
}

export default BroadcastCard
