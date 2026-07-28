'use client'

/**
 * Edit profile — bottom sheet for name / studio / photo. Available everywhere
 * Your Cue shows an identity, not just during first-run. Anyone can open this
 * and change how Q refers to them, any time.
 */

import { useState } from 'react'
import { IconX } from '@tabler/icons-react'
import { saveProfile, type Profile } from '@/lib/profile'

export default function EditProfileSheet({
  initial,
  onClose,
  onSaved,
}: {
  initial: Profile | null
  onClose: () => void
  onSaved: (p: Profile) => void
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [studio, setStudio] = useState(initial?.studio ?? '')
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(initial?.photoDataUrl ?? null)

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setPhotoDataUrl(reader.result as string)
    reader.readAsDataURL(file)
  }

  function save() {
    const next: Profile = { name: name.trim() || 'You', studio: studio.trim(), photoDataUrl }
    saveProfile(next)
    onSaved(next)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0" style={{ backgroundColor: 'rgba(13,13,15,0.5)' }} />
      <div
        className="relative w-full max-w-lg bg-white rounded-t-3xl px-5 pt-5 pb-8 flex flex-col gap-4"
        onClick={e => e.stopPropagation()}
        style={{ paddingBottom: 'calc(32px + env(safe-area-inset-bottom))' }}
      >
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-ink">Edit your profile</p>
          <button onClick={onClose} aria-label="Close" className="p-1.5 text-stone hover:text-ink transition-colors">
            <IconX size={16} stroke={2} />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Your name"
            autoFocus
            className="w-full text-sm rounded-2xl px-4 py-3.5 bg-surface border-2 border-border text-ink placeholder:text-stone/60 outline-none focus:border-powder transition-colors"
          />
          <input
            value={studio}
            onChange={e => setStudio(e.target.value)}
            placeholder="Studio (optional) — e.g. Core40 SF"
            className="w-full text-sm rounded-2xl px-4 py-3.5 bg-surface border-2 border-border text-ink placeholder:text-stone/60 outline-none focus:border-powder transition-colors"
          />
          <label className="w-full flex items-center gap-3 rounded-2xl px-4 py-3.5 bg-surface border-2 border-border cursor-pointer">
            {photoDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoDataUrl} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
            ) : (
              <span className="w-9 h-9 rounded-full bg-border shrink-0" />
            )}
            <span className="text-sm font-semibold text-stone flex-1">
              {photoDataUrl ? 'Change photo' : 'Add a photo'}
            </span>
            {photoDataUrl && (
              <button
                type="button"
                onClick={e => { e.preventDefault(); setPhotoDataUrl(null) }}
                className="text-xs font-bold text-stone hover:text-ink transition-colors"
              >
                Remove
              </button>
            )}
            <input type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
          </label>
        </div>

        <button
          onClick={save}
          className="w-full h-12 rounded-2xl font-semibold text-sm transition-all active:opacity-80"
          style={{ backgroundColor: '#0D0D0F', color: '#AEC8F5' }}
        >
          Save
        </button>
      </div>
    </div>
  )
}
