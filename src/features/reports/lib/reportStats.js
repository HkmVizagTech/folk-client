import { STAGES } from '../../../content/journey'
import { daysBetween, toDate } from '../../../lib/dates'

export const PERIODS = [['7', 'Last 7 days'], ['30', 'Last 30 days'], ['90', 'Last 90 days']]

const DOB = /^\d{4}-\d{2}-\d{2}$/

/** All the numbers on the Reports screen, derived from live collections. */
export const computeStats = ({ people, scope, members, staff, attendance, followups, since, today, isAdmin }) => {
  const byStage = STAGES.map((s) => ({ label: s.label, value: people.filter((m) => m.stage === s.id).length }))
  const newcomers = people.filter((m) => { const d = toDate(m.createdAt); return d && d >= since })
  const chanting = people.filter((m) => m.lastSadhanaDate && daysBetween(m.lastSadhanaDate, today) <= 7)
  const noGuide = people.filter((m) => !m.guideId)
  const scopeIds = new Set(scope.map((m) => m.id))
  const checkins = attendance.filter((a) => isAdmin || scopeIds.has(a.userId))

  const perProgram = new Map()
  for (const a of checkins) {
    const k = a.session || a.eventTitle || 'Program'
    perProgram.set(k, (perProgram.get(k) || 0) + 1)
  }
  const programs = [...perProgram.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([label, value]) => ({ label, value }))

  const birthdays = people
    .filter((m) => DOB.test(m.dob || '') && m.dob.slice(5, 7) === today.slice(5, 7))
    .sort((a, b) => a.dob.slice(8).localeCompare(b.dob.slice(8)))

  const guides = staff.map((g) => {
    const theirs = members.filter((m) => m.guideId === g.id && !m.isStaff)
    return {
      id: g.id,
      name: g.displayName,
      members: theirs.length,
      quiet: theirs.filter((m) => !m.lastSadhanaDate || daysBetween(m.lastSadhanaDate, today) >= 7).length,
      followups: followups.filter((f) => f.guideId === g.id).length,
    }
  }).filter((g) => g.members > 0 || g.followups > 0).sort((a, b) => b.members - a.members)

  return { byStage, newcomers, chanting, noGuide, checkins, programs, birthdays, guides }
}
