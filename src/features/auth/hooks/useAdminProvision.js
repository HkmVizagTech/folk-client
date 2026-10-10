import { useState } from 'react'
import { provisionAdminLogin, validateAdminPassword } from '../../../lib/adminLogin'

/**
 * Create / reset the shared admin login. `withSetupCode` adds the server's
 * ADMIN_SETUP_CODE field (site-owner bootstrap on the access notice).
 */
export const useAdminProvision = ({ withSetupCode = false, workingMessage, doneSuffix = '' }) => {
  const [state, setState] = useState({ status: 'idle', message: '' })
  const [setupCode, setSetupCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')

  const submit = async () => {
    const problem = validateAdminPassword(password, confirm)
    if (problem) {
      setState({ status: 'error', message: problem })
      return
    }
    setState({ status: 'working', message: workingMessage })
    try {
      const message = await provisionAdminLogin(withSetupCode ? { password, setupCode } : { password })
      setPassword('')
      setConfirm('')
      setSetupCode('')
      setState({ status: 'done', message: `${message}${doneSuffix}` })
    } catch (error) {
      console.error('createAdmin failed:', error)
      // The server's message is already human-readable - show it verbatim.
      setState({ status: 'error', message: error?.message || 'Failed to create admin login' })
    }
  }

  return { state, working: state.status === 'working', password, setPassword, confirm, setConfirm, setupCode, setSetupCode, submit }
}
