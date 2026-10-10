import React from 'react'
import { MessageCircle, Phone, UserRound } from 'lucide-react'
import { Avatar, Button } from '../../../components/ui'
import { waLink, telLink } from '../lib/format'
import Panel from './Panel'

const GuideCard = ({ name, phone }) => (
  <Panel title="My FOLK guide">
    {name ? (
      <>
        <div className="flex items-center gap-4">
          <Avatar name={name} size="lg" className="ring-marigold/60" />
          <div className="min-w-0">
            <p className="user-text font-display text-[18px] font-semibold">{name}</p>
            <p className="text-[14px] text-ink-muted">Walks the path with you</p>
          </div>
        </div>
        {phone && (
          <div className="mt-auto grid grid-cols-2 gap-2 pt-5">
            <Button asChild variant="secondary"><a href={waLink(phone)} target="_blank" rel="noopener noreferrer"><MessageCircle size={17} aria-hidden="true" /> WhatsApp</a></Button>
            <Button asChild variant="secondary"><a href={telLink(phone)}><Phone size={17} aria-hidden="true" /> Call</a></Button>
          </div>
        )}
      </>
    ) : (
      <div className="flex flex-col items-start gap-3">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-paper text-ink-muted"><UserRound size={22} aria-hidden="true" /></span>
        <p className="text-[15px] text-ink-muted">A FOLK guide will be assigned to you soon. They&apos;ll reach out on WhatsApp.</p>
      </div>
    )}
  </Panel>
)

export default GuideCard
