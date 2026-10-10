import React from 'react'
import { QrCode, Ticket } from 'lucide-react'
import { Button, Card, Input, Select, Tabs } from '../../../components/ui'
import VerifyResult from './VerifyResult'

const VerifyPanel = ({ events, eventId, onEventChange, mode, onModeChange, verification, onOpenScanner }) => {
  const { token, setToken, verifying, result, verify, dismiss } = verification
  return (
    <Card data-reveal padded={false}>
      <Card.Header className="items-center">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-saffron-50 text-saffron-dark"><QrCode size={20} aria-hidden="true" /></span>
          <Card.Title>Verify attendee</Card.Title>
        </div>
      </Card.Header>
      <Card.Body className="space-y-5">
        <Select aria-label="Event" value={eventId} onChange={(e) => onEventChange(e.target.value)}>
          <option value="">Auto-detect active event</option>
          {events.map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}
        </Select>

        <Tabs value={mode} onValueChange={onModeChange}>
          <Tabs.List aria-label="Scan mode" className="flex w-full">
            <Tabs.Trigger value="attendance" className="flex-1">Attendance</Tabs.Trigger>
            <Tabs.Trigger value="prasadam" className="flex-1">Prasadam</Tabs.Trigger>
          </Tabs.List>
        </Tabs>

        <Button variant="dark" size="lg" className="w-full" disabled={verifying} onClick={() => onOpenScanner(mode)}>
          <QrCode size={20} aria-hidden="true" /> Open camera scanner
        </Button>

        <div className="flex items-center gap-3" aria-hidden="true">
          <span className="h-px flex-1 bg-line" />
          <span className="text-[12px] font-semibold uppercase tracking-label text-ink-muted">or use a token</span>
          <span className="h-px flex-1 bg-line" />
        </div>

        <form onSubmit={verify} className="space-y-3">
          <div className="relative">
            <Ticket size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" aria-hidden="true" />
            <Input aria-label="Token" value={token} onChange={(e) => setToken(e.target.value)} placeholder="Enter token" autoCapitalize="characters" className="h-12 pl-10 font-mono text-[17px] font-semibold uppercase tracking-widest" />
          </div>
          <Button type="submit" className="w-full" loading={verifying} disabled={!token.trim()}>{verifying ? 'Verifying…' : 'Verify token'}</Button>
        </form>

        {result && <VerifyResult result={result} onDismiss={dismiss} />}
      </Card.Body>
    </Card>
  )
}

export default VerifyPanel
