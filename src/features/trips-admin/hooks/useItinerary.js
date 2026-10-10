import { swapItems as swap, toInt } from '../lib/format'

export const useItinerary = (setForm) => {
  const add = () => setForm((prev) => ({
    ...prev,
    itinerary: [...(prev.itinerary || []), { day: (prev.itinerary?.length || 0) + 1, title: '', details: '' }],
  }))

  const update = (index, key, value) => setForm((prev) => {
    const next = [...(prev.itinerary || [])]
    next[index] = { ...next[index], [key]: key === 'day' ? toInt(value) : value }
    return { ...prev, itinerary: next }
  })

  const remove = (index) => setForm((prev) => ({
    ...prev, itinerary: (prev.itinerary || []).filter((_, i) => i !== index),
  }))

  const move = (index, delta) => setForm((prev) => {
    const next = swap(prev.itinerary || [], index, delta)
    return next === prev.itinerary ? prev : { ...prev, itinerary: next }
  })

  return { add, update, remove, move }
}
