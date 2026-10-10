// A chain lives or dies by the last day the member actually hit their target,
// which is what `lastCompletedSadhanaDate` records. `lastSadhanaDate` means
// "last logged anything" (MyMembers and Reports read it as a contact gap), so a
// half-finished morning logged at lunchtime must not read as a day done.
export const streakState = (uData, today, yesterday) => {
  const streak = uData.streak || 0
  // One-time backfill: nobody carries lastCompletedSadhanaDate until their
  // first log after this ships, and a streak still standing means the day in
  // lastSadhanaDate was one they completed.
  const lastCompleted = uData.lastCompletedSadhanaDate || (streak > 0 ? uData.lastSadhanaDate : null) || null
  if (lastCompleted !== today && lastCompleted !== yesterday) return { streak: 0, lastCompleted: null }
  return { streak, lastCompleted }
}
