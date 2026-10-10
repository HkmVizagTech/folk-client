import { useCallback, useEffect, useMemo, useState } from 'react'
import { doc, updateDoc, serverTimestamp } from '../../../lib/pgstore'
import { db } from '../../../lib/firebase'
import { useOptimisticMutation } from '../../../hooks/useOptimistic'

/*
 * Staff writes here touch ONLY status / staffNotes / updatedAt; firestore.rules
 * reject anything else on trip_registrations through this path. A status change
 * is applied optimistically over the live data and rolled back on failure.
 */
export const useRegistrationActions = (rawRegistrations) => {
  const { run } = useOptimisticMutation()
  const [patches, setPatches] = useState({})
  const [busyId, setBusyId] = useState(null)
  const [error, setError] = useState('')
  const [noteOpen, setNoteOpen] = useState(null)
  const [noteDrafts, setNoteDrafts] = useState({})

  useEffect(() => {
    setPatches((prev) => {
      const ids = Object.keys(prev)
      if (!ids.length) return prev
      const next = { ...prev }
      ids.forEach((id) => {
        const reg = (rawRegistrations || []).find((r) => r.id === id)
        if (!reg || reg.status === next[id]) delete next[id]
      })
      return Object.keys(next).length === ids.length ? prev : next
    })
  }, [rawRegistrations])

  const registrations = useMemo(
    () => (rawRegistrations || []).map((r) => (patches[r.id] ? { ...r, status: patches[r.id] } : r)),
    [rawRegistrations, patches],
  )

  const setStatus = useCallback(async (reg, status) => {
    setBusyId(reg.id)
    setError('')
    await run({
      optimistic: () => setPatches((prev) => ({ ...prev, [reg.id]: status })),
      commit: async () => {
        const note = noteDrafts[reg.id]
        await updateDoc(doc(db, 'trip_registrations', reg.id), {
          status,
          staffNotes: note === undefined ? (reg.staffNotes || '') : note,
          updatedAt: serverTimestamp(),
        })
        setNoteOpen(null)
      },
      rollback: () => setPatches((prev) => {
        const next = { ...prev }
        delete next[reg.id]
        return next
      }),
      onError: (err) => {
        console.error('Error updating registration:', err)
        setError(err?.message || 'Failed to update this registration')
      },
    })
    setBusyId(null)
  }, [run, noteDrafts])

  const saveNote = useCallback(async (reg) => {
    setBusyId(reg.id)
    setError('')
    try {
      await updateDoc(doc(db, 'trip_registrations', reg.id), {
        status: reg.status || 'pending',
        staffNotes: noteDrafts[reg.id] ?? (reg.staffNotes || ''),
        updatedAt: serverTimestamp(),
      })
      setNoteOpen(null)
    } catch (err) {
      console.error('Error saving staff note:', err)
      setError(err?.message || 'Failed to save the note')
    } finally {
      setBusyId(null)
    }
  }, [noteDrafts])

  const toggleNote = (reg, expanded) => {
    setNoteDrafts((prev) => ({ ...prev, [reg.id]: prev[reg.id] ?? (reg.staffNotes || '') }))
    setNoteOpen(expanded ? null : reg.id)
  }

  const editNote = (id, value) => setNoteDrafts((prev) => ({ ...prev, [id]: value }))

  return {
    registrations, busyId, error, noteOpen, noteDrafts,
    setStatus, saveNote, toggleNote, editNote, closeNote: () => setNoteOpen(null),
  }
}
