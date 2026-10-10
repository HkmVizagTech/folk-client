import React, { useRef } from 'react'
import { Camera, Edit2, Loader2, LogOut, Save, X } from 'lucide-react'
import { Badge, Button } from '../../../components/ui'
import { getSafeProfileImage } from '../../../lib/imageUtils'
import { cn } from '../../../lib/utils'

const ProfileHeader = ({ name, image, qrToken, role, isEditing, saving, uploading, onEdit, onSave, onCancel, onLogout, onPickFile }) => {
  const fileRef = useRef(null)
  const pick = () => {
    if (!isEditing) onEdit()
    setTimeout(() => fileRef.current?.click(), 100)
  }

  return (
    <section data-reveal className="relative overflow-hidden rounded-3xl border border-line/80 bg-white shadow-card">
      <div className="hero-devotional h-28 sm:h-36" aria-hidden="true" />
      <div className="absolute right-4 top-4 flex gap-2 sm:right-6 sm:top-6">
        {isEditing ? (
          <>
            <Button variant="secondary" size="sm" onClick={onCancel}><X size={16} aria-hidden="true" /> Cancel</Button>
            <Button size="sm" onClick={onSave} loading={saving}><Save size={16} aria-hidden="true" /> Save</Button>
          </>
        ) : (
          <>
            <Button variant="secondary" size="sm" onClick={onEdit}><Edit2 size={16} aria-hidden="true" /> Edit</Button>
            <Button variant="secondary" size="icon" onClick={onLogout} aria-label="Log out" className="h-9 w-9"><LogOut size={16} aria-hidden="true" /></Button>
          </>
        )}
      </div>

      <div className="flex flex-col items-center px-5 pb-7 text-center sm:flex-row sm:items-end sm:gap-6 sm:px-8 sm:text-left">
        <button
          type="button"
          onClick={pick}
          aria-label="Change profile photo"
          className={cn('group relative -mt-14 h-28 w-28 shrink-0 overflow-hidden rounded-full border-4 border-white bg-paper shadow-premium-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron sm:-mt-16 sm:h-36 sm:w-36', isEditing && 'ring-4 ring-saffron/30')}
        >
          <img src={getSafeProfileImage(image, name)} alt="" className="h-full w-full object-cover" />
          {uploading && <span className="absolute inset-0 flex items-center justify-center bg-ink/40"><Loader2 className="animate-spin text-white" size={28} aria-hidden="true" /></span>}
          {isEditing && !uploading && <span className="absolute inset-0 flex items-center justify-center bg-ink/30 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"><Camera className="text-white" size={28} aria-hidden="true" /></span>}
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { onPickFile(e.target.files?.[0]); e.target.value = '' }} />

        <div className="mt-4 min-w-0 sm:pb-1">
          <h1 className="user-text font-display text-[26px] font-semibold leading-tight text-navy sm:text-[32px]">{name || 'Your name'}</h1>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <Badge>ID {qrToken?.substring(0, 8).toUpperCase() || 'NEW-USER'}</Badge>
            <Badge tone={role === 'admin' ? 'danger' : 'saffron'} className="capitalize">{role || 'Devotee'}</Badge>
          </div>
        </div>
      </div>
    </section>
  )
}

export default ProfileHeader
