import { useState } from 'react'
import { newLocationId } from '../lib/constants'
import { swapItems as swap } from '../lib/format'

/* The places a yatra visits. Rows carry a generated id so React keys and
 * reordering survive every edit; one row is open at a time. */
export const useLocations = ({ form, setForm, up }) => {
  const [openId, setOpenId] = useState(null)

  const add = () => {
    const row = { id: newLocationId(), name: '', description: '', image: '' }
    setForm((prev) => ({ ...prev, locations: [...(prev.locations || []), row] }))
    setOpenId(row.id)
  }

  const update = (index, key, value) => setForm((prev) => {
    const next = [...(prev.locations || [])]
    if (!next[index]) return prev
    next[index] = { ...next[index], [key]: value }
    return { ...prev, locations: next }
  })

  const remove = (index) => {
    const row = (form.locations || [])[index]
    setForm((prev) => ({ ...prev, locations: (prev.locations || []).filter((_, i) => i !== index) }))
    if (row?.id) {
      setOpenId((cur) => (cur === row.id ? null : cur))
      up.clearError(`loc:${row.id}`)
    }
    up.discardImage(row?.image)
  }

  const move = (index, delta) => setForm((prev) => {
    const next = swap(prev.locations || [], index, delta)
    return next === prev.locations ? prev : { ...prev, locations: next }
  })

  // Rows are found by id, not index: they may be reordered mid-upload.
  const setRowImage = (id, image) => setForm((prev) => ({
    ...prev,
    locations: (prev.locations || []).map((l) => (l.id === id ? { ...l, image } : l)),
  }))

  const uploadImage = async (index, e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const row = (form.locations || [])[index]
    if (!row) return
    const previous = row.image
    const url = await up.runUpload(`loc:${row.id}`, file, { folder: 'locations', maxWidth: 1000, quality: 0.8 })
    if (!url) return
    setRowImage(row.id, url)
    if (previous && previous !== url) up.discardImage(previous)
  }

  const removeImage = (index) => {
    const row = (form.locations || [])[index]
    if (!row) return
    setRowImage(row.id, '')
    up.setError(`loc:${row.id}`, '')
    up.discardImage(row.image)
  }

  return { openId, setOpenId, add, update, remove, move, uploadImage, removeImage }
}
