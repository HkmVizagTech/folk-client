import { Award, Briefcase, GraduationCap, Globe, Home, Info, Mail, Map, MapPin, Phone, User, Users } from 'lucide-react'

// Mirrors STAFF_MANAGED_FIELDS in server/db/policies.js. The users-update rule
// rejects the *whole* save when a member editing their own profile touches any
// of these, so they are stripped from the payload unless staff is saving.
export const STAFF_MANAGED_FIELDS = ['stage', 'level', 'guideId', 'guideName', 'guidePhone',
  'nextFollowUpDate', 'lastFollowUpAt', 'lastFollowUpNote']

export const LEVELS = ['FOLK New', 'FOLK Enhanced', 'Pre-Initiated', 'Initiated']

export const SECTIONS = [
  {
    id: 'personal', title: 'Personal details', icon: Info,
    fields: [
      { name: 'email', label: 'Email address', icon: Mail, type: 'email' },
      { name: 'phone', label: 'Mobile number', icon: Phone, type: 'tel' },
      { name: 'gender', label: 'Gender', icon: Users, options: ['Male', 'Female', 'Other'] },
      // Shown to everyone, editable only by staff: the server refuses a member's own write to `level`.
      { name: 'level', label: 'Level', icon: Award, options: LEVELS, staffOnly: true },
      { name: 'occupation', label: 'Occupation', icon: Briefcase },
      { name: 'qualification', label: 'Higher qualification', icon: GraduationCap },
    ],
  },
  {
    id: 'location', title: 'Location', icon: MapPin,
    fields: [
      { name: 'country', label: 'Country', icon: Globe },
      { name: 'state', label: 'State', icon: Map },
      { name: 'city', label: 'City', icon: Home },
      { name: 'center', label: 'Center', icon: Home },
    ],
  },
  {
    id: 'family', title: 'Family details', icon: Users,
    fields: [
      { name: 'fatherName', label: "Father's name", icon: User },
      { name: 'fatherPhone', label: "Father's mobile", icon: Phone, type: 'tel' },
      { name: 'spouseId', label: 'Spouse ID', icon: Users },
    ],
  },
]

export const formFromUser = (user) => ({
  name: user?.name || user?.displayName || '',
  email: user?.email || '',
  phone: user?.phone || '',
  gender: user?.gender || '',
  level: user?.level || '',
  occupation: user?.occupation || '',
  qualification: user?.qualification || '',
  city: user?.city || '',
  state: user?.state || '',
  country: user?.country || '',
  center: user?.center || '',
  fatherName: user?.fatherName || '',
  fatherPhone: user?.fatherPhone || '',
  spouseId: user?.spouseId || '',
  profileImage: user?.photo || user?.photoURL || '',
})

// `level` is assigned by staff, so counting it would park every devotee below 100%.
const COMPLETION_FIELDS = [['name', 'name'], ['phone', 'mobile'], ['gender', 'gender'], ['occupation', 'occupation'], ['qualification', 'qualification'], ['city', 'city'], ['country', 'country'], ['fatherName', "father's name"]]

export const completion = (form) => {
  const missing = COMPLETION_FIELDS.filter(([f]) => !String(form[f] || '').trim()).map(([, label]) => label)
  return { percent: Math.round(((COMPLETION_FIELDS.length - missing.length) / COMPLETION_FIELDS.length) * 100), missing }
}

export const formatDate = (value) => {
  const d = value?.toDate ? value.toDate() : new Date(value)
  return Number.isNaN(d?.getTime?.()) ? '—' : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export const paymentTone = (status) => {
  const s = String(status || '').toLowerCase()
  return s === 'completed' ? 'success' : s === 'failed' ? 'danger' : 'warning'
}
