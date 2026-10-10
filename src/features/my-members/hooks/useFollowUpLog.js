import { useCallback, useState } from 'react'
import { collection, doc, serverTimestamp, writeBatch } from '../../../lib/pgstore'
import { db } from '../../../lib/firebase'
import { useAuth } from '../../../hooks/useAuth'
import { useOptimisticMutation } from '../../../hooks/useOptimistic'
import { todayIST } from '../../../lib/dates'
import { addDays } from '../lib/memberMetrics'

const blankForm = { channel: 'Call', note: '', nextDate: '', stage: '' }

/**
 * Logging a follow-up is optimistic: the member is marked as followed up (and
 * snoozed off the attention list) the moment the guide saves, and the dialog
 * reopens with the error if the write is refused.
 * `pending` holds those not-yet-confirmed edits per member id; `settle(members)`
 * drops them once the server data has caught up.
 */
export const useFollowUpLog = () => {
  const { user: me } = useAuth()
  const today = todayIST()
  const [logFor, setLogFor] = useState(null)
  const [form, setForm] = useState(blankForm)
  const [error, setError] = useState('')
  const [pending, setPending] = useState({})
  const { run, pending: busy } = useOptimisticMutation()

  const open = (member) => {
    setError('')
    setForm({ ...blankForm, nextDate: addDays(today, 7), stage: member.stage })
    setLogFor(member)
  }
  const close = () => setLogFor(null)
  const update = (patch) => setForm((f) => ({ ...f, ...patch }))

  const settle = useCallback((members) => {
    setPending((current) => {
      const stale = Object.keys(current).filter((id) => {
        const real = members.find((m) => m.id === id)
        return real && real.nextFollowUpDate === current[id].nextFollowUpDate && real.lastFollowUpNote === current[id].lastFollowUpNote
      })
      if (!stale.length) return current
      const next = { ...current }
      stale.forEach((id) => delete next[id])
      return next
    })
  }, [])

  const save = async (e) => {
    e.preventDefault()
    const note = form.note.trim()
    if (note.length < 2) { setError('Add a short note about the conversation.'); return }
    const member = logFor
    const nextDate = form.nextDate || null
    const edit = {
      lastFollowUpAt: new Date(),
      lastFollowUpNote: note.slice(0, 200),
      nextFollowUpDate: nextDate,
      ...(form.stage && form.stage !== member.stage ? { stage: form.stage } : {}),
    }
    setError('')
    await run({
      optimistic: () => { setPending((p) => ({ ...p, [member.id]: edit })); setLogFor(null) },
      // The follow-up record and the member's summary fields are written together.
      commit: async () => {
        const batch = writeBatch(db)
        batch.set(doc(collection(db, 'followups')), {
          memberId: member.id,
          memberName: member.displayName,
          guideId: me.uid,
          guideName: me.name || me.displayName || 'Guide',
          channel: form.channel,
          note: note.slice(0, 1500),
          nextDate,
          createdAt: serverTimestamp(),
        })
        batch.update(doc(db, 'users', member.id), { ...edit, lastFollowUpAt: serverTimestamp(), updatedAt: serverTimestamp() })
        await batch.commit()
      },
      rollback: () => {
        setPending((p) => { const next = { ...p }; delete next[member.id]; return next })
        setLogFor(member)
      },
      onError: (err) => {
        console.error('Follow-up save failed:', err)
        setError(err.code === 'permission-denied' ? 'You can only log follow-ups for members, not staff.' : 'Could not save. Please try again.')
      },
    })
  }

  return { logFor, form, error, busy, open, close, update, save, pending, settle, today }
}
