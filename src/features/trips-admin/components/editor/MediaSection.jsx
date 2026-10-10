import React from 'react'
import { Image as ImageIcon, Loader2, Plus, X } from 'lucide-react'
import Button from '../../../../components/ui/Button'
import { cn } from '../../../../lib/utils'
import { GALLERY_MAX, UPLOAD_PHASE_LABEL } from '../../lib/constants'
import { FieldGroup, FilePick, IconButton } from '../FormBits'
import UploadsNotice from './UploadsNotice'
import { useEditor } from './EditorContext'

const CoverField = () => {
  const { form, up, media } = useEditor()
  const busy = !!up.uploads.cover
  return (
    <FieldGroup label="Cover image" hint="Wide shot · card and trip page" error={!busy ? up.uploadErrors.cover : ''}>
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="flex h-36 w-full shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-line bg-paper sm:w-56">
          {form.coverImage
            ? <img src={form.coverImage} alt="Trip cover" className="h-full w-full object-cover" />
            : <ImageIcon size={30} className="text-marigold/60" aria-hidden="true" />}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <FilePick
            phase={up.uploads.cover}
            disabled={!up.uploadsConfigured}
            label={form.coverImage ? 'Replace cover' : 'Choose a cover'}
            onChange={media.uploadCover}
          />
          {form.coverImage && !busy && (
            <Button type="button" variant="ghost" size="sm" className="text-red-600 hover:bg-red-50 hover:text-red-700" onClick={media.removeCover} aria-label="Remove the cover image">
              Remove cover
            </Button>
          )}
        </div>
      </div>
    </FieldGroup>
  )
}

const GalleryField = () => {
  const { form, up, media } = useEditor()
  const gallery = form.gallery || []
  const blocked = up.galleryBusy || !up.uploadsConfigured
  return (
    <FieldGroup label="Gallery" hint={`${gallery.length}/${GALLERY_MAX} images`} error={!up.galleryBusy ? up.uploadErrors.gallery : ''}>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {gallery.map((src, i) => (
          <div key={`${src}-${i}`} className="relative h-28 overflow-hidden rounded-2xl border border-line bg-paper">
            <img src={src} alt={`Gallery ${i + 1}`} className="h-full w-full object-cover" />
            <IconButton
              tone="danger" aria-label={`Remove gallery image ${i + 1}`} onClick={() => media.removeGalleryImage(i)}
              className="absolute right-1.5 top-1.5 h-9 w-9 rounded-full border-0 bg-ink/70 text-white hover:bg-red-500 hover:text-white"
            >
              <X size={14} />
            </IconButton>
          </div>
        ))}
        {gallery.length < GALLERY_MAX && (
          <label className={cn(
            'flex h-28 flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed px-2 text-center transition-colors',
            blocked ? 'cursor-not-allowed border-line bg-paper opacity-70' : 'cursor-pointer border-marigold/50 bg-white hover:bg-saffron-50 focus-within:ring-2 focus-within:ring-saffron',
          )}>
            {up.galleryBusy ? <Loader2 className="animate-spin text-saffron" size={18} /> : <Plus className="text-saffron" size={20} />}
            <span className="text-[13px] font-semibold text-ink-soft">
              {up.galleryBusy ? (UPLOAD_PHASE_LABEL[up.uploads.gallery] || 'Uploading…') : 'Add images'}
            </span>
            {up.galleryBusy && up.galleryQueue?.total > 1 && (
              <span className="text-[12px] text-ink-muted">{up.galleryQueue.index} of {up.galleryQueue.total}</span>
            )}
            <input type="file" accept="image/*" multiple disabled={blocked} onChange={media.uploadGallery} className="sr-only" />
          </label>
        )}
      </div>
    </FieldGroup>
  )
}

const MediaSection = () => (
  <>
    <UploadsNotice />
    <CoverField />
    <GalleryField />
  </>
)

export default MediaSection
