import { Compass } from 'lucide-react'
import { EmptyState } from '../../../components/common'

/** Nothing written up yet: say so rather than dropping the reader on the contact band. */
const ComingSoon = () => (
  <section data-reveal>
    <EmptyState
      icon={Compass}
      title="Full details coming soon"
      description="The itinerary, the places and the inclusions for this yatra are still being written up. The dates and price beside this are confirmed: reserve your seat, or ask the team anything."
    />
  </section>
)

export default ComingSoon
