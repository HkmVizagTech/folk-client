import React from 'react'
import { CheckCircle2, Loader2 } from 'lucide-react'
import Modal from '../../../../components/ui/Modal'
import Button from '../../../../components/ui/Button'
import Tabs from '../../../../components/ui/Tabs'
import { cn } from '../../../../lib/utils'
import { MODAL_SECTIONS } from '../../lib/sections'
import Alert from '../Alert'
import { EditorContext } from './EditorContext'
import BasicsSection from './BasicsSection'
import PricingSection from './PricingSection'
import MediaSection from './MediaSection'
import ItinerarySection from './ItinerarySection'
import LocationsSection from './LocationsSection'
import InclusionsSection from './InclusionsSection'

const FORM_ID = 'trip-editor-form'

const SECTIONS = {
  basics: BasicsSection,
  dates: PricingSection,
  media: MediaSection,
  itinerary: ItinerarySection,
  locations: LocationsSection,
  inclusions: InclusionsSection,
}

/** Create / edit dialog. `editor` is the object returned by useTripForm. */
const TripEditor = ({ editor }) => {
  const { open, close, editingId, section, setSection, showErrors, sectionErrors, hasErrors, errors, saveError, saving, form, up, submit } = editor
  const Active = SECTIONS[section]
  const busy = saving || up.uploadsBusy

  const footer = (
    <div className="flex w-full flex-col items-stretch gap-3 sm:flex-row sm:items-center">
      <p className="min-w-0 flex-1 truncate text-[13px] text-ink-muted sm:text-left">
        {up.uploadsBusy
          ? <span className="inline-flex items-center gap-1.5 font-semibold text-saffron-dark"><Loader2 size={13} className="animate-spin" /> Uploading images…</span>
          : <span className="font-mono">/trip/{form.slug || '…'}</span>}
      </p>
      <Button type="button" variant="secondary" onClick={close} disabled={busy}>Cancel</Button>
      <Button type="submit" form={FORM_ID} disabled={busy} loading={saving || up.uploadsBusy}>
        {!busy && <CheckCircle2 size={18} />}
        {saving ? 'Saving…' : up.uploadsBusy ? 'Uploading…' : editingId ? 'Save changes' : 'Create trip'}
      </Button>
    </div>
  )

  return (
    <EditorContext.Provider value={editor}>
      <Modal
        open={open}
        onClose={close}
        size="lg"
        title={editingId ? 'Edit trip' : 'New trip'}
        description={editingId ? 'Update what devotees see on the yatra page.' : 'Set up a pilgrimage devotees can browse and register for.'}
        footer={footer}
      >
        <Tabs value={section} onValueChange={setSection}>
          <Tabs.List className="mb-5 w-full">
            {MODAL_SECTIONS.map((s) => {
              const Icon = s.icon
              return (
                <Tabs.Trigger key={s.key} value={s.key} className="relative inline-flex items-center gap-1.5">
                  <Icon size={14} aria-hidden="true" /> {s.label}
                  {showErrors && sectionErrors[s.key] && (
                    <span className={cn('absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-red-500')} aria-label="Has errors" />
                  )}
                </Tabs.Trigger>
              )
            })}
          </Tabs.List>
        </Tabs>

        <form id={FORM_ID} onSubmit={submit} className="space-y-5" noValidate>
          <Active />
          {showErrors && hasErrors && <Alert>{Object.values(errors)[0]}</Alert>}
          {saveError && <Alert>{saveError}</Alert>}
        </form>
      </Modal>
    </EditorContext.Provider>
  )
}

export default TripEditor
