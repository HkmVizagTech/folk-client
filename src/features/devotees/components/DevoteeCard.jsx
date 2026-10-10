import React from 'react'
import { Edit2, Flame, MapPin, Phone, QrCode, Shield, Star, Trash2, Trophy } from 'lucide-react'
import { Avatar, Badge, Button, Card } from '../../../components/ui'
import { levelLabel, roleLabel, ROLE_TONE } from '../lib/levels'

const Stat = ({ icon: Icon, children, tone }) => (
  <span className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[12px] font-semibold ${tone}`}>
    <Icon size={12} aria-hidden="true" />{children}
  </span>
)

const DevoteeCard = ({ devotee, canDelete, onQr, onEdit, onDelete }) => {
  const name = devotee.name || 'devotee'
  return (
    <Card padded={false} hover className="flex h-full flex-col">
      <div className="flex-1 p-5">
        <div className="flex items-start gap-4">
          <Avatar name={devotee.name} src={devotee.photo} size="lg" />
          <div className="min-w-0 flex-1">
            <Badge tone={ROLE_TONE[devotee.role] || 'saffron'} size="sm">{roleLabel(devotee.role)}</Badge>
            <h3 className="mt-1.5 truncate font-display text-[18px] font-semibold text-ink" title={devotee.name}>{devotee.name || 'Unnamed'}</h3>
            <p className="mt-0.5 flex items-center gap-1.5 text-[14px] text-ink-muted"><Phone size={14} aria-hidden="true" />{devotee.phone || 'No phone'}</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Stat icon={Flame} tone="bg-saffron-50 text-saffron-dark">{devotee.streak || 0}d streak</Stat>
          <Stat icon={Trophy} tone="bg-navy-50 text-navy">{devotee.longestStreak || 0}d best</Stat>
          <Stat icon={Star} tone="bg-marigold-light/40 text-marigold-dark">{devotee.score || 0} pts</Stat>
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-line/80 px-5 py-3">
        <div className="min-w-0 space-y-1 text-[13px] text-ink-muted">
          <p className="flex items-center gap-1.5 font-semibold text-navy"><Shield size={14} aria-hidden="true" />{levelLabel(devotee.level)}</p>
          <p className="flex items-center gap-1.5"><MapPin size={14} aria-hidden="true" /><span className="truncate">{devotee.address || 'Vizag'}</span></p>
        </div>
        <div className="flex shrink-0 gap-1">
          <Button variant="ghost" size="icon" onClick={onQr} title="View Vaikuntha ID" aria-label={`View Vaikuntha ID for ${name}`}><QrCode size={18} /></Button>
          <Button variant="ghost" size="icon" onClick={onEdit} title="Edit devotee" aria-label={`Edit ${name}`}><Edit2 size={18} /></Button>
          {canDelete && <Button variant="ghost" size="icon" onClick={onDelete} title="Delete devotee" aria-label={`Delete ${name}`} className="text-red-600 hover:bg-red-50 hover:text-red-700"><Trash2 size={18} /></Button>}
        </div>
      </div>
    </Card>
  )
}

export default DevoteeCard
