import React from 'react'
import { Badge } from '../../../components/ui'
import { audienceOf } from '../../../content/audiences'
import { toneOf } from '../lib/audienceTone'

const AudienceChip = ({ event }) => {
  const a = audienceOf(event)
  const { icon: Icon, chip } = toneOf(a.id)
  return <Badge tone={chip}><Icon size={12} aria-hidden="true" /> {a.short}</Badge>
}

export default AudienceChip
