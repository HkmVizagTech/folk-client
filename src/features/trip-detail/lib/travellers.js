export const ID_TYPES = [
  { id: '', label: 'Select' },
  { id: 'aadhaar', label: 'Aadhaar' },
  { id: 'pan', label: 'PAN' },
  { id: 'passport', label: 'Passport' },
  { id: 'voter', label: 'Voter ID' },
  { id: 'driving', label: 'Driving licence' },
  { id: 'student', label: 'Student ID' },
  { id: 'other', label: 'Other' },
]

export const GENDERS = ['Male', 'Female']

// Most FOLK members are students, so the year is a short list: quicker on a phone.
export const YEARS = ['1st year', '2nd year', '3rd year', '4th year', '5th year', 'Postgraduate', 'Working', 'Other']

export const blankTraveller = () => ({ name: '', age: '', gender: '', idType: '', idNumber: '', college: '', course: '', year: '' })

export const buildRows = (registration, seats) =>
  Array.from({ length: seats }, (_, i) => ({ ...blankTraveller(), ...(registration?.travellers?.[i] || {}) }))

/** Everything a ticket needs, for every seat. */
export const detailsComplete = (registration) => {
  const seats = parseInt(registration?.seats, 10) || 0
  const list = registration?.travellers || []
  if (!seats || list.length < seats) return false
  return list.slice(0, seats).every((t) => String(t?.name || '').trim() && Number(t?.age) > 0 && t?.gender)
}

export const serialiseTravellers = (rows) => rows.map((t) => ({
  name: String(t.name || '').trim().slice(0, 80),
  age: Number(t.age) || null,
  gender: t.gender || '',
  idType: t.idType || '',
  idNumber: String(t.idNumber || '').trim().slice(0, 40),
  college: String(t.college || '').trim().slice(0, 120),
  course: String(t.course || '').trim().slice(0, 80),
  year: t.year || '',
}))
