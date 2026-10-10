import { useMemo, useState } from 'react'
import { doc, updateDoc, where, serverTimestamp, increment } from '../../../lib/pgstore'
import { db } from '../../../lib/firebase'
import { useFirestore } from '../../../hooks/useFirestore'
import { useOptimisticMutation } from '../../../hooks/useOptimistic'

/** One course's enrolments with an optimistic +/- on sessions attended. */
export const useRoster = (course) => {
  const q = useMemo(() => [where('courseId', '==', course.id)], [course.id])
  const { data, loading } = useFirestore('enrollments', q)
  const [counts, setCounts] = useState({})
  const [error, setError] = useState('')
  const { run } = useOptimisticMutation()
  const total = course.sessions || 0

  const rows = useMemo(() => data
    .map((e) => ({ ...e, attended: counts[e.id] ?? (e.sessionsAttended || 0) }))
    .sort((a, b) => String(a.userName).localeCompare(String(b.userName))), [data, counts])

  const bump = async (row, delta) => {
    const next = Math.max(0, Math.min(total, row.attended + delta))
    if (next === row.attended) return
    setError('')
    await run({
      optimistic: () => setCounts((c) => ({ ...c, [row.id]: next })),
      commit: () => updateDoc(doc(db, 'enrollments', row.id), {
        sessionsAttended: increment(next - row.attended),
        status: next >= total ? 'completed' : 'enrolled',
        updatedAt: serverTimestamp(),
      }),
      rollback: () => setCounts((c) => ({ ...c, [row.id]: row.attended })),
      onError: (e) => { console.error(e); setError('Could not update. Please try again.') },
    })
  }

  return { rows, loading, bump, error, total }
}
