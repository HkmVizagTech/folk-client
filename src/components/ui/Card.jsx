import React from 'react'
import { cn } from '../../lib/utils'

export { cn }

/**
 * Compound card:
 *   <Card><Card.Header><Card.Title>…</Card.Title><Card.Action/></Card.Header><Card.Body/></Card>
 * `padded={false}` lets Header/Body own their padding; plain <Card> keeps the
 * legacy padded surface so existing call sites look right unchanged.
 */
// eslint-disable-next-line no-unused-vars
const Card = React.forwardRef(({ className, hover, interactive, padded = true, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'bg-white border border-line/80 rounded-2xl shadow-card',
      padded && 'p-5 sm:p-6',
      (interactive || hover) && 'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-premium-xl hover:border-marigold/50',
      className,
    )}
    {...props}
  />
))
Card.displayName = 'Card'

const Header = ({ className, ...p }) => <div className={cn('flex items-start justify-between gap-3 px-5 sm:px-6 pt-5 sm:pt-6', className)} {...p} />
const Title = ({ className, ...p }) => <h3 className={cn('font-display text-[18px] font-semibold text-ink leading-snug', className)} {...p} />
const Description = ({ className, ...p }) => <p className={cn('text-[14px] text-ink-muted mt-1', className)} {...p} />
const Body = ({ className, ...p }) => <div className={cn('px-5 sm:px-6 py-4 sm:py-5', className)} {...p} />
const Footer = ({ className, ...p }) => <div className={cn('px-5 sm:px-6 py-4 border-t border-line/80 flex items-center gap-3', className)} {...p} />

Card.Header = Header
Card.Title = Title
Card.Description = Description
Card.Body = Body
Card.Footer = Footer

export default Card
