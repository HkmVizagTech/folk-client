import React from 'react'
import { Key, User, Mail } from 'lucide-react'
import { Card, Button } from '../../../components/ui'
import AdminPasswordFields from './AdminPasswordFields'
import ProvisionStatus from './ProvisionStatus'

const Detail = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-2.5 rounded-xl bg-paper px-3.5 py-3 text-[14px] text-ink-muted">
    <Icon size={16} aria-hidden="true" />
    {label}: <span className="font-semibold text-ink">{value}</span>
  </div>
)

/**
 * Administrator login card. The form is only offered to an existing admin;
 * the site owner bootstraps from /admin.
 */
const AdminLoginCard = ({ isAdmin, provision }) => {
  const { state, working, password, setPassword, confirm, setConfirm, submit } = provision
  return (
    <Card data-reveal className="bg-gradient-to-br from-white to-marigold/10">
      <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-navy-50 text-navy"><Key size={20} aria-hidden="true" /></span>
      <h2 className="font-display text-[20px] font-semibold text-ink">Administrator login</h2>
      <p className="mt-1 mb-5 text-[14px] leading-relaxed text-ink-muted">
        A dedicated login with full site access: socials, membership data, payments, everything.
      </p>
      <div className="mb-5 grid gap-2 sm:grid-cols-2">
        <Detail icon={User} label="Username" value="admin" />
        <Detail icon={Mail} label="Sign-in" value="admin (auto-mapped)" />
      </div>
      {isAdmin ? (
        <div className="space-y-5">
          <AdminPasswordFields idPrefix="setup" password={password} confirm={confirm} onPasswordChange={setPassword} onConfirmChange={setConfirm} disabled={working} />
          <Button type="button" variant="dark" size="lg" className="w-full sm:w-auto" loading={working} onClick={submit} disabled={working}>
            Create / reset admin login
          </Button>
          <ProvisionStatus state={state} />
        </div>
      ) : (
        <p className="rounded-xl bg-navy-50 px-4 py-3 text-[14px] leading-relaxed text-navy-700">
          Only an existing administrator can create or reset this login. If nobody has
          it yet, the site owner sets it up from the admin portal at <span className="font-semibold">/admin</span>.
        </p>
      )}
    </Card>
  )
}

export default AdminLoginCard
