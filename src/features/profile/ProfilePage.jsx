import React, { useMemo, useState } from 'react'
import { Calendar, CreditCard, User } from 'lucide-react'
import { Tabs, Card } from '../../components/ui'
import { Page } from '../../components/common'
import { useAuth } from '../../hooks/useAuth'
import { useFirestore } from '../../hooks/useFirestore'
import { where } from '../../lib/pgstore'
import { SECTIONS, completion } from './lib/profileFields'
import { useProfileForm } from './hooks/useProfileForm'
import ProfileHeader from './components/ProfileHeader'
import Details from './components/Details'
import CompletionCard from './components/CompletionCard'
import { AttendancePanel, PaymentsPanel } from './components/ActivityTabs'
import Toast from './components/Toast'

const TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'attendance', label: 'Attendance', icon: Calendar },
  { id: 'payments', label: 'Payments', icon: CreditCard },
]

const ProfilePage = () => {
  const { user, logout } = useAuth()
  const isStaff = user?.role === 'admin' || user?.role === 'folks_head'
  const [tab, setTab] = useState('profile')
  const p = useProfileForm(user, isStaff)

  const mineQ = useMemo(() => [where('userId', '==', user?.uid || '')], [user?.uid])
  const { data: attendance, loading: attendanceLoading } = useFirestore('attendance', mineQ)
  const { data: payments, loading: paymentsLoading } = useFirestore('payments', mineQ)
  const { percent, missing } = completion(p.form)

  return (
    <Page width="max-w-5xl" className="space-y-5 pb-10 sm:space-y-6">
      <Toast toast={p.toast} />
      <ProfileHeader
        name={p.form.name}
        image={p.form.profileImage}
        qrToken={user?.qrToken}
        role={user?.role}
        isEditing={p.isEditing}
        saving={p.saving}
        uploading={p.uploading}
        onEdit={p.startEdit}
        onSave={p.save}
        onCancel={p.cancel}
        onLogout={logout}
        onPickFile={p.uploadAvatar}
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_300px] lg:items-start">
        <div className="order-2 min-w-0 lg:order-1">
          <Tabs value={tab} onValueChange={setTab}>
            <Tabs.List className="flex w-full" aria-label="Profile sections">
              {TABS.map(({ id, label, icon: Icon }) => (
                <Tabs.Trigger key={id} value={id} className="flex flex-1 items-center justify-center gap-2 px-2 sm:px-4"><Icon size={16} aria-hidden="true" /> {label}</Tabs.Trigger>
              ))}
            </Tabs.List>

            <Tabs.Panel value="profile" className="min-h-[320px]">
              <Card>
                <Details>
                  {SECTIONS.map((s) => (
                    <Details.Section key={s.id} title={s.title} icon={s.icon}>
                      {s.fields.map((f) => (
                        <Details.Item key={f.name} {...f} value={p.form[f.name]} editing={p.isEditing} onChange={p.change} readOnly={f.staffOnly && !isStaff} />
                      ))}
                    </Details.Section>
                  ))}
                </Details>
              </Card>
            </Tabs.Panel>
            <Tabs.Panel value="attendance" className="min-h-[320px]"><AttendancePanel items={attendance} loading={attendanceLoading} /></Tabs.Panel>
            <Tabs.Panel value="payments" className="min-h-[320px]"><PaymentsPanel items={payments} loading={paymentsLoading} /></Tabs.Panel>
          </Tabs>
        </div>
        <div className="order-1 lg:order-2 lg:sticky lg:top-24"><CompletionCard percent={percent} missing={missing} /></div>
      </div>
    </Page>
  )
}

export default ProfilePage
