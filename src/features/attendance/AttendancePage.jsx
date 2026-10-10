import React, { useMemo, useState } from 'react'
import { QrCode, Users, Clock3 } from 'lucide-react'
import { Page, PageHeader, StatCard } from '../../components/common'
import { Button, Select } from '../../components/ui'
import { where } from '../../lib/pgstore'
import { toDate } from '../../lib/dates'
import { useAuth } from '../../hooks/useAuth'
import { useFirestore } from '../../hooks/useFirestore'
import { useTokenVerification } from './hooks/useTokenVerification'
import RollCall from './components/roll-call/RollCall'
import CheckinsCard from './components/CheckinsCard'
import VerifyPanel from './components/VerifyPanel'
import RegistrationsCard from './components/RegistrationsCard'

const AttendancePage = ({ onOpenScanner }) => {
  const { user } = useAuth()
  const { data: checkins, loading } = useFirestore('attendance')
  const { data: events } = useFirestore('events')
  const { data: myRegistrations } = useFirestore('registrations', useMemo(() => [where('userId', '==', user?.uid || '')], [user?.uid]))

  const [search, setSearch] = useState('')
  const [scanMode, setScanMode] = useState('attendance')
  const [selectedEventId, setSelectedEventId] = useState('')
  const verification = useTokenVerification({ events, selectedEventId, mode: scanMode })

  // Stats and table both follow the selected event so the two always agree.
  const eventCheckins = useMemo(
    () => (selectedEventId ? checkins.filter((c) => c.eventId === selectedEventId) : checkins),
    [checkins, selectedEventId],
  )
  const rows = useMemo(() => {
    const term = search.trim().toLowerCase()
    return eventCheckins
      .filter((c) => !term || c.name?.toLowerCase().includes(term) || c.session?.toLowerCase().includes(term))
      .sort((a, b) => (toDate(b.createdAt)?.getTime() || 0) - (toDate(a.createdAt)?.getTime() || 0))
  }, [eventCheckins, search])

  const onTime = eventCheckins.filter((c) => c.status === 'On-time').length
  const onTimeRate = eventCheckins.length ? `${Math.round((onTime / eventCheckins.length) * 100)}%` : '—'
  const isStaff = user?.role !== 'devotee'
  const selectedTitle = events.find((e) => e.id === selectedEventId)?.title

  return (
    <Page width="max-w-7xl" className="pb-10" revealKey={loading}>
      <PageHeader
        kicker="Programs"
        title="Live attendance"
        description="Real-time devotee check-ins and session tracking."
        actions={<>
          <Select aria-label="Select event" value={selectedEventId} onChange={(e) => setSelectedEventId(e.target.value)} className="min-w-[13rem] sm:w-56">
            <option value="">All events</option>
            {events.map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}
          </Select>
          <Button onClick={() => onOpenScanner('attendance')}><QrCode size={18} aria-hidden="true" /> Scan pass</Button>
        </>}
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4">
        <StatCard label="Total present" value={eventCheckins.length} sub={selectedTitle || 'All events'} icon={Users} tone="maroon" />
        <StatCard label="On-time rate" value={onTimeRate} sub={`${onTime} on time`} icon={Clock3} tone="green" />
      </div>

      {selectedEventId && <RollCall eventId={selectedEventId} eventTitle={selectedTitle} />}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="min-w-0 lg:col-span-2">
          <CheckinsCard rows={rows} loading={loading} search={search} onSearch={setSearch} />
        </div>
        <div className="min-w-0">
          {isStaff
            ? <VerifyPanel events={events} eventId={selectedEventId} onEventChange={setSelectedEventId} mode={scanMode} onModeChange={setScanMode} verification={verification} onOpenScanner={onOpenScanner} />
            : <RegistrationsCard registrations={myRegistrations} />}
        </div>
      </div>
    </Page>
  )
}

export default AttendancePage
