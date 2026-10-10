import React from 'react'
import { KeyRound } from 'lucide-react'
import { Badge, Button } from '../../../components/ui'
import { Alert, PanelCard } from '../../staff-common/components'
import AdminPasswordFields from '../../auth/components/AdminPasswordFields'

const AdminAccessCard = ({ canProvision, provisioning }) => {
  const { password, confirm, setPassword, setConfirm, state, submit } = provisioning
  const working = state.status === 'working'

  return (
    <PanelCard icon={KeyRound} tone="maroon" title="Site admin access">
      <p className="text-[14px] leading-relaxed text-ink-muted">
        Authorize a dedicated administrator login for managing the whole site. You choose its password below. Resetting it signs out anyone using the old one.
      </p>
      <Badge tone="maroon" className="mt-3">Username: admin</Badge>
      {canProvision ? (
        <div className="mt-5 space-y-4">
          <AdminPasswordFields password={password} confirm={confirm} onPasswordChange={setPassword} onConfirmChange={setConfirm} disabled={working} />
          <Button variant="dark" className="w-full" loading={working} onClick={submit}>Create / reset admin login</Button>
          {state.status === 'error' && <Alert>{state.message}</Alert>}
          {state.status === 'done' && <Alert tone="success">{state.message}</Alert>}
        </div>
      ) : (
        <p className="mt-5 rounded-xl bg-paper px-4 py-3 text-[14px] leading-relaxed text-ink-muted">
          Only a site administrator can create or reset the shared admin login. Ask an admin to do this from their Command Center.
        </p>
      )}
    </PanelCard>
  )
}

export default AdminAccessCard
