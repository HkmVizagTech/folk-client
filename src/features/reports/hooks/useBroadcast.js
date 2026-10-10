import { useEffect, useMemo, useRef, useState } from 'react'
import { callApi } from '../../../lib/api'
import { normalizePhone } from '../../../lib/phone'

/** Audience, template values and send/copy actions for the WhatsApp broadcast form. */
export const useBroadcast = ({ members, me, isAdmin }) => {
  // `isAdmin` is false on the first render (auth restores asynchronously), so an
  // admin would stay stuck on "My members": apply the admin default when the
  // role arrives, unless the user has already picked something.
  const [audience, setAudience] = useState(isAdmin ? 'all' : 'mine')
  const touched = useRef(false)
  useEffect(() => {
    if (isAdmin && !touched.current) setAudience('all')
  }, [isAdmin])
  const chooseAudience = (value) => { touched.current = true; setAudience(value) }

  const [stage, setStage] = useState('new')
  const [templateId, setTemplateId] = useState('')
  const [params, setParams] = useState('')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState(null)

  const recipients = useMemo(() => {
    const base = audience === 'mine' ? members.filter((m) => m.guideId === me?.uid) : members
    return base.filter((m) => !m.isStaff && (audience !== 'stage' || m.stage === stage) && /^91\d{10}$/.test(normalizePhone(m.phone)))
  }, [audience, stage, members, me?.uid])

  const send = async (e) => {
    e.preventDefault()
    if (!templateId.trim()) return
    if (!window.confirm(`Send this WhatsApp template to ${recipients.length} people?`)) return
    setSending(true)
    setResult(null)
    try {
      const r = await callApi('broadcast', {
        audience: audience === 'stage' ? { type: 'stage', stage } : { type: audience },
        templateId: templateId.trim(),
        params: params.split('|').map((p) => p.trim()).filter(Boolean),
      })
      setResult({ tone: 'success', text: `Sent to ${r.sent} of ${r.total}${r.failed ? ` (${r.failed} failed)` : ''}.` })
    } catch (err) {
      setResult({ tone: 'error', text: err.message || 'Could not send the broadcast.' })
    } finally {
      setSending(false)
    }
  }

  const copyNumbers = async () => {
    const list = recipients.map((m) => `+${normalizePhone(m.phone)}`).join('\n')
    try {
      await navigator.clipboard.writeText(list)
      setResult({ tone: 'success', text: `Copied ${recipients.length} numbers.` })
    } catch {
      setResult({ tone: 'error', text: 'Could not copy. Your browser blocked clipboard access.' })
    }
  }

  return {
    audience, chooseAudience, stage, setStage, templateId, setTemplateId, params, setParams,
    sending, result, dismissResult: () => setResult(null), recipients, send, copyNumbers,
  }
}
