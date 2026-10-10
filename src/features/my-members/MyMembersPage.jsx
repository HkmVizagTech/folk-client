import React, { useEffect, useState } from 'react'
import { Page, PageHeader } from '../../components/common'
import { Select, Tabs } from '../../components/ui'
import { useMyMembers } from './hooks/useMyMembers'
import { useFollowUpLog } from './hooks/useFollowUpLog'
import MemberStats from './components/MemberStats'
import BirthdayStrip from './components/BirthdayStrip'
import MemberList from './components/MemberList'
import FollowUpModal from './components/FollowUpModal'
import HistoryModal from './components/HistoryModal'

const MyMembersPage = () => {
  const followUp = useFollowUpLog()
  const data = useMyMembers(followUp.pending)
  const { settle } = followUp
  useEffect(() => settle(data.members), [settle, data.members])

  const [view, setView] = useState('attention')
  const [historyFor, setHistoryFor] = useState(null)
  const shown = view === 'attention' ? data.attention : data.rows
  const ownMembers = data.guideId === data.me?.uid

  return (
    <Page width="max-w-7xl" className="pb-10" revealKey={data.loading}>
      <PageHeader
        kicker="Care"
        title="My members"
        description={`${ownMembers ? 'People you guide.' : `Members guided by ${data.guideName || 'this guide'}.`} Reach out to anyone who has gone quiet.`}
        actions={data.isAdmin && (
          <Select aria-label="Guide" className="min-w-[14rem]" value={data.guideId} onChange={(e) => data.setGuideId(e.target.value)}>
            {data.staff.map((s) => <option key={s.id} value={s.id}>{s.id === data.me?.uid ? 'Me' : s.displayName}</option>)}
          </Select>
        )}
      />

      <MemberStats rows={data.rows} attention={data.attention} birthdays={data.birthdays} programCount={data.programCount} />
      <BirthdayStrip birthdays={data.birthdays} />

      <div data-reveal className="mb-5">
        <Tabs value={view} onValueChange={setView}>
          <Tabs.List aria-label="Member view">
            <Tabs.Trigger value="attention">Needs attention ({data.attention.length})</Tabs.Trigger>
            <Tabs.Trigger value="all">All ({data.rows.length})</Tabs.Trigger>
          </Tabs.List>
        </Tabs>
      </div>

      <MemberList rows={data.rows} shown={shown} loading={data.loading} view={view} onLog={followUp.open} onHistory={setHistoryFor} />

      <FollowUpModal
        member={followUp.logFor}
        form={followUp.form}
        error={followUp.error}
        busy={followUp.busy}
        today={data.today}
        onChange={followUp.update}
        onSubmit={followUp.save}
        onClose={followUp.close}
      />
      <HistoryModal member={historyFor} onClose={() => setHistoryFor(null)} />
    </Page>
  )
}

export default MyMembersPage
