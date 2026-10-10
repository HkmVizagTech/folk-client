import { Clock, Users, Home, CheckCircle2 } from 'lucide-react'

export const STAY_TYPES = ['Individual Guest House', 'Dormitory Bed', 'Family Apartment', 'Volunteer Quarters']

export const emptyRequest = () => ({
  type: STAY_TYPES[0],
  guestCount: 1,
  arrivalDate: '',
  departureDate: '',
  requirements: '',
})

export const STATUS_TONE = {
  approved: 'success',
  rejected: 'danger',
  recommended: 'maroon',
  pending: 'saffron',
}

export const normalize = (status) => (status || '').toLowerCase()

export const LIFECYCLE = [
  { label: 'Submitted', done: true, icon: Clock },
  { label: 'Reviewing', done: false, icon: Users },
  { label: 'Assigned', done: false, icon: Home },
  { label: 'Check-in', done: false, icon: CheckCircle2 },
]

/** Which moves this role may make on a request in this status. */
export const actionsFor = (role, status) => {
  const s = normalize(status)
  if (role === 'admin' && ['pending', 'recommended'].includes(s)) {
    return [{ status: 'approved', label: 'Approve', variant: 'primary' }, { status: 'rejected', label: 'Reject', variant: 'secondary' }]
  }
  if (role === 'folks_head' && s === 'pending') return [{ status: 'recommended', label: 'Recommend', variant: 'soft' }]
  return []
}
