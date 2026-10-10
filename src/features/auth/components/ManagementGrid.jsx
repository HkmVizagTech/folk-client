import React from 'react'
import { ArrowRight } from 'lucide-react'
import { Card } from '../../../components/ui'
import { cn } from '../../../lib/utils'
import { MANAGEMENT_LINKS } from '../lib/managementLinks'

const ManagementGrid = ({ onOpen }) => (
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
    {MANAGEMENT_LINKS.map(({ id, label, desc, icon: Icon, tone }) => (
      <Card key={id} data-reveal interactive padded={false} className="h-full">
        <button type="button" onClick={() => onOpen(id)} className="group flex h-full w-full flex-col rounded-2xl p-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron sm:p-6">
          <span className={cn('mb-4 flex h-11 w-11 items-center justify-center rounded-xl', tone)}>
            <Icon size={22} aria-hidden="true" />
          </span>
          <span className="flex items-center justify-between font-display text-[18px] font-semibold text-ink">
            {label}
            <ArrowRight size={18} className="text-ink-muted transition-transform group-hover:translate-x-1 group-hover:text-saffron" aria-hidden="true" />
          </span>
          <span className="mt-1 text-[14px] leading-relaxed text-ink-muted">{desc}</span>
        </button>
      </Card>
    ))}
  </div>
)

export default ManagementGrid
