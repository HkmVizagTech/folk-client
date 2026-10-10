import React, { useRef } from 'react'
import { Camera, CheckCircle2, Info, RefreshCw, StopCircle, X, Zap } from 'lucide-react'
import { Button, Card } from '../../../components/ui'
import { gsap, useGSAP, prefersReducedMotion } from '../../../lib/motion'
import { cn } from '../../../lib/utils'
import { READER_ID } from '../hooks/useQrScanner'

const ErrorNote = ({ children }) => (
  <p role="alert" className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-[13px] font-semibold text-red-700">
    <Info size={15} className="shrink-0" aria-hidden="true" /> {children}
  </p>
)

const CameraOption = ({ camera, index, selected, onSelect }) => (
  <button
    type="button"
    onClick={() => onSelect(camera.id)}
    aria-pressed={selected}
    className={cn(
      'flex min-h-[56px] items-center gap-3 rounded-xl border-2 p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron',
      selected ? 'border-saffron bg-saffron-50' : 'border-line bg-white hover:border-marigold/60',
    )}
  >
    <span className={cn('inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', selected ? 'bg-saffron text-white' : 'bg-paper text-ink-muted')}>
      <Camera size={20} aria-hidden="true" />
    </span>
    <span className="min-w-0 flex-1">
      <span className={cn('block truncate text-[14px] font-semibold', selected ? 'text-saffron-dark' : 'text-ink')}>{camera.label || `Camera ${index + 1}`}</span>
      <span className="block truncate text-[12px] text-ink-muted">{camera.id.slice(0, 12)}...</span>
    </span>
    {selected && <span className="h-2 w-2 animate-pulse rounded-full bg-saffron" aria-hidden="true" />}
  </button>
)

const Viewfinder = ({ scanning }) => (
  <div className="relative aspect-square overflow-hidden rounded-3xl border-8 border-paper-dark bg-ink shadow-inner">
    <div id={READER_ID} className="h-full w-full" />
    {scanning ? (
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-8 rounded-2xl border-2 border-saffron/60" />
        <div className="absolute left-8 right-8 top-1/2 h-0.5 animate-scan bg-saffron/50" />
      </div>
    ) : (
      <div className="absolute inset-0 flex flex-col items-center justify-center text-white/30">
        <Zap size={56} className="mb-3" aria-hidden="true" />
        <p className="text-[12px] font-semibold uppercase tracking-label">Camera standby</p>
      </div>
    )}
  </div>
)

const ScannerBody = ({ scanner }) => {
  const { cameras, cameraId, setCameraId, scanning, result, error, start, stop } = scanner
  const ref = useRef(null)
  useGSAP(() => {
    if (prefersReducedMotion()) return
    gsap.from(ref.current, { autoAlpha: 0, y: 12, duration: 0.4, ease: 'power3.out' })
  }, { scope: ref })

  return (
    <div ref={ref} className="grid items-start gap-6 md:grid-cols-2">
      <div className="grid gap-5">
        <div className="grid gap-2.5">
          <p className="text-[12px] font-semibold uppercase tracking-label text-ink-muted">Scanning device</p>
          {cameras.map((c, i) => <CameraOption key={c.id} camera={c} index={i} selected={cameraId === c.id} onSelect={setCameraId} />)}
          {(cameras.length === 0 || error) && <ErrorNote>{error || 'No cameras detected. Please check permissions.'}</ErrorNote>}
        </div>

        <div className="flex gap-3">
          {scanning ? (
            <Button variant="danger" size="lg" className="flex-1" onClick={stop}><StopCircle size={18} aria-hidden="true" /> Stop scanning</Button>
          ) : (
            <Button size="lg" className="flex-1" onClick={start} disabled={!cameraId}>Start scanning</Button>
          )}
          <Button variant="secondary" size="lg" className="w-[52px] px-0" aria-label="Reload scanner" onClick={() => window.location.reload()}>
            <RefreshCw size={18} aria-hidden="true" />
          </Button>
        </div>

        {result && (
          <div role="status" className="flex items-center gap-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
            <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white"><CheckCircle2 size={24} aria-hidden="true" /></span>
            <div className="min-w-0">
              <p className="text-[12px] font-semibold uppercase tracking-label text-emerald-700">Scan successful</p>
              <p className="break-all font-mono text-[14px] font-semibold text-emerald-900">{result}</p>
            </div>
          </div>
        )}
      </div>
      <Viewfinder scanning={scanning} />
    </div>
  )
}

/** Staff-only quick check-in desk. */
const ScannerPanel = ({ scanner }) => (
  <Card>
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <h2 className="flex items-center gap-3 font-display text-[20px] font-semibold text-ink">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-saffron-50 text-saffron-dark"><Zap size={20} aria-hidden="true" /></span>
        Quick check-in scanner
      </h2>
      <Button variant={scanner.isOpen ? 'secondary' : 'primary'} onClick={scanner.toggle} className="w-full sm:w-auto">
        {scanner.isOpen ? <X size={18} aria-hidden="true" /> : <Camera size={18} aria-hidden="true" />}
        {scanner.isOpen ? 'Close scanner' : 'Open scanner'}
      </Button>
    </div>
    {scanner.isOpen && <div className="mt-6"><ScannerBody scanner={scanner} /></div>}
  </Card>
)

export default ScannerPanel
