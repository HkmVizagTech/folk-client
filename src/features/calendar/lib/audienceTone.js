import { Building2, Globe, HeartHandshake } from 'lucide-react'

// One colour per audience, used by the dots under each day, the legend and the chips.
export const TONE = {
  all: { label: 'Public', dot: 'bg-saffron', chip: 'saffron', icon: Globe },
  mine: { label: "A guide's members", dot: 'bg-navy-500', chip: 'maroon', icon: HeartHandshake },
  residents: { label: 'Residency', dot: 'bg-marigold-dark', chip: 'gold', icon: Building2 },
}

export const toneOf = (id) => TONE[id] || TONE.all
