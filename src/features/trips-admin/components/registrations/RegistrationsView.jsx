import React from 'react'
import { Users } from 'lucide-react'
import EmptyState from '../../../../components/common/EmptyState'
import Button from '../../../../components/ui/Button'
import Skeleton from '../../../../components/ui/Skeleton'
import Alert from '../Alert'
import RegistrationsSummary from './RegistrationsSummary'
import RegistrationFilters from './RegistrationFilters'
import RegistrationCard from './RegistrationCard'
import RegistrationsTable from './RegistrationsTable'

const Loading = () => (
  <div className="space-y-3" aria-busy="true">
    {[0, 1, 2].map((i) => <Skeleton key={i} className="h-28 w-full rounded-2xl" />)}
  </div>
)

/** Presentational registrations console: summary, filters, then cards (<xl) or table (xl+). */
const RegistrationsView = ({ trips, registrations, loading, filters, resolve, actions, cash, onExport }) => {
  const total = registrations.length
  const rows = filters.filtered

  let body
  if (loading && total === 0) {
    body = <Loading />
  } else if (rows.length === 0) {
    body = (
      <EmptyState
        icon={Users}
        title={total === 0 ? 'No registrations yet' : 'Nothing matches these filters'}
        description={total === 0
          ? 'Once a trip is published with registrations open, every devotee who books a seat appears here.'
          : 'Try a different trip, status or payment method — or clear the filters to see everything.'}
        action={total > 0 ? <Button variant="soft" onClick={filters.clear}>Clear filters</Button> : null}
      />
    )
  } else {
    body = (
      <>
        <div className="space-y-3 xl:hidden">
          {rows.map((reg) => (
            <div key={reg.id} data-reveal>
              <RegistrationCard
                reg={reg} pay={resolve(reg)} busy={actions.busyId === reg.id}
                expanded={actions.noteOpen === reg.id} actions={actions} cash={cash}
              />
            </div>
          ))}
        </div>
        <RegistrationsTable registrations={rows} resolve={resolve} busyId={actions.busyId} noteOpen={actions.noteOpen} actions={actions} cash={cash} />
      </>
    )
  }

  return (
    <div className="space-y-6">
      <RegistrationsSummary summary={filters.summary} />
      <RegistrationFilters filters={filters} trips={trips} total={total} onExport={onExport} />
      {actions.error && <Alert>{actions.error}</Alert>}
      {body}
    </div>
  )
}

export default RegistrationsView
