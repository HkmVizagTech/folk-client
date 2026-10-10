import { Calendar, FileText, Image as ImageIcon, Layers, ListOrdered, MapPin } from 'lucide-react'

export const MODAL_SECTIONS = [
  { key: 'basics', label: 'Basics', icon: FileText },
  { key: 'dates', label: 'Dates & Pricing', icon: Calendar },
  { key: 'media', label: 'Media', icon: ImageIcon },
  { key: 'itinerary', label: 'Itinerary', icon: ListOrdered },
  { key: 'locations', label: 'Locations', icon: MapPin },
  { key: 'inclusions', label: 'Inclusions', icon: Layers },
]
