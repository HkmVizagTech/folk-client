import React from 'react'
import { Download } from 'lucide-react'
import { Page, PageHeader } from '../../components/common'
import { Button, Select, Skeleton } from '../../components/ui'
import { stagePalette } from '../staff-common/lib/chartTheme'
import { useReportStats } from './hooks/useReportStats'
import { useBroadcast } from './hooks/useBroadcast'
import { PERIODS } from './lib/reportStats'
import { exportReport } from './lib/exportReport'
import ReportStats from './components/ReportStats'
import BarChartCard from './components/BarChartCard'
import GuidesTable from './components/GuidesTable'
import BirthdayCard from './components/BirthdayCard'
import BroadcastCard from './components/BroadcastCard'

const ReportsPage = () => {
  const r = useReportStats()
  const broadcast = useBroadcast({ members: r.members, me: r.me, isAdmin: r.isAdmin })
  const { stats } = r

  return (
    <Page width="max-w-7xl" className="pb-10" revealKey={r.loading}>
      <PageHeader
        kicker="Insights"
        title="Reports"
        description={`${r.isAdmin ? 'All of FOLK Vizag.' : 'Your members.'} Generated from live data.`}
        actions={<>
          <Select aria-label="Period" className="w-auto min-w-[10rem]" value={r.period} onChange={(e) => r.setPeriod(e.target.value)}>
            {PERIODS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </Select>
          <Button variant="secondary" onClick={() => exportReport(r)}><Download size={16} aria-hidden="true" /> CSV</Button>
        </>}
      />

      {r.loading ? (
        <div className="space-y-4" aria-busy="true"><Skeleton className="h-28 rounded-2xl" /><Skeleton className="h-64 rounded-2xl" /></div>
      ) : (
        <div className="space-y-6">
          <ReportStats people={r.people} stats={stats} />
          <div className="grid gap-6 lg:grid-cols-2">
            <BarChartCard title="Members by stage" data={stats.byStage} colors={stagePalette} emptyText="No members yet." />
            <BarChartCard title="Check-ins by program" description="Busiest programs in this period" data={stats.programs} emptyText="No check-ins in this period." />
          </div>
          {r.isAdmin && stats.guides.length > 0 && <GuidesTable guides={stats.guides} />}
          {stats.birthdays.length > 0 && <BirthdayCard people={stats.birthdays} />}
        </div>
      )}

      <div className="mt-6"><BroadcastCard isAdmin={r.isAdmin} form={broadcast} /></div>
    </Page>
  )
}

export default ReportsPage
