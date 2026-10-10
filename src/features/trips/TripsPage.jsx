import { useMemo } from 'react'
import { Settings } from 'lucide-react'
import { Button } from '../../components/ui'
import { Page, PageHeader } from '../../components/common'
import { useTripsData } from './hooks/useTripsData'
import { useTripFilters } from './hooks/useTripFilters'
import YatraStyles from './components/YatraStyles'
import PublicTopBar from './components/PublicTopBar'
import TripsHero from './components/TripsHero'
import TripsOverview from './components/TripsOverview'
import PlaceStrip from './components/PlaceStrip'
import TripsToolbar from './components/TripsToolbar'
import TripsGrid from './components/TripsGrid'
import CustomYatraCta from './components/CustomYatraCta'

const TripsPage = ({ openTrip, setActiveTab, onLoginClick, isPublicView = false }) => {
  const data = useTripsData()
  const filters = useTripFilters({ upcoming: data.upcoming, completed: data.completed, total: data.total })
  const manage = () => setActiveTab?.('trips-admin')

  const stats = useMemo(() => [
    { value: data.upcoming.length, label: 'Upcoming' },
    { value: data.completed.length, label: 'Completed' },
    { value: data.destinations.length || '—', label: 'Destinations' },
    ...(data.placeNames.length > 0 ? [{ value: data.placeNames.length, label: 'Holy places' }] : []),
  ], [data.upcoming.length, data.completed.length, data.destinations.length, data.placeNames.length])

  const content = (
    <Page width="max-w-7xl" className="pb-12">
      <YatraStyles />
      {isPublicView ? (
        <div className="mb-8 sm:mb-10">
          <TripsHero stats={stats} placeNames={data.placeNames} isStaff={data.isStaff} onManage={manage} />
        </div>
      ) : (
        <>
          <PageHeader
            kicker="Trips & Yatras"
            title="Journey to the holy places"
            description="Pilgrimages, weekend yatras and heritage trails with the FOLK crew. Pick a journey, reserve your seat."
            actions={data.isStaff && <Button variant="dark" onClick={manage}><Settings size={16} /> Manage trips</Button>}
          />
          <TripsOverview stats={stats} />
          {data.placeNames.length > 0 && (
            <div data-reveal className="mb-8 rounded-2xl border border-line/80 bg-white py-3.5 shadow-card"><PlaceStrip names={data.placeNames} /></div>
          )}
        </>
      )}

      <TripsToolbar
        tab={filters.tab} onTab={filters.setTab}
        counts={{ upcoming: data.upcoming.length, completed: data.completed.length }}
        showFilters={filters.showFilters}
        search={filters.search} onSearch={filters.setSearch}
        destination={filters.destination} onDestination={filters.setDestination}
        destinations={data.destinations}
      />

      <TripsGrid
        loading={data.loading}
        trips={filters.filtered}
        tab={filters.tab} onTab={filters.setTab}
        isFiltering={filters.isFiltering} onClear={filters.clear}
        seatsLeftFor={data.seatsLeftFor}
        onOpen={(slug) => openTrip?.(slug)}
        hasUpcoming={data.upcoming.length > 0}
        hasCompleted={data.completed.length > 0}
      />

      <CustomYatraCta />
    </Page>
  )

  if (isPublicView) {
    return (
      <div className="min-h-screen bg-paper">
        <PublicTopBar onLoginClick={onLoginClick} />
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">{content}</div>
      </div>
    )
  }
  return content
}

export default TripsPage
