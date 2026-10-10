import { useState } from 'react'
import { pickActiveEvent } from '../lib/events'
import { resolveAttendee, recordEntry, findApprovedStay, successMessage, duplicateMessage } from '../lib/verifyEntry'

/** Manual token check-in / prasadam. `result` drives the ALLOWED / DENIED card. */
export const useTokenVerification = ({ events, selectedEventId, mode }) => {
  const [token, setToken] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [result, setResult] = useState(null)

  const verify = async (e) => {
    e.preventDefault()
    const rawToken = token.trim()
    if (!rawToken) return
    setVerifying(true)
    setResult(null)
    try {
      // With the picker on "Auto-Detect Active Event", fall back to the best-guess event.
      const target = selectedEventId
        ? { id: selectedEventId, title: events.find((ev) => ev.id === selectedEventId)?.title }
        : pickActiveEvent(events)
      if (!target) throw new Error('No events available to mark attendance.')
      const eventId = target.id
      const title = target.title || 'Current Event'

      const found = await resolveAttendee(rawToken)
      if (!found) throw new Error('No registration or devotee found with this code.')
      const { devotee, registeredFor } = found
      const notice = registeredFor && registeredFor.eventId !== eventId
        ? `Note: Registered for "${registeredFor.title || 'another event'}"`
        : found.notice

      const duplicate = await recordEntry({ mode, eventId, title, devotee })
      if (duplicate) {
        setResult({ success: false, message: duplicateMessage(mode) })
        return
      }
      setResult({ success: true, message: successMessage(mode, title), devotee, notice, accommodation: await findApprovedStay(devotee.id) })
      setToken('')
    } catch (error) {
      console.error('Verification error:', error)
      setResult({ success: false, message: error.message })
    } finally {
      setVerifying(false)
    }
  }

  return { token, setToken, verifying, result, verify, dismiss: () => setResult(null) }
}
