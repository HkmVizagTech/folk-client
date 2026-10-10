import React from 'react'
import { cn } from '../../../lib/utils'

const ProvisionStatus = ({ state }) => {
  if (state.status === 'idle' || state.status === 'working') return null
  return (
    <p role={state.status === 'error' ? 'alert' : 'status'} className={cn('mt-3 text-[14px] font-semibold leading-relaxed', state.status === 'error' ? 'text-red-600' : 'text-green-700')}>
      {state.message}
    </p>
  )
}

export default ProvisionStatus
