import React from 'react'
import { cn } from '../../lib/utils'
import { useReveal } from '../../hooks/useReveal'

/**
 * Page container: width, rhythm and the entrance animation in one place.
 * Anything inside marked `data-reveal` fades up in sequence.
 *   <Page><PageHeader …/><section data-reveal>…</section></Page>
 */
const Page = ({ className, width = 'max-w-6xl', children, revealKey }) => {
  const ref = useReveal({ deps: [revealKey] })
  return <div ref={ref} className={cn('mx-auto w-full', width, className)}>{children}</div>
}

export default Page
