import React, { useState } from 'react'
import { ChevronDown, KeyRound, Copy, Check } from 'lucide-react'
import { Button } from '../../../components/ui'
import { cn } from '../../../lib/utils'
import AdminPasswordFields from './AdminPasswordFields'
import IconInput from './IconInput'
import ProvisionStatus from './ProvisionStatus'

/**
 * Site-owner setup: the server only accepts this from the ROOT_ADMIN_UID
 * account or with the correct ADMIN_SETUP_CODE.
 */
const OwnerBootstrap = ({ uid, provision }) => {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const { state, working, password, setPassword, confirm, setConfirm, setupCode, setSetupCode, submit } = provision

  const copyUid = async () => {
    try {
      await navigator.clipboard.writeText(uid || '')
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard unavailable (older browser/insecure context) - the raw UID is still selectable.
    }
  }

  return (
    <div className="mt-6 border-t border-line pt-4 text-left">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="flex min-h-[44px] w-full items-center justify-between gap-3 rounded-lg text-left text-[14px] font-semibold text-ink-muted hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron"
      >
        <span>Site owner? Create or reset the admin login</span>
        <ChevronDown size={16} className={cn('shrink-0 transition-transform', open && 'rotate-180')} aria-hidden="true" />
      </button>

      {open && (
        <div className="mt-3 space-y-5">
          <p className="text-[14px] leading-relaxed text-ink-muted">
            This creates the shared administrator account (username <span className="font-semibold text-ink">admin</span>) with
            the password you choose, or resets it. Only the site owner&apos;s account, or someone with the server&apos;s setup code, can do this.
          </p>

          <div className="space-y-4 rounded-xl border border-line bg-paper p-4">
            <div>
              <p className="mb-2 text-[13px] font-semibold text-ink">Your Firebase UID</p>
              <p className="mb-2 text-[13px] text-ink-muted">Set it as ROOT_ADMIN_UID on Railway to bootstrap with this account.</p>
              <div className="flex items-center gap-2 rounded-lg border border-line bg-white p-2">
                <code className="flex-1 break-all font-mono text-[12px] text-ink select-all">{uid || 'unavailable'}</code>
                <Button type="button" variant="ghost" size="icon" aria-label="Copy UID" onClick={copyUid}>
                  {copied ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
                </Button>
              </div>
            </div>
            <IconInput id="setup-code" icon={KeyRound} label="Setup code" type="password" autoComplete="off" placeholder="ADMIN_SETUP_CODE (server env var)"
              value={setupCode} onChange={(e) => setSetupCode(e.target.value)} />
            <p className="-mt-2 text-[13px] text-ink-muted">Works even if UID matching fails.</p>
          </div>

          <AdminPasswordFields idPrefix="owner" password={password} confirm={confirm} onPasswordChange={setPassword} onConfirmChange={setConfirm} disabled={working} />
          <Button type="button" variant="dark" size="lg" className="w-full" loading={working} onClick={submit} disabled={working}>
            {!working && <KeyRound size={16} aria-hidden="true" />} Create admin login
          </Button>
          <ProvisionStatus state={state} />
        </div>
      )}
    </div>
  )
}

export default OwnerBootstrap
