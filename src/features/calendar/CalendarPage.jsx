import React, { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '../../components/ui'
import { Page, PageHeader } from '../../components/common'
import { useAuth } from '../../hooks/useAuth'
// Shared with the Events feature, so it stays where it is.
import EventModal from '../../components/events/EventModal'
import { longDayLabel } from './lib/monthGrid'
import { useCalendar } from './hooks/useCalendar'
import CalendarToolbar from './components/CalendarToolbar'
import MonthGrid from './components/MonthGrid'
import DayPanel from './components/DayPanel'
import UpcomingMine from './components/UpcomingMine'
import Observances from './components/Observances'

const CalendarPage = () => {
  const { user } = useAuth()
  const isStaff = user?.role === 'admin' || user?.role === 'folks_head'
  const cal = useCalendar(user, isStaff)
  const [editing, setEditing] = useState(null) // { event } | { date }

  return (
    <Page revealKey={cal.loading}>
      <PageHeader
        kicker="Programs"
        title="Calendar"
        description={isStaff
          ? 'Everything you and the team have scheduled. Tap a day to add a program for your members.'
          : 'Programs for you, from FOLK Vizag and from your guide. Tap a day to see what is on.'}
        actions={isStaff && <Button onClick={() => setEditing({ date: cal.selected })}><Plus size={18} aria-hidden="true" /> New program</Button>}
      />

      {isStaff && <CalendarToolbar onlyMine={cal.onlyMine} onChange={cal.setOnlyMine} />}

      <div className="grid gap-5 lg:grid-cols-3">
        <MonthGrid
          cursor={cal.cursor}
          cells={cal.cells}
          byDay={cal.byDay}
          selected={cal.selected}
          todayKey={cal.todayKey}
          onSelect={cal.setSelected}
          onMove={cal.move}
          onToday={cal.goToday}
        />
        <DayPanel
          label={longDayLabel(cal.selected)}
          events={cal.byDay.get(cal.selected) || []}
          loading={cal.loading && !cal.events.length}
          user={user}
          isStaff={isStaff}
          onEdit={(event) => setEditing({ event })}
          onAdd={() => setEditing({ date: cal.selected })}
        />
      </div>

      {cal.upcomingMine.length > 0 && <UpcomingMine events={cal.upcomingMine} onPick={cal.focusEvent} />}
      <Observances />

      <EventModal open={!!editing} onClose={() => setEditing(null)} event={editing?.event || null} defaultDate={editing?.date || ''} />
    </Page>
  )
}

export default CalendarPage
