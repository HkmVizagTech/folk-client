import { downloadCsv } from '../../staff-common/lib/csv'

const HEADERS = ['Name', 'Phone', 'Address', 'Role', 'Level', 'Streak', 'Longest Streak', 'Score', 'QR Token']

export const exportDevotees = (devotees) =>
  downloadCsv(`devotees_${new Date().toISOString().slice(0, 10)}.csv`, [
    HEADERS,
    ...devotees.map((d) => [d.name, d.phone, d.address, d.role, d.level, d.streak || 0, d.longestStreak || 0, d.score || 0, d.qrToken || '']),
  ])
