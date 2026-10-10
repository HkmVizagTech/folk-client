export const firstName = (u) => String(u?.name || u?.displayName || '').trim().split(/\s+/)[0] || 'friend'

export const waLink = (phone) => {
  const d = String(phone || '').replace(/\D/g, '')
  const n = d.length === 10 ? `91${d}` : d
  return n ? `https://wa.me/${n}` : ''
}

export const telLink = (phone) => `tel:${String(phone || '').replace(/\s/g, '')}`

export const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`

const IST = 'Asia/Kolkata'
export const dayOf = (d) => d.toLocaleDateString('en-IN', { day: '2-digit', timeZone: IST })
export const monthOf = (d) => d.toLocaleDateString('en-IN', { month: 'short', timeZone: IST })
