import { ArrowLeft, Compass } from 'lucide-react'
import { Button } from '../../../components/ui'

const TripNotFound = ({ onBack }) => (
  <div className="flex min-h-[60vh] items-center justify-center px-4 py-12 sm:py-16">
    <div className="w-full max-w-md rounded-3xl border border-line/80 bg-white p-8 text-center shadow-card sm:p-12">
      <span className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-saffron-50 text-saffron-dark"><Compass size={28} /></span>
      <h1 className="font-display text-[24px] font-semibold text-ink">This yatra isn&apos;t here</h1>
      <p className="mt-3 text-[15px] leading-relaxed text-ink-muted">
        The trip you&apos;re looking for doesn&apos;t exist, or it may have been removed. Have a look at what&apos;s coming up instead.
      </p>
      <Button variant="dark" size="lg" className="mt-7 w-full" onClick={onBack}><ArrowLeft size={16} /> All trips &amp; yatras</Button>
    </div>
  </div>
)

export default TripNotFound
