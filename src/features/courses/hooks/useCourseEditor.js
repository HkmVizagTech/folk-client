import { useState } from 'react'
import { collection, addDoc, doc, updateDoc, serverTimestamp } from '../../../lib/pgstore'
import { db } from '../../../lib/firebase'
import { EMPTY_COURSE, courseToForm, validateCourse } from '../lib/courses'

/** Create / edit form state for staff. `editing` is a course, 'new' or null. */
export const useCourseEditor = (user) => {
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_COURSE)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const open = (course) => { setError(''); setForm(course === 'new' ? EMPTY_COURSE : courseToForm(course)); setEditing(course) }
  const close = () => setEditing(null)
  const change = (name, value) => setForm((f) => ({ ...f, [name]: value }))

  const save = async (e) => {
    e.preventDefault()
    const { data, error: invalid } = validateCourse(form)
    if (invalid) { setError(invalid); return }
    setSaving(true)
    try {
      const stamped = { ...data, updatedAt: serverTimestamp() }
      if (editing === 'new') await addDoc(collection(db, 'courses'), { ...stamped, createdAt: serverTimestamp(), createdBy: user.uid })
      else await updateDoc(doc(db, 'courses', editing.id), stamped)
      close()
    } catch (err) {
      console.error('Course save failed:', err)
      setError('Could not save the course.')
    } finally {
      setSaving(false)
    }
  }

  return { editing, form, change, open, close, save, saving, error }
}
