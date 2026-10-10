import { db } from '../../../lib/firebase'
// Postgres-backed shim, NOT the real Firebase SDK: `db` is only a marker
// object now, so firebase/firestore helpers throw on it.
import { collection, doc, getDoc, getDocs, query, where, orderBy, limit } from '../../../lib/pgstore'
import { yesterdayIST } from '../../../lib/dates'
import { streakState } from './streak'

const time = (v) => v?.toDate?.() || new Date(v || 0)

// Queried by userId only and sorted here, to bypass composite-index requirements.
const recent = async (name, user, field, n = 5) => {
  try {
    const snap = await getDocs(query(collection(db, name), where('userId', '==', user.uid)))
    return snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => time(b[field]) - time(a[field])).slice(0, n)
  } catch (e) {
    console.error(`Error fetching ${name}:`, e.message)
    return []
  }
}

/** Loads profile stats, the last 7 logs, attendance and prasadam. Throws on a failed core read. */
export const fetchSadhana = async (user, today) => {
  const uData = (await getDoc(doc(db, 'users', user.uid))).data() || {}
  const profile = {
    name: uData.name || uData.fullName || user.displayName || 'Devotee',
    streak: streakState(uData, today, yesterdayIST()).streak,
    score: uData.score || 0,
    longestStreak: uData.longestStreak || 0,
    totalLogs: 0,
  }

  try {
    const logsSnap = await getDocs(query(collection(db, 'sadhana_logs'), where('userId', '==', user.uid), orderBy('date', 'desc'), limit(7)))
    const logs = logsSnap.docs.map((d) => d.data())
    profile.totalLogs = logs.length
    const [attendance, prasadam] = await Promise.all([recent('attendance', user, 'createdAt'), recent('prasadam_logs', user, 'timestamp')])
    return { indexBuilding: false, data: { profile, logs: logs.reverse(), attendance, prasadam } }
  } catch (e) {
    if (!(e.message?.includes('index') || e.code === 'failed-precondition')) throw e
    const snap = await getDocs(query(collection(db, 'sadhana_logs'), where('userId', '==', user.uid), limit(7)))
    const logs = snap.docs.map((d) => d.data()).sort((a, b) => a.date.localeCompare(b.date))
    profile.totalLogs = logs.length
    return { indexBuilding: true, data: { profile, logs, attendance: [], prasadam: [] } }
  }
}
