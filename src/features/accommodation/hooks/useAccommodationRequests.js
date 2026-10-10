import { useCallback, useEffect, useMemo, useState } from 'react'
import { callApi } from '../../../lib/api'
// Postgres-backed shim, NOT the real Firebase SDK (see useFirestore).
import { where, orderBy } from '../../../lib/pgstore'
import { useFirestore } from '../../../hooks/useFirestore'
import { useOptimisticMutation } from '../../../hooks/useOptimistic'
import { useOptimisticPatches } from './useOptimisticPatches'

const STAFF = ['admin', 'folks_head']

/** Requests visible to this user, with status changes applied optimistically. */
export const useAccommodationRequests = (user) => {
  const query = useMemo(() => (
    STAFF.includes(user?.role)
      ? [orderBy('createdAt', 'desc')]
      : [where('userId', '==', user?.uid || ''), orderBy('createdAt', 'desc')]
  ), [user?.uid, user?.role])

  const { data, loading } = useFirestore('accommodation_requests', query)
  const { patches, apply, clear, prune } = useOptimisticPatches()
  const { run } = useOptimisticMutation()
  const [actingId, setActingId] = useState(null)

  useEffect(() => {
    const byId = new Map((data || []).map((r) => [r.id, r.status]))
    prune((id, patch) => byId.get(id) !== patch.status)
  }, [data, prune])

  const requests = useMemo(
    () => (data || []).map((r) => (patches[r.id] ? { ...r, ...patches[r.id] } : r)),
    [data, patches],
  )

  // Routed through the backend (not a direct write) so the "folks_head can only
  // recommend, admin can approve/reject" rule is enforced and the WhatsApp
  // confirmation to the guest fires.
  const updateStatus = useCallback(async (request, status) => {
    setActingId(request.id)
    await run({
      optimistic: () => apply(request.id, { status }),
      rollback: () => clear(request.id),
      commit: () => callApi('updateAccommodationStatus', { reqId: request.id, status }),
      onError: (error) => {
        console.error('Error updating request:', error)
        alert(error.message || 'Failed to update this request.')
      },
    })
    setActingId(null)
  }, [run, apply, clear])

  return { requests, loading: loading && requests.length === 0, updateStatus, actingId }
}
