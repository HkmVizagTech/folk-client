import React from 'react'
import { CheckCircle2, Heart, Plus, Sparkles } from 'lucide-react'
import { Button, Skeleton } from '../../components/ui'
import { EmptyState, Page, PageHeader, StatCard } from '../../components/common'
import { useAuth } from '../../hooks/useAuth'
import { isStaffRole } from './lib/seva'
import { useSevas } from './hooks/useSevas'
import { useSevaForm } from './hooks/useSevaForm'
import { useVolunteers } from './hooks/useVolunteers'
import SevaCard from './components/SevaCard'
import SevaFormModal from './components/SevaFormModal'
import VolunteerModal from './components/VolunteerModal'

const SevaPage = () => {
  const { user } = useAuth()
  const isStaff = isStaffRole(user)
  const seva = useSevas(user)
  const form = useSevaForm(user)
  const roster = useVolunteers()

  const addButton = <Button onClick={form.show}><Plus size={18} aria-hidden="true" /> Add seva</Button>

  return (
    <Page width="max-w-5xl" className="pb-10" revealKey={seva.loading}>
      <PageHeader
        kicker="Service"
        title="Seva portal"
        description="“Service is the highest form of worship.” Choose a seva, serve with devotion."
        actions={isStaff && addButton}
      />

      {seva.error && (
        <div role="alert" className="mb-5 flex items-center gap-3 rounded-2xl border border-red-100 bg-red-50 p-4">
          <p className="flex-1 text-[14px] font-semibold text-red-700">{seva.error}</p>
          <Button variant="ghost" size="sm" onClick={seva.clearError}>Dismiss</Button>
        </div>
      )}

      {seva.loading ? (
        <div className="grid gap-5 md:grid-cols-2">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-72 rounded-2xl" />)}</div>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
            <StatCard label="Open sevas" value={seva.sevas.length} icon={Sparkles} tone="saffron" />
            <StatCard label="Serving" value={seva.mine} icon={Heart} tone="maroon" />
            <StatCard label="Completed" value={seva.completed} icon={CheckCircle2} tone="green" className="col-span-2 sm:col-span-1" />
          </div>
          {seva.sevas.length === 0 ? (
            <EmptyState icon={Heart} title="No active sevas" description="Check back later for new opportunities to serve." action={isStaff && addButton} />
          ) : (
            <div className="grid gap-5 md:grid-cols-2">
              {seva.sevas.map((s) => (
                <SevaCard
                  key={s.id}
                  seva={s}
                  status={seva.statusOf(s.id)}
                  count={seva.countOf(s)}
                  isStaff={isStaff}
                  loading={seva.busy === s.id}
                  onJoin={() => seva.join(s)}
                  onLeave={() => seva.leave(s)}
                  onVolunteers={() => roster.load(s)}
                />
              ))}
            </div>
          )}
        </>
      )}

      <SevaFormModal open={form.open} form={form.form} onChange={form.change} onSubmit={form.submit} onClose={form.close} saving={form.saving} error={form.error} />
      <VolunteerModal seva={roster.seva} rows={roster.rows} loading={roster.loading} error={roster.error} onMark={roster.mark} onRetry={() => roster.load(roster.seva)} onClose={roster.close} />
    </Page>
  )
}

export default SevaPage
