import React from 'react'
import { ShieldCheck } from 'lucide-react'
import { Card } from '../../../components/ui'

const AdminAccessNotice = ({ role }) => (
  <Card data-reveal className="border-red-200 bg-gradient-to-br from-red-50 to-saffron-50">
    <h2 className="mb-2 flex items-center gap-2 font-display text-[18px] font-semibold text-ink">
      <ShieldCheck size={18} className="text-red-600" aria-hidden="true" /> Sign in with the admin login to manage the site
    </h2>
    <p className="text-[15px] leading-relaxed text-ink-muted">
      You are signed in as a <span className="font-semibold text-ink">{role || 'devotee'}</span>.
      The panels below are only visible to the Site Administrator / Folks Head. To manage
      the site, sign out and sign in with the shared admin login (username{' '}
      <span className="font-semibold text-saffron-dark">admin</span>) - ask the site owner for its password.
    </p>
    <p className="mt-3 text-[13px] leading-relaxed text-ink-muted">
      Only an existing administrator (or the site owner, from the admin portal at
      <span className="font-semibold text-ink"> /admin</span>) can create or reset this login.
    </p>
  </Card>
)

export default AdminAccessNotice
