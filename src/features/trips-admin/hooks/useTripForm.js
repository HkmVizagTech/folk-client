import { useCallback, useMemo, useState } from 'react'
import { collection, addDoc, updateDoc, doc, serverTimestamp } from '../../../lib/pgstore'
import { auth, db } from '../../../lib/firebase'
import { EMPTY_FORM } from '../lib/constants'
import { slugify } from '../lib/format'
import {
  buildPayload, duplicateForm, formFromTrip, sectionHasErrors, validateTrip,
} from '../lib/tripForm'
import { MODAL_SECTIONS } from '../lib/sections'
import { useImageUploads } from './useImageUploads'
import { useTripMedia } from './useTripMedia'
import { useItinerary } from './useItinerary'
import { useLocations } from './useLocations'

/** Create / edit / duplicate editor state, validation and the save write. */
export const useTripForm = ({ trips, uid }) => {
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [slugTouched, setSlugTouched] = useState(false)
  const [section, setSection] = useState('basics')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [showErrors, setShowErrors] = useState(false)

  const up = useImageUploads({ uid, trips, editingId })
  const setField = useCallback((key, value) => setForm((prev) => ({ ...prev, [key]: value })), [])
  const media = useTripMedia({ form, setForm, setField, up })
  const itinerary = useItinerary(setForm)
  const locations = useLocations({ form, setForm, up })

  const begin = ({ id, values, slugTouched: touched }) => {
    setEditingId(id)
    setForm(values)
    setSlugTouched(touched)
    setSection('basics')
    setSaveError('')
    up.reset()
    locations.setOpenId(null)
    setShowErrors(false)
    setOpen(true)
  }

  const openCreate = () => begin({ id: null, values: EMPTY_FORM, slugTouched: false })
  const openEdit = (trip) => begin({ id: trip.id, values: formFromTrip(trip), slugTouched: true })
  const openDuplicate = (trip) => begin({ id: null, values: duplicateForm(trip, trips), slugTouched: true })

  const close = () => {
    if (saving || up.uploadsBusy) return
    setOpen(false)
  }

  const changeTitle = (value) => setForm((prev) => ({
    ...prev, title: value, slug: slugTouched ? prev.slug : slugify(value),
  }))

  const changeSlug = (value) => { setSlugTouched(true); setField('slug', value) }
  const regenerateSlug = () => { setSlugTouched(true); setField('slug', slugify(form.title)) }

  const errors = useMemo(() => validateTrip(form, trips, editingId), [form, trips, editingId])
  const sectionErrors = useMemo(() => sectionHasErrors(errors), [errors])
  const hasErrors = Object.keys(errors).length > 0

  const submit = async (e) => {
    e.preventDefault()
    setShowErrors(true)
    setSaveError('')
    // Saving mid-upload would store a trip missing the picture still on its way.
    if (up.uploadsBusy) {
      setSaveError('An image is still uploading — give it a moment, then save.')
      return
    }
    if (hasErrors) {
      const firstBad = MODAL_SECTIONS.find((s) => sectionErrors[s.key])
      if (firstBad) setSection(firstBad.key)
      return
    }
    setSaving(true)
    try {
      const payload = buildPayload(form)
      if (editingId) {
        await updateDoc(doc(db, 'trips', editingId), { ...payload, updatedAt: serverTimestamp() })
      } else {
        await addDoc(collection(db, 'trips'), {
          ...payload,
          createdAt: serverTimestamp(),
          createdBy: auth.currentUser?.uid || 'system',
          updatedAt: serverTimestamp(),
        })
      }
      setOpen(false)
      setForm(EMPTY_FORM)
      setEditingId(null)
    } catch (err) {
      console.error('Error saving trip:', err)
      setSaveError(err?.message || 'Failed to save this trip')
    } finally {
      setSaving(false)
    }
  }

  return {
    open, editingId, form, setField, section, setSection, saving, saveError, showErrors,
    errors, sectionErrors, hasErrors, up, media, itinerary, locations,
    openCreate, openEdit, openDuplicate, close, submit,
    changeTitle, changeSlug, regenerateSlug,
  }
}
