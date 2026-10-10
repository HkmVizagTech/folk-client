import React from 'react'
import { Lock } from 'lucide-react'
import { MIN_ADMIN_PASSWORD_LENGTH } from '../../../lib/adminLogin'
import IconInput from './IconInput'

/**
 * New-password + confirm inputs for the shared admin login. Leaving both
 * empty lets the server fall back to its ADMIN_PASSWORD env var.
 */
const AdminPasswordFields = ({ idPrefix = 'admin', password, confirm, onPasswordChange, onConfirmChange, disabled = false }) => (
  <div className="space-y-4">
    <IconInput id={`${idPrefix}-new-password`} icon={Lock} label="New admin password" type="password"
      placeholder={`${MIN_ADMIN_PASSWORD_LENGTH}+ characters`} autoComplete="new-password"
      value={password} onChange={(e) => onPasswordChange(e.target.value)} disabled={disabled} />
    <IconInput id={`${idPrefix}-confirm-password`} icon={Lock} label="Confirm password" type="password"
      placeholder="Repeat the password" autoComplete="new-password"
      value={confirm} onChange={(e) => onConfirmChange(e.target.value)} disabled={disabled} />
    <p className="text-[13px] leading-relaxed text-ink-muted">
      Share it only with the people who run the site. Leave both empty to use the
      password configured on the server (ADMIN_PASSWORD).
    </p>
  </div>
)

export default AdminPasswordFields
