import React from 'react'
import { Page, PageHeader, Section } from '../../components/common'
import { Skeleton } from '../../components/ui'
import { useAuth } from '../../hooks/useAuth'
import { useAccommodationRequests } from './hooks/useAccommodationRequests'
import { useRequestForm } from './hooks/useRequestForm'
import { useQrScanner } from './hooks/useQrScanner'
import RequestForm from './components/RequestForm'
import StayGuidelines from './components/StayGuidelines'
import RequestList from './components/RequestList'
import ScannerPanel from './components/ScannerPanel'
import LifecycleSteps from './components/LifecycleSteps'

const AccommodationPage = () => {
  const { user } = useAuth()
  const { requests, loading, updateStatus, actingId } = useAccommodationRequests(user)
  const requestForm = useRequestForm(user)
  const scanner = useQrScanner()

  return (
    <Page revealKey={loading}>
      <PageHeader
        kicker="Stay with us"
        title="Accommodation"
        description="Book your stay for upcoming festivals and holy visits."
      />

      <div className="mb-8 grid gap-6 lg:grid-cols-3 lg:gap-8">
        <section data-reveal className="lg:col-span-2">
          <RequestForm {...requestForm} onSubmit={requestForm.submit} />
        </section>

        <div className="grid content-start gap-6">
          <section data-reveal><StayGuidelines /></section>
          <Section title={user?.role === 'devotee' ? 'Your recent activity' : 'Incoming requests'} className="mb-0">
            {loading ? (
              <div className="grid gap-3">{[0, 1].map((i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}</div>
            ) : (
              <RequestList requests={requests} role={user?.role} actingId={actingId} onAction={updateStatus} />
            )}
          </Section>
        </div>
      </div>

      {user?.role !== 'devotee' && <section data-reveal className="mb-8"><ScannerPanel scanner={scanner} /></section>}
      <section data-reveal><LifecycleSteps /></section>
    </Page>
  )
}

export default AccommodationPage
