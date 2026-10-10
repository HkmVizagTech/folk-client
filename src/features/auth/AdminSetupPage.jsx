import React from 'react'
import { ArrowLeft } from 'lucide-react'
import { Button } from '../../components/ui'
import { Page, PageHeader } from '../../components/common'
import { useAuth } from '../../hooks/useAuth'
import { useAdminProvision } from './hooks/useAdminProvision'
import ManagementGrid from './components/ManagementGrid'
import AdminLoginCard from './components/AdminLoginCard'
import AdminAccessNotice from './components/AdminAccessNotice'
import SignInSteps from './components/SignInSteps'

const AdminSetup = ({ setActiveTab }) => {
  const { user } = useAuth()
  const provision = useAdminProvision({ workingMessage: 'Setting up the shared admin login…' })

  // Staff see the management panels; only a full admin may reset the shared
  // admin login (the server's createAdmin accepts an existing admin, the root
  // UID, or the setup code - a folks_head or devotee is always rejected).
  const isStaff = user?.role === 'admin' || user?.role === 'folks_head'
  const isAdmin = user?.role === 'admin'

  return (
    <Page width="max-w-5xl" className="pb-10">
      <PageHeader
        kicker="Administration"
        title="Site admin"
        description="Everything you need to run the whole site from one place: management panels and the shared administrator login."
        actions={(
          <Button variant="secondary" onClick={() => setActiveTab('admin')}>
            <ArrowLeft size={16} aria-hidden="true" /> Command Center
          </Button>
        )}
      />
      <div className="space-y-6">
        {!isStaff && <AdminAccessNotice role={user?.role} />}
        {isStaff && <ManagementGrid onOpen={setActiveTab} />}
        <AdminLoginCard isAdmin={isAdmin} provision={provision} />
        <SignInSteps />
      </div>
    </Page>
  )
}

export default AdminSetup
