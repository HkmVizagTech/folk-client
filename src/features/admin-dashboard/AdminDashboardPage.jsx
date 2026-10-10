import React from 'react'
import { Page, PageHeader } from '../../components/common'
import { Skeleton } from '../../components/ui'
import { useAuth } from '../../hooks/useAuth'
import { useAdminDashboardData } from './hooks/useAdminDashboardData'
import { useBackendStatus } from './hooks/useBackendStatus'
import { useAdminProvisioning } from './hooks/useAdminProvisioning'
import { exportGrowthAudit } from './lib/growthAudit'
import { topPerformers, tripRow } from './lib/summary'
import BackendStatus from './components/BackendStatus'
import StatGrid from './components/StatGrid'
import QuickActions from './components/QuickActions'
import EventsPanel from './components/EventsPanel'
import RequestsPanel from './components/RequestsPanel'
import ResidencyPanel from './components/ResidencyPanel'
import TripsPanel from './components/TripsPanel'
import SevaPanel from './components/SevaPanel'
import TopPerformers from './components/TopPerformers'
import CommunityPanel from './components/CommunityPanel'
import AdminAccessCard from './components/AdminAccessCard'

const DashboardSkeleton = () => (
  <div aria-busy="true" aria-label="Loading dashboard">
    <div className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 lg:grid-cols-3">{[0, 1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}</div>
    <Skeleton className="mt-8 h-64 rounded-2xl" />
  </div>
)

/**
 * Command Center: the admin's own dashboard, separate from the devotee
 * experience. Site-wide management and monitoring only.
 */
const AdminDashboardPage = ({ setActiveTab, onOpenScanner }) => {
  const { user } = useAuth()
  const data = useAdminDashboardData()
  const backendStatus = useBackendStatus()
  const provisioning = useAdminProvisioning()

  // The server's createAdmin only accepts an existing admin (or the root UID /
  // setup code), so a folks_head could only ever get a raw rejection: admins only.
  const canProvisionAdmin = user?.role === 'admin'
  const createEvent = () => {
    window.location.hash = '#new'
    setActiveTab('events')
  }

  const header = (
    <PageHeader
      kicker="Administration"
      title="Command Center"
      description={`Signed in as ${user?.name || user?.displayName || user?.email || 'Administrator'}`}
      actions={<BackendStatus status={backendStatus} />}
    />
  )

  if (data.loading) return <Page width="max-w-7xl" revealKey="loading">{header}<DashboardSkeleton /></Page>

  const trips = data.upcomingTrips.map((t) => tripRow(t, data.tripRegistrations || []))

  return (
    <Page width="max-w-7xl" className="pb-10" revealKey="ready">
      {header}
      <StatGrid data={data} onNavigate={setActiveTab} />
      <QuickActions onNavigate={setActiveTab} onOpenScanner={onOpenScanner} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="min-w-0 space-y-6 lg:col-span-2">
          <EventsPanel events={data.events} onNavigate={setActiveTab} onCreate={createEvent} />
          <RequestsPanel requests={data.requests} onNavigate={setActiveTab} />
          <ResidencyPanel bookings={data.pendingHostelBookings} listings={data.activeHostelListings} onNavigate={setActiveTab} />
          <TripsPanel trips={trips} pendingCount={data.pendingTripRegs.length} onNavigate={setActiveTab} />
          <SevaPanel sevas={data.sevas} onManage={() => setActiveTab('seva')} />
        </div>
        <div className="min-w-0 space-y-6">
          <TopPerformers users={topPerformers(data.users)} onViewAll={() => setActiveTab('devotees')} />
          <CommunityPanel users={data.users} onExport={() => exportGrowthAudit(data.users)} />
          <AdminAccessCard canProvision={canProvisionAdmin} provisioning={provisioning} />
        </div>
      </div>
    </Page>
  )
}

export default AdminDashboardPage
