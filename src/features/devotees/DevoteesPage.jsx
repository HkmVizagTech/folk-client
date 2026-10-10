import React, { useMemo, useState } from 'react'
import { Download, Plus } from 'lucide-react'
import { Page, PageHeader } from '../../components/common'
import { Button } from '../../components/ui'
import { useAuth } from '../../hooks/useAuth'
import { useFirestore } from '../../hooks/useFirestore'
import { Alert } from '../staff-common/components'
import { useDevoteeActions } from './hooks/useDevoteeActions'
import { filterDevotees, summarize } from './lib/filters'
import { exportDevotees } from './lib/exportDevotees'
import DevoteeStats from './components/DevoteeStats'
import DevoteeToolbar from './components/DevoteeToolbar'
import DevoteeGrid from './components/DevoteeGrid'
import DevoteeFormModal from './components/DevoteeFormModal'
import QrPassModal from './components/QrPassModal'

const DevoteesPage = () => {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const { data: devotees, loading } = useFirestore('users')
  const actions = useDevoteeActions({ isAdmin })

  const [search, setSearch] = useState('')
  const [role, setRole] = useState('All')
  const [form, setForm] = useState(null) // null = closed, { devotee } = open (devotee null = new)
  const [qrFor, setQrFor] = useState(null)

  const filtered = useMemo(() => filterDevotees(devotees, role, search), [devotees, role, search])
  const summary = useMemo(() => summarize(devotees), [devotees])

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this devotee?')) await actions.remove(id)
  }

  const handleQr = async (devotee) => {
    const qrToken = await actions.generateQrToken(devotee)
    if (qrToken) setQrFor({ ...devotee, qrToken })
  }

  return (
    <Page width="max-w-7xl" className="pb-10" revealKey={loading}>
      <PageHeader
        kicker="Staff"
        title="Devotee management"
        description="Manage all registered devotees and their permissions."
        actions={<>
          <Button variant="secondary" onClick={() => exportDevotees(filtered)} disabled={filtered.length === 0}><Download size={18} aria-hidden="true" /> Export</Button>
          <Button onClick={() => setForm({ devotee: null })}><Plus size={18} aria-hidden="true" /> Add devotee</Button>
        </>}
      />

      {actions.pageError && <Alert className="mb-6" onDismiss={actions.clearError}>{actions.pageError}</Alert>}

      <DevoteeStats summary={summary} />
      <DevoteeToolbar search={search} onSearch={setSearch} role={role} onRole={setRole} shown={filtered.length} total={devotees.length} />
      <DevoteeGrid devotees={filtered} loading={loading} canDelete={isAdmin} onQr={setQrFor} onEdit={(devotee) => setForm({ devotee })} onDelete={handleDelete} />

      {form && <DevoteeFormModal devotee={form.devotee} isAdmin={isAdmin} onSubmit={(values) => actions.save(values, form.devotee)} onClose={() => setForm(null)} />}
      <QrPassModal devotee={qrFor} onClose={() => setQrFor(null)} onGenerate={handleQr} />
    </Page>
  )
}

export default DevoteesPage
