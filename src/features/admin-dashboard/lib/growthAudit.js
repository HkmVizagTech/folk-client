import { stageOf, stageLabel } from '../../../content/journey'
import { downloadCsv } from '../../staff-common/lib/csv'

// Level stays exactly as stored so the audit shows what is in the column (a text
// label, or a legacy '1'-'5'); Stage is the comparable value for grouping.
const HEADERS = ['Name', 'Role', 'Level', 'Stage', 'Streak', 'Longest Streak', 'Score', 'Phone', 'QR Token']

export const exportGrowthAudit = (users) =>
  downloadCsv(`growth_audit_${new Date().toISOString().slice(0, 10)}.csv`, [
    HEADERS,
    ...users.map((u) => [u.name, u.role, u.level, stageLabel(stageOf(u)), u.streak || 0, u.longestStreak || 0, u.score || 0, u.phone || '', u.qrToken || '']),
  ])
