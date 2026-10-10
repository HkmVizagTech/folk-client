import React from 'react'
import { ChevronDown, ChevronUp, Image as ImageIcon, Loader2, MapPin, Plus, Trash2 } from 'lucide-react'
import { Input, Textarea } from '../../../../components/ui/Field'
import Button from '../../../../components/ui/Button'
import EmptyState from '../../../../components/common/EmptyState'
import { cn } from '../../../../lib/utils'
import { FilePick, IconButton, InfoNote, UploadStatus } from '../FormBits'
import UploadsNotice from './UploadsNotice'
import { useEditor } from './EditorContext'

const LocationRow = ({ row, index, count }) => {
  const { up, locations } = useEditor()
  const slotKey = `loc:${row.id}`
  const phase = up.uploads[slotKey]
  const expanded = locations.openId === row.id
  const rowName = row.name || `place ${index + 1}`

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-paper/60">
      <div className="flex items-center gap-2 p-2.5">
        <button
          type="button" aria-expanded={expanded} aria-label={`${expanded ? 'Collapse' : 'Edit'} ${rowName}`}
          onClick={() => locations.setOpenId(expanded ? null : row.id)}
          className="flex min-h-[44px] min-w-0 flex-1 items-center gap-3 rounded-xl px-1 text-left transition-colors hover:bg-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-line bg-white">
            {row.image ? <img src={row.image} alt="" className="h-full w-full object-cover" />
              : phase ? <Loader2 size={14} className="animate-spin text-saffron" />
              : <MapPin size={14} className="text-marigold" />}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[12px] font-semibold uppercase tracking-label text-ink-muted">Stop {index + 1}</span>
            <span className="block truncate text-[15px] font-semibold text-ink user-text">{row.name || 'Untitled place'}</span>
          </span>
          <ChevronDown size={16} className={cn('shrink-0 text-ink-muted transition-transform', expanded && 'rotate-180')} />
        </button>
        <div className="flex shrink-0 gap-1">
          <IconButton aria-label={`Move ${rowName} up`} disabled={index === 0} onClick={() => locations.move(index, -1)}><ChevronUp size={16} /></IconButton>
          <IconButton aria-label={`Move ${rowName} down`} disabled={index === count - 1} onClick={() => locations.move(index, 1)}><ChevronDown size={16} /></IconButton>
          <IconButton tone="danger" aria-label={`Remove ${rowName}`} onClick={() => locations.remove(index)}><Trash2 size={15} /></IconButton>
        </div>
      </div>

      {expanded && (
        <div className="space-y-3 border-t border-line p-3">
          <Input value={row.name} placeholder="Govardhan Hill" aria-label={`Name of place ${index + 1}`} onChange={(e) => locations.update(index, 'name', e.target.value)} />
          <Textarea
            rows={2} value={row.description} aria-label={`Description of place ${index + 1}`}
            placeholder="The sacred hill Krishna lifted — devotees do the parikrama barefoot."
            onChange={(e) => locations.update(index, 'description', e.target.value)} className="min-h-[72px] resize-none"
          />
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="flex h-24 w-full shrink-0 items-center justify-center overflow-hidden rounded-xl border border-line bg-white sm:w-36">
              {row.image ? <img src={row.image} alt={`Photo of ${rowName}`} className="h-full w-full object-cover" /> : <ImageIcon size={22} className="text-marigold/60" />}
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <FilePick compact phase={phase} disabled={!up.uploadsConfigured} label={row.image ? 'Replace photo' : 'Add a photo'} onChange={(e) => locations.uploadImage(index, e)} />
              {row.image && !phase && (
                <Button type="button" variant="ghost" size="sm" className="text-red-600 hover:bg-red-50 hover:text-red-700" aria-label={`Remove the photo of ${rowName}`} onClick={() => locations.removeImage(index)}>
                  Remove photo
                </Button>
              )}
              <UploadStatus phase={phase} error={up.uploadErrors[slotKey]} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const LocationsSection = () => {
  const { form, locations } = useEditor()
  const rows = form.locations || []

  return (
    <>
      <UploadsNotice />
      <InfoNote>
        The places this yatra visits — Govardhan Hill, Radha Kund, Keshi Ghat — each with its own photo and a line or two. The
        arrows set the order devotees see them in.
      </InfoNote>

      {rows.length === 0 ? (
        <EmptyState icon={MapPin} title="No places yet" description="Add the first stop of this yatra." className="py-8" />
      ) : (
        <div className="flex items-center justify-between gap-3">
          <p className="text-[13px] font-semibold text-ink-muted">{rows.length} place{rows.length === 1 ? '' : 's'}</p>
          {locations.openId && <Button type="button" variant="ghost" size="sm" onClick={() => locations.setOpenId(null)}>Collapse all</Button>}
        </div>
      )}

      <div className="space-y-3">
        {rows.map((row, i) => <LocationRow key={row.id} row={row} index={i} count={rows.length} />)}
      </div>

      <Button type="button" variant="soft" className="w-full" onClick={locations.add}><Plus size={16} /> Add place</Button>
    </>
  )
}

export default LocationsSection
