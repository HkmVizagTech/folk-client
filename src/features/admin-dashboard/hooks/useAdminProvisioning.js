import { useState } from 'react'
import { provisionAdminLogin, validateAdminPassword } from '../../../lib/adminLogin'

/** Form state + submit for creating/resetting the shared admin login. The password is sent once and never read back. */
export const useAdminProvisioning = () => {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [state, setState] = useState({ status: 'idle', message: '' })

  const submit = async () => {
    const problem = validateAdminPassword(password, confirm)
    if (problem) {
      setState({ status: 'error', message: problem })
      return
    }
    setState({ status: 'working', message: 'Setting up the shared admin login…' })
    try {
      const message = await provisionAdminLogin({ password })
      setPassword('')
      setConfirm('')
      setState({ status: 'done', message })
    } catch (error) {
      console.error('createAdmin failed:', error)
      setState({ status: 'error', message: error?.message || 'Failed to create admin login' })
    }
  }

  return { password, confirm, setPassword, setConfirm, state, submit }
}
