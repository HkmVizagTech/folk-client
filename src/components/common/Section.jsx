import React from 'react'
import { cn } from '../../lib/utils'

/** Titled block inside a page. */
const Section = ({ title, description, action, children, className }) => (
  <section data-reveal className={cn('mb-8', className)}>
    {(title || action) && (
      <div className="mb-4 flex items-end justify-between gap-3">
        <div className="min-w-0">
          {title && <h2 className="font-display text-[20px] font-semibold text-ink">{title}</h2>}
          {description && <p className="mt-0.5 text-[14px] text-ink-muted">{description}</p>}
        </div>
        {action}
      </div>
    )}
    {children}
  </section>
)

export default Section
