export const SEVA_TYPES = [
  { value: 'cleaning', label: 'Cleaning' },
  { value: 'cooking', label: 'Cooking' },
  { value: 'organizing', label: 'Organizing' },
  { value: 'reception', label: 'Reception' },
  { value: 'distribution', label: 'Distribution' },
  { value: 'other', label: 'Other' },
]

export const EMPTY_SEVA = { title: '', description: '', sevaType: 'cleaning', date: '', time: '', location: '', maxVolunteers: 10, isRecurring: false }

export const isStaffRole = (user) => user?.role === 'admin' || user?.role === 'folks_head'

export const formatSevaDate = (date) => (date
  ? new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
  : 'Date TBD')

/** A blank or non-numeric slot count would be stored as null and open the seva already "full". */
export const parseSlots = (v) => {
  const n = parseInt(v, 10)
  return Number.isInteger(n) && n >= 1 ? n : null
}

export const statusTone = (status) => (status === 'completed' ? 'success' : status === 'cancelled' ? 'danger' : 'saffron')
