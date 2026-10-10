// The same `level` values Profile.jsx offers. Both pages write the one
// users.level column, so devotees levelled in either place stay comparable.
export const LEVELS = ['FOLK New', 'FOLK Enhanced', 'Pre-Initiated', 'Initiated']

// Rows levelled before the switch still hold '1'-'5'; "Level 3" reads right for those.
export const levelLabel = (level) => {
  const value = String(level ?? '').trim()
  if (!value) return LEVELS[0]
  return /^\d+$/.test(value) ? `Level ${value}` : value
}

export const ROLE_FILTERS = [
  { value: 'All', label: 'All roles' },
  { value: 'devotee', label: 'Devotee' },
  { value: 'folks_head', label: 'Folks Head' },
  { value: 'admin', label: 'Admin' },
  { value: 'volunteer', label: 'Volunteer' },
]

export const roleLabel = (role) => (role === 'folks_head' ? 'Folks Head' : role ? role.charAt(0).toUpperCase() + role.slice(1) : 'Devotee')

export const ROLE_TONE = { admin: 'maroon', folks_head: 'gold' }

export const EMPTY_FORM = { name: '', phone: '', address: '', role: 'devotee', level: LEVELS[0] }

export const formFromDevotee = (d) => ({
  name: d.name || '',
  phone: d.phone || '',
  address: d.address || '',
  role: d.role || 'devotee',
  level: d.level || LEVELS[0],
})
