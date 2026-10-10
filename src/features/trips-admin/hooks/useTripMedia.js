import { GALLERY_MAX } from '../lib/constants'

/* The file never reaches our API: uploadImage() compresses it, gets a
 * presigned URL and PUTs the bytes to R2. Only the returned URL enters the form. */
export const useTripMedia = ({ form, setForm, setField, up }) => {
  const uploadCover = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const previous = form.coverImage
    const url = await up.runUpload('cover', file, { folder: 'covers', maxWidth: 1600, quality: 0.82 })
    if (!url) return
    setField('coverImage', url)
    // The old image is only released once its replacement is safely stored.
    if (previous && previous !== url) up.discardImage(previous)
  }

  const removeCover = () => {
    const previous = form.coverImage
    setField('coverImage', '')
    up.setError('cover', '')
    up.discardImage(previous)
  }

  const uploadGallery = async (e) => {
    const files = Array.from(e.target.files || [])
    e.target.value = ''
    if (files.length === 0) return
    const room = GALLERY_MAX - (form.gallery || []).length
    if (room <= 0) {
      up.setError('gallery', `The gallery already holds the maximum of ${GALLERY_MAX} images`)
      return
    }
    const picked = files.slice(0, room)
    up.setError('gallery', '')
    // One at a time so a slow connection shows honest progress.
    for (let i = 0; i < picked.length; i += 1) {
      up.setGalleryQueue({ index: i + 1, total: picked.length })
      const url = await up.runUpload('gallery', picked[i], { folder: 'gallery', maxWidth: 1200, quality: 0.8 })
      if (!url) { up.setGalleryQueue(null); return }
      setForm((prev) => ({ ...prev, gallery: [...(prev.gallery || []), url].slice(0, GALLERY_MAX) }))
    }
    up.setGalleryQueue(null)
    if (files.length > room) {
      up.setError('gallery', `Only ${room} more image${room === 1 ? '' : 's'} could be added (max ${GALLERY_MAX})`)
    }
  }

  const removeGalleryImage = (index) => {
    const previous = (form.gallery || [])[index]
    setForm((prev) => ({ ...prev, gallery: (prev.gallery || []).filter((_, i) => i !== index) }))
    up.setError('gallery', '')
    up.discardImage(previous)
  }

  return { uploadCover, removeCover, uploadGallery, removeGalleryImage }
}
