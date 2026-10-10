import React from 'react'
import { BedDouble, Edit3, Eye, EyeOff, Users } from 'lucide-react'
import { Badge, Button, Card } from '../../../components/ui'

/** Listing tile. Staff controls render only when `staff` handlers are given. */
const ListingCard = ({ listing, canBook, onBook, staff }) => {
  const hidden = listing.active === false
  const amenities = Array.isArray(listing.amenities) ? listing.amenities : []
  return (
    <Card data-card interactive padded={false} className="group flex h-full flex-col overflow-hidden">
      <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-saffron-50 to-marigold-light/40">
        {listing.img ? (
          <img src={listing.img} alt={listing.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-saffron/30"><BedDouble size={48} aria-hidden="true" /></div>
        )}
        <Badge className="absolute right-3 top-3 bg-white/90 text-ink-soft shadow-soft backdrop-blur">
          <Users size={13} className="text-saffron" aria-hidden="true" /> {listing.capacity || 1} beds
        </Badge>
        {staff && hidden && <Badge className="absolute left-3 top-3 bg-ink/80 text-white">Hidden</Badge>}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <h3 className="font-display text-[19px] font-semibold leading-snug text-ink">{listing.name}</h3>
        {listing.description && <p className="line-clamp-3 text-[14px] leading-relaxed text-ink-muted">{listing.description}</p>}
        {amenities.length > 0 && (
          <ul className="flex flex-wrap gap-1.5">
            {amenities.map((a, i) => <li key={i}><Badge tone="saffron" size="sm">{a}</Badge></li>)}
          </ul>
        )}
        <div className="mt-auto grid gap-2 pt-3">
          <Button onClick={() => onBook(listing)} disabled={!canBook} className="w-full">Book now</Button>
          {staff && (
            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary" size="sm" onClick={() => staff.onEdit(listing)} aria-label={`Edit ${listing.name}`}>
                <Edit3 size={14} aria-hidden="true" /> Edit
              </Button>
              <Button variant="secondary" size="sm" onClick={() => staff.onToggle(listing)} aria-label={`${hidden ? 'Show' : 'Hide'} ${listing.name}`}>
                {hidden ? <><Eye size={14} aria-hidden="true" /> Show</> : <><EyeOff size={14} aria-hidden="true" /> Hide</>}
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}

export default ListingCard
