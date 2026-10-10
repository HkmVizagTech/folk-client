import { useCallback, useMemo, useState } from 'react'
import { doc, getDoc, setDoc, where, serverTimestamp } from '../../../lib/pgstore'
import { db } from '../../../lib/firebase'
import { useFirestore } from '../../../hooks/useFirestore'
import { useOptimisticMutation } from '../../../hooks/useOptimistic'

/** The member's enrolments plus an optimistic `enroll` that rolls back if the write fails. */
export const useMyEnrollments = (user) => {
  const q = useMemo(() => [where('userId', '==', user?.uid || '__none__')], [user?.uid])
  const { data } = useFirestore('enrollments', q)
  const [optimistic, setOptimistic] = useState(() => new Set())
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const { run } = useOptimisticMutation()

  const enrolledBy = useMemo(() => {
    const map = new Map(data.map((e) => [e.courseId, e]))
    optimistic.forEach((id) => { if (!map.has(id)) map.set(id, { courseId: id, status: 'enrolled', sessionsAttended: 0 }) })
    return map
  }, [data, optimistic])

  const mark = (id, on) => setOptimistic((s) => { const n = new Set(s); if (on) n.add(id); else n.delete(id); return n })

  const enroll = useCallback(async (c) => {
    setBusy(c.id)
    setError('')
    await run({
      optimistic: () => mark(c.id, true),
      commit: async () => {
        // Deterministic id: enrolling twice is a no-op. setDoc overwrites, so bail out
        // if the enrolment exists rather than wiping its progress.
        const ref = doc(db, 'enrollments', `${c.id}_${user.uid}`)
        if ((await getDoc(ref)).exists()) return
        await setDoc(ref, {
          courseId: c.id, courseTitle: c.title, userId: user.uid,
          userName: user.name || user.displayName || 'Member', userPhone: user.phone || '',
          status: 'enrolled', sessionsAttended: 0, createdAt: serverTimestamp(),
        })
      },
      rollback: () => mark(c.id, false),
      onError: (e) => { console.error('Enroll failed:', e); setError('Could not enroll. Please try again.') },
    })
    setBusy('')
  }, [run, user])

  return { enrolledBy, enroll, busy, error, clearError: () => setError('') }
}
