import { downloadCsv } from '../../staff-common/lib/csv'
import { PERIODS } from './reportStats'

export const exportReport = ({ period, today, people, stats }) =>
  downloadCsv(`folk-report-${today}.csv`, [
    ['FOLK Vizag report', `${PERIODS.find((p) => p[0] === period)[1]} to ${today}`],
    [],
    ['Members', people.length], ['New in period', stats.newcomers.length], ['Chanted in last 7 days', stats.chanting.length],
    ['Without a guide', stats.noGuide.length], ['Program check-ins', stats.checkins.length],
    [], ['Stage', 'Members'], ...stats.byStage.map((s) => [s.label, s.value]),
    [], ['Program', 'Check-ins'], ...stats.programs.map((p) => [p.label, p.value]),
    [], ['Guide', 'Members', 'Quiet 7+ days', 'Follow-ups logged'], ...stats.guides.map((g) => [g.name, g.members, g.quiet, g.followups]),
  ], { bom: true })
