import React from 'react'
import { Card } from '../../../components/ui'
import { cn } from '../../../lib/utils'

const TONES = {
  saffron: 'bg-saffron-50 text-saffron-dark',
  maroon: 'bg-navy-50 text-navy',
  gold: 'bg-marigold-light/40 text-marigold-dark',
  green: 'bg-emerald-50 text-emerald-700',
}

/**
 * Titled card for dashboards: icon chip, title, optional badges/actions on the right.
 *   <PanelCard icon={Bus} title="Trips" actions={…}>…</PanelCard>
 * `flush` lets tables run edge to edge.
 */
const PanelCard = ({ icon: Icon, tone = 'saffron', title, description, actions, flush, children, className }) => (
  <Card data-reveal padded={false} className={cn('overflow-hidden', className)}>
    <Card.Header className="flex-wrap items-center">
      <div className="flex min-w-0 items-center gap-3">
        {Icon && <span className={cn('inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', TONES[tone])}><Icon size={20} aria-hidden="true" /></span>}
        <div className="min-w-0">
          <Card.Title>{title}</Card.Title>
          {description && <Card.Description className="mt-0">{description}</Card.Description>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </Card.Header>
    <div className={cn(flush ? 'pt-4' : 'px-5 pb-5 pt-4 sm:px-6 sm:pb-6')}>{children}</div>
  </Card>
)

export default PanelCard
