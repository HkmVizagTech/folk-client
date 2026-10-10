import { CheckCircle2, XCircle, Ban, Clock } from 'lucide-react'

export const emptyListing = { name: '', description: '', capacity: 1, amenities: '', img: '' }
export const emptyBooking = { checkIn: '', checkOut: '', guestCount: 1, notes: '' }

export const normalize = (status) => (status || '').toLowerCase()

export const STATUS = {
  approved: { tone: 'success', icon: CheckCircle2 },
  rejected: { tone: 'danger', icon: XCircle },
  cancelled: { tone: 'neutral', icon: Ban },
  pending: { tone: 'saffron', icon: Clock },
}
export const statusMeta = (status) => STATUS[normalize(status)] || STATUS.pending

export const listingToForm = (listing) => ({
  name: listing.name || '',
  description: listing.description || '',
  capacity: listing.capacity || 1,
  amenities: Array.isArray(listing.amenities) ? listing.amenities.join(', ') : '',
  img: listing.img || '',
})

export const listingPayload = (form) => ({
  name: form.name,
  description: form.description,
  capacity: parseInt(form.capacity, 10) || 1,
  amenities: form.amenities.split(',').map((a) => a.trim()).filter(Boolean),
  img: form.img,
})

export const guestLabel = (count) => `${count} guest${count > 1 ? 's' : ''}`

/** Downscales a chosen photo so the listing document stays small. */
export const readListingImage = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader()
  reader.onerror = () => reject(new Error('Could not read that file.'))
  reader.onload = (ev) => {
    const img = new Image()
    img.onerror = () => reject(new Error('That image could not be opened.'))
    img.onload = () => {
      const scale = Math.min(1, 800 / img.width)
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL('image/jpeg', 0.7))
    }
    img.src = ev.target.result
  }
  reader.readAsDataURL(file)
})
