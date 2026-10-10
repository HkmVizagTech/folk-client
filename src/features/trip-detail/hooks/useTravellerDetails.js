import { useEffect, useMemo, useState } from 'react'
import { doc, serverTimestamp, updateDoc } from '../../../lib/pgstore'
import { db } from '../../../lib/firebase'
import { buildRows, detailsComplete, serialiseTravellers } from '../lib/travellers'

/** Editable traveller rows, emergency contact and boarding point for one registration. */
export const useTravellerDetails = (registration) => {
  const seats = parseInt(registration?.seats, 10) || 1
  const [rows, setRows] = useState(() => buildRows(registration, seats))
  const [emergency, setEmergency] = useState(registration?.emergencyContact || '')
  const [pickup, setPickup] = useState(registration?.pickup || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setRows(buildRows(registration, seats))
    setEmergency(registration?.emergencyContact || '')
    setPickup(registration?.pickup || '')
  }, [registration?.id, registration?.travellers, registration?.emergencyContact, registration?.pickup, seats]) // eslint-disable-line react-hooks/exhaustive-deps

  const done = useMemo(() => detailsComplete(registration), [registration])
  const setRow = (i, key, value) => setRows((r) => r.map((row, idx) => (idx === i ? { ...row, [key]: value } : row)))

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await updateDoc(doc(db, 'trip_registrations', registration.id), {
        travellers: serialiseTravellers(rows),
        emergencyContact: String(emergency || '').trim().slice(0, 120),
        pickup: String(pickup || '').trim().slice(0, 120),
        updatedAt: serverTimestamp(),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 4000)
    } catch (err) {
      console.error('Saving traveller details failed:', err)
      setError(err.code === 'permission-denied' ? 'Those details could not be saved against this booking.' : 'Could not save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return { rows, setRow, emergency, setEmergency, pickup, setPickup, saving, saved, error, done, save }
}
