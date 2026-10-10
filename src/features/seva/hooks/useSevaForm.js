import { useState } from 'react'
import { collection, doc, setDoc, addDoc, serverTimestamp } from '../../../lib/pgstore'
import { db } from '../../../lib/firebase'
import { EMPTY_SEVA, parseSlots } from '../lib/seva'

/** Create-seva form for staff. */
export const useSevaForm = (user) => {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_SEVA)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const change = (name, value) => setForm((f) => ({ ...f, [name]: value }))
  const show = () => { setError(''); setOpen(true) }

  const submit = async (e) => {
    e.preventDefault()
    const maxVolunteers = parseSlots(form.maxVolunteers)
    if (!maxVolunteers) { setError('Enter how many volunteers are needed (at least 1).'); return }
    setSaving(true)
    setError('')
    try {
      await setDoc(doc(collection(db, 'sevas')), {
        ...form, maxVolunteers, isRecurring: !!form.isRecurring, countRegistered: 0, createdBy: user.uid, createdAt: serverTimestamp(),
      })
      // The seva is saved; a failed announcement must not read as a failed create.
      try {
        await addDoc(collection(db, 'notifications'), {
          type: 'new_seva',
          title: `New Seva: ${form.title}`,
          message: `A new ${form.sevaType} seva has been opened at ${form.location} for ${form.date}.`,
          link: '/sevas',
          createdAt: serverTimestamp(),
          createdBy: user.uid,
        })
      } catch (notifyError) {
        console.error('Seva created, but the announcement could not be posted:', notifyError)
      }
      setOpen(false)
      setForm(EMPTY_SEVA)
    } catch (err) {
      console.error('Create seva error:', err)
      setError(`Failed to create seva: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  return { open, show, close: () => setOpen(false), form, change, submit, saving, error }
}
