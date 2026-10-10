import React from 'react'
import { AlertTriangle, CalendarCheck, Flame, History, MessageCircle, NotebookPen, Phone, UserCheck } from 'lucide-react'
import { Avatar, Badge, Button, Card } from '../../../components/ui'
import { stageLabel } from '../../../content/journey'
import { formatPhone, telUrl, whatsappUrl } from '../../../lib/phone'
import { formatDay } from '../../../lib/dates'
import { cn } from '../../../lib/utils'
import { dayFromKey } from '../lib/memberMetrics'

const Signal = ({ icon: Icon, tone = 'bg-paper text-ink-soft', iconClass, className, children }) => (
  <span className={cn('flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium', tone, className)}>
    <Icon size={15} className={cn('shrink-0', iconClass)} aria-hidden="true" />{children}
  </span>
)

const chantText = (m) => `${m.chantGap === null ? 'Never chanted' : m.chantGap === 0 ? 'Chanted today' : `Chanted ${m.chantGap}d ago`}${m.streak ? ` · ${m.streak}d streak` : ''}`
const seenText = (m) => (m.seenGap === null ? 'Never checked in' : m.seenGap === 0 ? 'At a program today' : `Program ${m.seenGap}d ago`)
const attendanceTone = (m) => (m.attended === 0 ? 'bg-red-50 text-red-700' : m.attended >= Math.ceil(m.programs / 2) ? 'bg-emerald-50 text-emerald-800' : undefined)

const ContactButtons = ({ member }) => member.phone && (
  <div className="flex shrink-0 gap-1">
    <Button asChild variant="secondary" size="icon" className="h-11 w-11 text-emerald-700">
      <a href={whatsappUrl(member.phone, `Hare Krishna ${member.displayName.split(' ')[0]}!`)} target="_blank" rel="noopener noreferrer" aria-label={`WhatsApp ${member.displayName}`}><MessageCircle size={18} /></a>
    </Button>
    <Button asChild variant="secondary" size="icon" className="h-11 w-11">
      <a href={telUrl(member.phone)} aria-label={`Call ${member.displayName}`}><Phone size={18} /></a>
    </Button>
  </div>
)

const MemberCard = ({ member: m, showReasons, onLog, onHistory }) => {
  const urgent = m.reasons.filter((r) => r.weight >= 2)
  return (
    <Card padded={false} hover className="flex h-full flex-col">
      <div className="flex-1 space-y-4 p-5">
        <div className="flex items-start gap-3">
          <Avatar name={m.displayName} src={m.photo} />
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-[17px] font-semibold text-ink user-text">{m.displayName}</p>
            <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-ink-muted">
              <span>{formatPhone(m.phone) || 'No phone'}</span>
              <Badge tone="maroon" size="sm">{stageLabel(m.stage)}</Badge>
            </p>
          </div>
          <ContactButtons member={m} />
        </div>

        <div className="grid grid-cols-1 gap-2 min-[480px]:grid-cols-2">
          <Signal icon={Flame} iconClass="text-saffron">{chantText(m)}</Signal>
          <Signal icon={CalendarCheck} iconClass="text-navy-500">{seenText(m)}</Signal>
          {m.programs > 0 && (
            <Signal icon={UserCheck} tone={attendanceTone(m)} className="min-[480px]:col-span-2">Came to {m.attended} of the last {m.programs} programs</Signal>
          )}
        </div>

        {showReasons && urgent.length > 0 && (
          <ul className="space-y-1.5 rounded-lg border border-red-100 bg-red-50/60 p-3 text-[13px] font-medium text-red-700">
            {urgent.map((r) => <li key={r.text} className="flex gap-2"><AlertTriangle size={15} className="mt-0.5 shrink-0" aria-hidden="true" />{r.text}</li>)}
          </ul>
        )}
        {m.lastFollowUpNote && <p className="text-[14px] text-ink-muted user-text"><span className="font-semibold text-ink-soft">Last note:</span> {m.lastFollowUpNote}</p>}
        {m.snoozed && <p className="text-[13px] font-medium text-navy">Next follow-up {formatDay(dayFromKey(m.nextFollowUpDate))}</p>}
      </div>

      <div className="flex gap-2 border-t border-line/80 p-4">
        <Button variant="dark" className="flex-1" onClick={onLog}><NotebookPen size={16} aria-hidden="true" /> Log follow-up</Button>
        <Button variant="secondary" onClick={onHistory}><History size={16} aria-hidden="true" /> History</Button>
      </div>
    </Card>
  )
}

export default MemberCard
