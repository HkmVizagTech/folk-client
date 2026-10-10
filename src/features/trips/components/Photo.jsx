import { useEffect, useRef, useState } from 'react'
import { cn } from '../../../lib/utils'

/**
 * The one image box used across trip screens.
 *
 * Photographs are async CDN fetches, so the caller always gives the box a fixed
 * aspect ratio (nothing reflows), the <img> is lazy and fades in, and until it
 * lands - or when `src` is empty or broken - a warm brand surface fills the box.
 */
const Photo = ({ src, alt = '', tone, icon = null, className, imgClassName, eager = false, children }) => {
  const imgRef = useRef(null)
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)

  // `complete` covers a cached image whose load fired before React attached the handler.
  useEffect(() => {
    setFailed(false)
    const node = imgRef.current
    setLoaded(!!(node && node.complete && node.naturalWidth > 0))
  }, [src])

  const hasImage = !!src && !failed

  return (
    <div className={cn('relative overflow-hidden bg-paper-dark', className)}>
      {(!hasImage || !loaded) && (
        <div className={cn('absolute inset-0 bg-gradient-to-br', tone)} aria-hidden="true">
          <div className="absolute inset-0 yatra-mandala opacity-20 mix-blend-soft-light" />
          {hasImage ? (
            <div className="absolute inset-0 yatra-shimmer" />
          ) : icon ? (
            <div className="absolute inset-0 flex items-center justify-center text-white/45">{icon}</div>
          ) : null}
        </div>
      )}

      {hasImage && (
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={cn(
            'absolute inset-0 h-full w-full max-w-full object-cover transition-[opacity,transform] duration-700 ease-out',
            loaded ? 'opacity-100' : 'opacity-0',
            imgClassName,
          )}
        />
      )}

      {children}
    </div>
  )
}

export default Photo
