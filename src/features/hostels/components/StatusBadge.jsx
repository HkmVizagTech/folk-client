import React from 'react'
import { Badge } from '../../../components/ui'
import { statusMeta } from '../lib/hostels'

const StatusBadge = ({ status }) => {
  const { tone, icon: Icon } = statusMeta(status)
  return (
    <Badge tone={tone} size="sm" className="capitalize"><Icon size={12} aria-hidden="true" />{status}</Badge>
  )
}

export default StatusBadge
