import React, { useMemo, useState } from 'react'
import { Bus, ChevronLeft, Plus, ShieldCheck, Users } from 'lucide-react'
import Page from '../../components/common/Page'
import PageHeader from '../../components/common/PageHeader'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Skeleton from '../../components/ui/Skeleton'
import Tabs from '../../components/ui/Tabs'
import { useAuth } from '../../hooks/useAuth'
import { downloadCsv } from './lib/format'
import { buildExport, tripRegStats } from './lib/registrations'
import { useTripsData } from './hooks/useTripsData'
import { useTripActions } from './hooks/useTripActions'
import { useDeleteTrip } from './hooks/useDeleteTrip'
import { useTripForm } from './hooks/useTripForm'
import { useRegistrationActions } from './hooks/useRegistrationActions'
import { useCashRecording } from './hooks/useCashRecording'
import { useRegistrationFilters } from './hooks/useRegistrationFilters'
import TripsView from './components/trips/TripsView'
import RegistrationsView from './components/registrations/RegistrationsView'
import TripEditor from './components/editor/TripEditor'
import DeleteTripDialog from './components/dialogs/DeleteTripDialog'
import { RecordCashDialog, UndoCashDialog } from './components/dialogs/CashDialogs'

const PageSkeleton = () => (
  <Page>
    <Skeleton className="mb-8 h-24 w-full" />
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-28" />)}
    </div>
    <Skeleton className="mt-6 h-48 w-full rounded-2xl" />
  </Page>
)

/** Container: owns data, state and handlers; every child below is presentational. */
const TripsAdminPage = ({ setActiveTab, openTrip }) => {
  const { user } = useAuth()
  // Only a real admin may delete (firestore.rules reject a delete from folks_head).
  const isAdmin = user?.role === 'admin'

  const [view, setView] = useState('trips')
  const { trips: rawTrips, registrations: rawRegistrations, tripsLoading, regsLoading, resolve } = useTripsData()
  const tripActions = useTripActions(rawTrips)
  const regActions = useRegistrationActions(rawRegistrations)
  const { trips } = tripActions
  const { registrations } = regActions

  const editor = useTripForm({ trips, uid: user?.uid })
  const del = useDeleteTrip()
  const cash = useCashRecording(user)
  const filters = useRegistrationFilters(registrations, resolve)
  const statsByTrip = useMemo(() => tripRegStats(registrations), [registrations])

  const exportRegistrations = () => {
    const { headers, rows } = buildExport(filters.filtered, resolve)
    downloadCsv(headers, rows, `trip_registrations_${new Date().toISOString().slice(0, 10)}.csv`)
  }

  const seeRegistrations = (trip) => { filters.setTrip(trip.id); setView('registrations') }

  if (tripsLoading && trips.length === 0) return <PageSkeleton />

  return (
    <Page revealKey={`${view}-${regsLoading}`} width="max-w-6xl" className="pb-10">
      <PageHeader
        kicker="Command center"
        title="Trips & Yatras"
        description="Create pilgrimages, publish them, and manage every registration and payment."
        actions={(
          <>
            {isAdmin && <Badge tone="saffron" size="md"><ShieldCheck size={13} /> Admin</Badge>}
            {setActiveTab && (
              <Button variant="ghost" onClick={() => setActiveTab('admin')}><ChevronLeft size={16} /> Command center</Button>
            )}
            <Button onClick={editor.openCreate}><Plus size={18} /> New trip</Button>
          </>
        )}
      >
        <Tabs value={view} onValueChange={setView}>
          <Tabs.List>
            <Tabs.Trigger value="trips" className="inline-flex items-center gap-2"><Bus size={15} /> Trips <Badge size="sm" tone="neutral">{trips.length}</Badge></Tabs.Trigger>
            <Tabs.Trigger value="registrations" className="inline-flex items-center gap-2"><Users size={15} /> Registrations <Badge size="sm" tone="neutral">{registrations.length}</Badge></Tabs.Trigger>
          </Tabs.List>
        </Tabs>
      </PageHeader>

      {view === 'trips' ? (
        <TripsView
          trips={trips}
          registrationCount={registrations.length}
          statsByTrip={statsByTrip}
          busyId={tripActions.busyId}
          error={tripActions.error}
          isAdmin={isAdmin}
          onCreate={editor.openCreate}
          onEdit={editor.openEdit}
          onDuplicate={editor.openDuplicate}
          onView={(trip) => openTrip && trip.slug && openTrip(trip.slug)}
          onDelete={del.ask}
          onStatus={tripActions.setStatus}
          onToggleRegistration={tripActions.toggleRegistration}
          onSeeRegistrations={seeRegistrations}
        />
      ) : (
        <RegistrationsView
          trips={trips}
          registrations={registrations}
          loading={regsLoading}
          filters={filters}
          resolve={resolve}
          actions={regActions}
          cash={cash}
          onExport={exportRegistrations}
        />
      )}

      <TripEditor editor={editor} />
      <DeleteTripDialog del={del} regCount={statsByTrip.get(del.target?.id)?.count || 0} />
      <RecordCashDialog cash={cash} />
      <UndoCashDialog cash={cash} />
    </Page>
  )
}

export default TripsAdminPage
