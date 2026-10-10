import React, { useMemo, useState } from 'react'
import { CheckCircle2, Zap } from 'lucide-react'
import { Button } from '../../components/ui'
import { Page, PageHeader } from '../../components/common'
import { useAuth } from '../../hooks/useAuth'
import { todayIST } from '../../lib/dates'
import { DEFAULT_TARGET } from './lib/constants'
import { lastSevenDays, toDay } from './lib/week'
import { useSadhanaData } from './hooks/useSadhanaData'
import { useSadhanaActions } from './hooks/useSadhanaActions'
import StatsRow from './components/StatsRow'
import TodayCard from './components/TodayCard'
import WeekCard from './components/WeekCard'
import PassCard from './components/PassCard'
import RulesCard from './components/RulesCard'
import HistoryCard from './components/HistoryCard'
import TargetModal from './components/TargetModal'
import MilestoneModal from './components/MilestoneModal'
import StatusToast from './components/StatusToast'
import SadhanaSkeleton from './components/SadhanaSkeleton'

// Day keys must be India time: toISOString() is UTC and files morning japa under yesterday.
const SadhanaPage = () => {
  const { user } = useAuth()
  const today = todayIST()
  const { data, setData, loading, error, indexBuilding, reload, retry } = useSadhanaData(user, today)
  const actions = useSadhanaActions({ user, today, data, setData, reload })

  const [targetInput, setTargetInput] = useState(DEFAULT_TARGET)
  const [skipped, setSkipped] = useState(false)
  const [draft, setDraft] = useState(null)

  const todayLog = data.logs.find((l) => l.date === today) || null
  const roundsDraft = draft ?? (Number(todayLog?.roundsCompleted) || 0)
  const week = useMemo(() => lastSevenDays(data.logs, today), [data.logs, today])
  const dateLabel = new Date().toLocaleDateString('en-IN', { month: 'long', day: 'numeric', timeZone: 'Asia/Kolkata' })

  const attendance = data.attendance.map((a, i) => ({ key: a.id || i, title: a.session || 'Session', date: toDay(a.createdAt) }))
  const prasadam = data.prasadam.map((p, i) => ({ key: p.id || i, title: p.eventTitle || 'Prasadam', date: toDay(p.timestamp) }))

  return (
    <Page className="space-y-5 pb-10 sm:space-y-6" revealKey={loading}>
      <PageHeader
        kicker="Sadhana"
        title="Sadhana tracker"
        description={data.profile.name ? `Welcome home, ${data.profile.name}. Keep your vow, keep your streak.` : 'Keep your vow, keep your streak.'}
      />

      {error && (
        <div role="alert" data-reveal className="flex flex-col gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 sm:flex-row sm:items-center">
          <p className="flex-1 text-[14px] font-semibold text-red-700">{error}</p>
          <Button variant="danger" size="sm" onClick={retry}>Try again</Button>
        </div>
      )}
      {actions.actionError && (
        <div role="alert" className="flex items-center gap-3 rounded-2xl border border-red-100 bg-red-50 p-4">
          <p className="flex-1 text-[14px] font-semibold text-red-700">{actions.actionError}</p>
          <Button variant="ghost" size="sm" onClick={actions.dismissError}>Dismiss</Button>
        </div>
      )}

      {loading ? <SadhanaSkeleton /> : (
        <>
          <StatsRow streak={data.profile.streak} longest={data.profile.longestStreak} score={data.profile.score} />
          <div className="grid gap-4 sm:gap-5 lg:grid-cols-12">
            <TodayCard
              log={todayLog}
              draft={roundsDraft}
              onDraft={setDraft}
              onSubmit={() => actions.logRounds(roundsDraft)}
              onSetTarget={() => setSkipped(false)}
              submitting={actions.pending}
            />
            <WeekCard days={week} daysKept={week.filter((d) => d.done).length} indexBuilding={indexBuilding} />
            <PassCard token={user?.qrToken} name={user?.name || user?.fullName || user?.displayName || 'Devotee'} />
            <RulesCard />
          </div>
          <div className="grid gap-4 sm:gap-5 md:grid-cols-2">
            <HistoryCard title="Attendance history" icon={CheckCircle2} tone="success" badge="Verified" rows={attendance} emptyText="Check in at a program to see it here." />
            <HistoryCard title="Prasadam log" icon={Zap} tone="saffron" badge="Received" rows={prasadam} emptyText="Prasadam you receive at programs shows up here." />
          </div>
        </>
      )}

      <TargetModal
        open={!loading && !todayLog && !skipped && !error}
        target={targetInput}
        onChange={setTargetInput}
        onSubmit={() => actions.setTarget(targetInput)}
        onSkip={() => setSkipped(true)}
        submitting={actions.pending}
        dateLabel={dateLabel}
      />
      <MilestoneModal open={actions.milestone} streak={data.profile.streak} onClose={actions.closeMilestone} />
      <StatusToast show={actions.saved}>Progress recorded</StatusToast>
    </Page>
  )
}

export default SadhanaPage
