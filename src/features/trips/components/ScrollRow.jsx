import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { cn } from '../../../lib/utils'

/**
 * A horizontally scrolling strip that says it scrolls: whichever edge still has
 * content behind it fades out, driven by the real scroll position.
 */
const ScrollRow = ({ children, className, outerClassName, fadeClass = 'from-paper', chevronClass = 'text-saffron' }) => {
  const ref = useRef(null)
  const [edge, setEdge] = useState({ start: false, end: false })

  const measure = useCallback(() => {
    const el = ref.current
    if (!el) return
    const max = el.scrollWidth - el.clientWidth
    setEdge({ start: el.scrollLeft > 4, end: max > 4 && el.scrollLeft < max - 4 })
  }, [])

  useEffect(() => {
    measure()
    const el = ref.current
    if (!el || typeof ResizeObserver === 'undefined') return undefined
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    Array.from(el.children).forEach((child) => ro.observe(child))
    return () => ro.disconnect()
  }, [measure, children])

  const fade = 'pointer-events-none absolute inset-y-0 to-transparent transition-opacity duration-200'
  return (
    <div className={cn('relative min-w-0', outerClassName)}>
      <div ref={ref} onScroll={measure} className={cn('overflow-x-auto scrollbar-hide', className)}>{children}</div>
      <span aria-hidden="true" className={cn(fade, 'left-0 w-8 bg-gradient-to-r', fadeClass, edge.start ? 'opacity-100' : 'opacity-0')} />
      <span aria-hidden="true" className={cn(fade, 'right-0 w-10 bg-gradient-to-l flex items-center justify-end', fadeClass, edge.end ? 'opacity-100' : 'opacity-0')}>
        <ChevronRight size={15} className={chevronClass} />
      </span>
    </div>
  )
}

export default ScrollRow
