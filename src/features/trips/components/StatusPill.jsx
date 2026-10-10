import { cn } from '../../../lib/utils'
import { statusLabel } from '../lib/format'
import { STATUS_TONE } from '../lib/status'

const StatusPill = ({ status = 'upcoming', className }) => (
  <span className={cn('inline-flex h-7 items-center rounded-full px-3 text-[12px] font-semibold shadow-sm', STATUS_TONE[status] || STATUS_TONE.upcoming, className)}>
    {statusLabel(status)}
  </span>
)

export default StatusPill
