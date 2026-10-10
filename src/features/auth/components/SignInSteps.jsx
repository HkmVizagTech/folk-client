import React from 'react'
import { Mail } from 'lucide-react'
import { Card } from '../../../components/ui'

const STEPS = [
  <>Log out if you are signed in as a regular devotee.</>,
  <>On the login screen, type username <b className="text-ink">admin</b> and the admin password the site owner set.</>,
  <>You will land on the <b className="text-ink">Command Center</b> - from there use the management cards above (or the navbar) to run Events, Hostels, Accommodation, Devotees, Attendance and Seva.</>,
]

const SignInSteps = () => (
  <Card data-reveal className="bg-paper">
    <h2 className="mb-4 flex items-center gap-2 font-display text-[18px] font-semibold text-ink">
      <Mail size={18} className="text-saffron" aria-hidden="true" /> How to sign in as admin
    </h2>
    <ol className="space-y-3">
      {STEPS.map((step, i) => (
        <li key={i} className="flex items-start gap-3 text-[15px] leading-relaxed text-ink-muted">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-navy text-[12px] font-bold text-white">{i + 1}</span>
          <span>{step}</span>
        </li>
      ))}
    </ol>
  </Card>
)

export default SignInSteps
