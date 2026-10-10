import { db } from '../../../lib/firebase'
import { doc, runTransaction, serverTimestamp } from '../../../lib/pgstore'
import { yesterdayIST } from '../../../lib/dates'
import { streakState } from './streak'

const BONUS_DAYS = [[3, 20], [7, 50], [30, 200]]

/** Creates today's log with the member's vow. Fails if one already exists. */
export const createTargetTx = (user, today, target) => {
  const logRef = doc(db, 'sadhana_logs', `${user.uid}_${today}`)
  const userRef = doc(db, 'users', user.uid)
  return runTransaction(db, async (tx) => {
    const uDoc = await tx.get(userRef)
    const logDoc = await tx.get(logRef)
    if (logDoc.exists()) throw new Error('Target already set for today.')
    tx.set(logRef, {
      userId: user.uid,
      date: today,
      target,
      roundsCompleted: 0,
      progressPercentage: 0,
      // Taking a vow for today does not end the chain the member walked in with.
      streak: streakState(uDoc.data() || {}, today, yesterdayIST()).streak,
      score: 0,
      status: 'locked',
      createdAt: serverTimestamp(),
    })
  })
}

/** Records today's rounds and moves streak, score and longest streak with them. */
export const logRoundsTx = (user, today, rounds) => {
  const logRef = doc(db, 'sadhana_logs', `${user.uid}_${today}`)
  const userRef = doc(db, 'users', user.uid)
  return runTransaction(db, async (tx) => {
    const uDoc = await tx.get(userRef)
    const lDoc = await tx.get(logRef)
    if (!lDoc.exists()) throw new Error('Please set your target first!')

    const uData = uDoc.data() || {}
    const old = lDoc.data()
    let target = old.target || 16
    // Admins must complete 16 rounds for streak
    if (uData.role === 'admin' || uData.role === 'folks_head') target = 16

    const yesterday = yesterdayIST()
    const carried = streakState(uData, today, yesterday)
    let streak = carried.streak
    let lastCompleted = carried.lastCompleted

    if (rounds >= target && !old.completed) {
      streak += 1
      lastCompleted = today
    } else if (rounds < target && old.completed) {
      // Correcting today's number back down takes today's credit away, and
      // nothing more: what is left of the chain ended yesterday.
      streak = Math.max(0, streak - 1)
      lastCompleted = streak > 0 ? yesterday : null
    }

    let logScore = rounds * 2
    if (rounds >= target) {
      logScore += 10
      for (const [day, bonus] of BONUS_DAYS) {
        if (streak === day && !old.bonusClaimed?.includes(day)) logScore += bonus
      }
    }

    tx.update(lDoc.ref, {
      roundsCompleted: rounds,
      progressPercentage: Math.min(100, Math.round((rounds / target) * 100)),
      streak,
      score: logScore,
      completed: rounds >= target,
      updatedAt: serverTimestamp(),
    })
    tx.update(userRef, {
      streak,
      longestStreak: Math.max(uData.longestStreak || 0, streak),
      score: Math.max(0, (uData.score || 0) + logScore - (old.score || 0)),
      lastSadhanaDate: today,
      lastCompletedSadhanaDate: lastCompleted,
      updatedAt: serverTimestamp(),
    })
  })
}
