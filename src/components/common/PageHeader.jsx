import React from 'react'
import { cn } from '../../lib/utils'

/**
 * Standard screen heading. Compound-friendly: pass `actions` for buttons on
 * the right, `children` for anything under the description (tabs, filters).
 */
const PageHeader = ({ kicker, title, description, actions, children, className }) => (
  <header data-reveal className={cn('mb-6 sm:mb-8', className)}>
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {kicker && <p className="kicker mb-2">{kicker}</p>}
        <h1 className="font-display text-[28px] sm:text-[34px] font-semibold leading-tight text-navy">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-[15px] sm:text-[16px] text-ink-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
    </div>
    {children && <div className="mt-5">{children}</div>}
    <div className="mt-6 h-px bg-gradient-to-r from-marigold/60 via-line to-transparent" aria-hidden="true" />
  </header>
)

export default PageHeader
