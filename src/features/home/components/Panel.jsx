import React from 'react'
import { ArrowRight } from 'lucide-react'
import { Button, Card } from '../../../components/ui'
import { cn } from '../../../lib/utils'

/** Titled dashboard card: <Panel title action onAction>…</Panel>. */
const Panel = ({ title, action, onAction, children, className, hover = true }) => (
  <Card padded={false} hover={hover} data-reveal className={cn('flex flex-col', className)}>
    <Card.Header className="items-center">
      <h2 className="text-[12px] font-bold uppercase tracking-label text-ink-muted">{title}</h2>
      {action && (
        <Button variant="ghost" size="sm" onClick={onAction} className="-mr-3 text-saffron-dark hover:text-saffron">
          {action} <ArrowRight size={14} aria-hidden="true" />
        </Button>
      )}
    </Card.Header>
    <Card.Body className="flex flex-1 flex-col">{children}</Card.Body>
  </Card>
)

export default Panel
