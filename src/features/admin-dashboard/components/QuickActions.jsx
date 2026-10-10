import React from 'react'
import { Plus, Calendar, Heart, Home, Building2, Bus, ScanLine } from 'lucide-react'
import { Section } from '../../../components/common'

const ACTIONS = [
  { label: 'Add devotee', icon: Plus, tab: 'devotees' },
  { label: 'New event', icon: Calendar, tab: 'events' },
  { label: 'Manage seva', icon: Heart, tab: 'seva' },
  { label: 'Verify stay', icon: Home, tab: 'accommodation' },
  { label: 'Manage residency', icon: Building2, tab: 'hostels' },
  { label: 'Manage trips', icon: Bus, tab: 'trips-admin' },
  { label: 'Scan check-in', icon: ScanLine, tab: 'attendance' },
]

const QuickActions = ({ onNavigate, onOpenScanner }) => (
  <Section title="Quick actions">
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {ACTIONS.map(({ label, icon: Icon, tab }) => (
        <button
          key={tab}
          type="button"
          onClick={() => (tab === 'attendance' ? onOpenScanner('attendance') : onNavigate(tab))}
          className="group flex min-h-[56px] items-center gap-3 rounded-2xl border border-line/80 bg-white p-3 text-left text-[14px] font-semibold text-ink shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-marigold/50 hover:shadow-premium-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron"
        >
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-saffron-50 text-saffron-dark transition-colors group-hover:bg-saffron group-hover:text-white">
            <Icon size={20} aria-hidden="true" />
          </span>
          <span className="min-w-0 leading-tight">{label}</span>
        </button>
      ))}
    </div>
  </Section>
)

export default QuickActions
