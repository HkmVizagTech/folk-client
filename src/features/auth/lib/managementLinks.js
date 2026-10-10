import { Calendar, Building2, Home, Users, CheckSquare, Heart } from 'lucide-react'

export const MANAGEMENT_LINKS = [
  { id: 'events', label: 'Events', desc: 'Create / manage community events', icon: Calendar, tone: 'bg-saffron-50 text-saffron-dark' },
  { id: 'hostels', label: 'Hostels', desc: 'Manage youth hostel listings & bookings', icon: Building2, tone: 'bg-navy-50 text-navy' },
  { id: 'accommodation', label: 'Accommodation', desc: 'Approve / reject accommodation requests', icon: Home, tone: 'bg-marigold/15 text-marigold-dark' },
  { id: 'devotees', label: 'Devotees', desc: 'Manage members, roles & levels', icon: Users, tone: 'bg-purple-100 text-purple-700' },
  { id: 'attendance', label: 'Attendance', desc: 'Scan QR & record attendance', icon: CheckSquare, tone: 'bg-green-100 text-green-700' },
  { id: 'seva', label: 'Seva', desc: 'Create sevas & manage volunteers', icon: Heart, tone: 'bg-pink-100 text-pink-600' },
]
