import { useCallback, useEffect, useMemo } from 'react'
import { auth, db } from '../../../lib/firebase'
// Postgres-backed shim, NOT the real Firebase SDK (see useFirestore).
import { collection, addDoc, updateDoc, doc, serverTimestamp } from '../../../lib/pgstore'
import { useFirestore } from '../../../hooks/useFirestore'
import { useOptimisticMutation } from '../../../hooks/useOptimistic'
import { useOptimisticPatches } from './useOptimisticPatches'
import { listingPayload } from '../lib/hostels'

export const useHostelListings = (isStaff) => {
  const { data, loading } = useFirestore('hostel_listings')
  const { patches, apply, clear, prune } = useOptimisticPatches()
  const { run } = useOptimisticMutation()

  useEffect(() => {
    const byId = new Map((data || []).map((l) => [l.id, l.active]))
    prune((id, patch) => byId.get(id) !== patch.active)
  }, [data, prune])

  const listings = useMemo(
    () => (data || []).map((l) => (patches[l.id] ? { ...l, ...patches[l.id] } : l)),
    [data, patches],
  )

  // Staff keep seeing hidden listings (badged "Hidden"); members don't. Hiding
  // it from staff too made "Show" unreachable.
  const visible = useMemo(
    () => (isStaff ? listings : listings.filter((l) => l.active !== false)),
    [listings, isStaff],
  )

  const toggleActive = useCallback((listing) => {
    const active = listing.active === false
    return run({
      optimistic: () => apply(listing.id, { active }),
      rollback: () => clear(listing.id),
      commit: () => updateDoc(doc(db, 'hostel_listings', listing.id), { active }),
      onError: (error) => {
        console.error('Error toggling listing:', error)
        alert('Failed to update listing: ' + error.message)
      },
    })
  }, [run, apply, clear])

  /** Creates (no id) or updates a listing. Resolves true on success. */
  const save = useCallback(async (form, id) => {
    try {
      if (id) {
        await updateDoc(doc(db, 'hostel_listings', id), listingPayload(form))
      } else {
        await addDoc(collection(db, 'hostel_listings'), {
          ...listingPayload(form),
          active: true,
          createdAt: serverTimestamp(),
          createdBy: auth.currentUser?.uid || 'system',
        })
      }
      return true
    } catch (error) {
      console.error('Error saving hostel listing:', error)
      alert('Failed to save listing: ' + error.message)
      return false
    }
  }, [])

  return { listings: visible, loading: loading && listings.length === 0, toggleActive, save }
}
