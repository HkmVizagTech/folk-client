import React from 'react'
import { ShieldAlert, LogOut, ArrowRight } from 'lucide-react'
import { Button } from '../../components/ui'
import { useAuth } from '../../hooks/useAuth'
import { useAdminProvision } from './hooks/useAdminProvision'
import AuthShell from './components/AuthShell'
import OwnerBootstrap from './components/OwnerBootstrap'

/**
 * Shown on /admin to a signed-in user whose role is not staff. Offers a hop
 * to the member app, a sign-out, and the site owner's admin-login bootstrap.
 */
const AdminAccessDenied = () => {
  const { user, logout } = useAuth()
  const provision = useAdminProvision({
    withSetupCode: true,
    workingMessage: 'Provisioning the shared admin login…',
    doneSuffix: ' Reload the page, or sign out and sign in with the admin login.',
  })

  return (
    <AuthShell
      variant="admin"
      badge={<ShieldAlert size={24} aria-hidden="true" />}
      title="Access restricted"
      description="This portal is for administrators only."
    >
      <p className="mb-6 text-[15px] leading-relaxed text-ink-muted">
        You are signed in as <span className="font-semibold text-ink">{user?.email || user?.name || 'a member'}</span>{' '}
        (<span className="font-semibold text-ink">{user?.role || 'devotee'}</span>). Use the member app instead,
        or sign out and enter administrator credentials.
      </p>
      <div className="space-y-3">
        <Button asChild size="lg" className="w-full">
          <a href="/">Go to member app <ArrowRight size={18} aria-hidden="true" /></a>
        </Button>
        <Button type="button" variant="secondary" size="lg" className="w-full" onClick={logout}>
          <LogOut size={16} aria-hidden="true" /> Sign out
        </Button>
      </div>
      <OwnerBootstrap uid={user?.uid} provision={provision} />
    </AuthShell>
  )
}

export default AdminAccessDenied
