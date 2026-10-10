import { db } from '../../../lib/firebase'
// Postgres-backed shim, NOT the real Firebase SDK (see useFirestore).
import { collection, query, where, getDocs, serverTimestamp, doc, runTransaction } from '../../../lib/pgstore'
import { devoteeName } from './events'

const firstDoc = async (collectionName, field, value) => {
  const snap = await getDocs(query(collection(db, collectionName), where(field, '==', value)))
  return snap.empty ? null : snap.docs[0]
}

/**
 * Turns a typed code into a devotee. Registration tokens are generated
 * uppercase; a devotee's qrToken is mixed case (it embeds the document id), so
 * each lookup uses the casing that matches what was written.
 * Resolves to { devotee, notice, registeredFor } or null when nothing matches.
 */
export const resolveAttendee = async (rawToken) => {
  const reg = await firstDoc('registrations', 'token', rawToken.toUpperCase())
  if (reg) {
    const r = reg.data()
    return { devotee: { id: r.userId, name: r.userName }, notice: null, registeredFor: { eventId: r.eventId, title: r.eventTitle } }
  }

  // Profiles keep the name in `name`; fullName/displayName are only fallbacks.
  const byToken = await firstDoc('users', 'qrToken', rawToken)
  if (byToken) return { devotee: { id: byToken.id, name: devoteeName(byToken.data()) }, notice: 'Verified via Universal Vaikuntha ID', registeredFor: null }

  if (rawToken.length >= 8) {
    const byUid = await firstDoc('users', 'uid', rawToken)
    if (byUid) return { devotee: { id: byUid.id, name: devoteeName(byUid.data()) }, notice: 'Verified via System UID', registeredFor: null }
  }
  return null
}

const MODES = {
  attendance: {
    collection: 'attendance',
    failure: 'Failed to record attendance.',
    duplicate: 'Already checked in for this event!',
    success: (title) => `Entry Allowed for ${title}`,
    record: ({ devotee, eventId, title }) => ({
      userId: devotee.id,
      name: devotee.name,
      eventId,
      session: title,
      status: 'On-time',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      createdAt: serverTimestamp(),
    }),
  },
  prasadam: {
    collection: 'prasadam_logs',
    failure: 'Failed to record prasadam.',
    duplicate: 'Prasadam already received!',
    success: (title) => `Prasadam Served for ${title}`,
    record: ({ devotee, eventId, title }) => ({
      userId: devotee.id,
      name: devotee.name,
      eventId,
      eventTitle: title,
      received: true,
      timestamp: serverTimestamp(),
    }),
  },
}

export const successMessage = (mode, title) => MODES[mode].success(title)
export const duplicateMessage = (mode) => MODES[mode].duplicate

/**
 * Writes the entry under a deterministic id inside a transaction, so two
 * near-simultaneous scans (two stations, a retry, a double-tap) can never
 * create a duplicate. Resolves to true when it was already recorded.
 */
export const recordEntry = async ({ mode, eventId, title, devotee }) => {
  const m = MODES[mode]
  const ref = doc(db, m.collection, `${eventId}_${devotee.id}`)
  let duplicate = false
  try {
    await runTransaction(db, async (tx) => {
      if ((await tx.get(ref)).exists()) {
        duplicate = true
        return
      }
      tx.set(ref, m.record({ devotee, eventId, title }))
    })
  } catch (txError) {
    throw new Error(txError.message || m.failure)
  }
  return duplicate
}

export const findApprovedStay = async (userId) => {
  try {
    const snap = await getDocs(query(collection(db, 'accommodation_requests'), where('userId', '==', userId), where('status', '==', 'approved')))
    return snap.empty ? null : snap.docs[0].data()
  } catch (e) {
    console.error('Acc fetch error', e)
    return null
  }
}
