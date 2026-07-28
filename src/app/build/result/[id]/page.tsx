'use client'

import { use, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useSession, signIn } from 'next-auth/react'
import { IconBrandSpotify, IconShare2, IconX, IconSearch, IconCheck, IconRefresh, IconPlayerPlay, IconPlayerPause } from '@tabler/icons-react'
import RoutineView from '@/components/RoutineView'
import type { Block, SavedRoutine, SlotDetail } from '@/types/routine'
import { initials, loadThreads, sendMessage, byEngagement, type Message } from '@/lib/instructors'
import { ensureAccount, loadFriends, sendDirectMessage, type Friend } from '@/lib/social'
import { isSocialConfigured } from '@/lib/supabaseClient'
import { loadProfile } from '@/lib/profile'
import { useUndoToast } from '@/components/Toast'

type ShareScope = 'routine' | 'both' | 'playlist'
type ShareTarget = { id: string; name: string; studio: string; avatarColor: string; photo?: string | null; kind: 'friend' | 'instructor' }

/** "Depeche Mode, Charli XCX & more" from the tracklist */
function playlistArtists(tracks: NonNullable<SavedRoutine['playlistTracks']>): string {
  const unique = [...new Set(tracks.map(t => t.artist))]
  const first = unique.slice(0, 2).join(', ')
  return unique.length > 2 ? `${first} & more` : first
}

/** Share sheet — real friends first (if connected), then most-engaged sample
 *  instructors, searchable, one tap to DM the routine. */
function ShareSheet({
  routine,
  friends,
  onClose,
  onShared,
}: {
  routine: SavedRoutine
  friends: Friend[]
  onClose: () => void
  onShared: (target: { id: string; name: string }) => void
}) {
  const [query, setQuery] = useState('')
  const hasPlaylist = !!routine.playlistTracks && routine.playlistTracks.length > 0
  const [scope, setScope] = useState<ShareScope>(hasPlaylist ? 'both' : 'routine')
  const friendTargets: ShareTarget[] = friends.map(f => ({
    id: f.id,
    name: f.name,
    studio: f.studio ?? 'Instructor',
    avatarColor: '#0D0D0F',
    photo: f.photoDataUrl,
    kind: 'friend',
  }))
  const instructorTargets: ShareTarget[] = byEngagement(loadThreads()).map(i => ({
    id: i.id,
    name: i.name,
    studio: i.studio,
    avatarColor: i.avatarColor,
    kind: 'instructor',
  }))
  const all = [...friendTargets, ...instructorTargets]
  const q = query.trim().toLowerCase()
  const results = q ? all.filter(t => t.name.toLowerCase().includes(q)) : all

  function share(target: ShareTarget) {
    const routineShare = scope !== 'playlist'
      ? { routineId: routine.id, name: routine.name, focus: routine.tldr.focus, minutes: routine.totalMinutes }
      : undefined
    const playlistShare = scope !== 'routine' && routine.playlistTracks
      ? {
          routineId: routine.id,
          name: routine.name,
          trackCount: routine.playlistTracks.length,
          artists: playlistArtists(routine.playlistTracks),
          spotifyUrl: routine.spotifyPlaylistUrl ?? null,
        }
      : undefined

    if (target.kind === 'friend') {
      sendDirectMessage(target.id, { routineShare, playlistShare })
    } else {
      const message: Message = { from: 'me', ts: Date.now(), routine: routineShare, playlist: playlistShare }
      sendMessage(target.id, message)
    }
    onShared({ id: target.id, name: target.name })
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0" style={{ backgroundColor: 'rgba(13,13,15,0.5)' }} />
      <div
        className="relative w-full max-w-lg bg-white rounded-t-3xl px-5 pt-5 pb-8 flex flex-col gap-4 overflow-y-auto"
        onClick={e => e.stopPropagation()}
        style={{
          paddingBottom: 'calc(32px + env(safe-area-inset-bottom))',
          maxHeight: 'min(85vh, 640px)',
        }}
      >
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-ink">Share this routine</p>
          <button onClick={onClose} aria-label="Close" className="p-1.5 text-stone hover:text-ink transition-colors">
            <IconX size={16} stroke={2} />
          </button>
        </div>

        {hasPlaylist && (
          <div className="flex gap-1.5">
            {([
              ['both', 'Routine + playlist'],
              ['routine', 'Routine only'],
              ['playlist', 'Playlist only'],
            ] as Array<[ShareScope, string]>).map(([value, label]) => (
              <button
                key={value}
                onClick={() => setScope(value)}
                className="text-xs font-bold rounded-full px-3.5 py-2 transition-colors"
                style={
                  scope === value
                    ? { backgroundColor: '#0D0D0F', color: '#AEC8F5' }
                    : { backgroundColor: '#FFFFFF', color: '#8A8A8A', boxShadow: 'inset 0 0 0 1px #E8E8E6' }
                }
              >
                {label}
              </button>
            ))}
          </div>
        )}

        <div className="relative">
          <IconSearch size={14} stroke={2} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone pointer-events-none" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search instructors…"
            className="w-full text-sm rounded-full pl-9 pr-4 py-2.5 bg-surface border border-border text-ink placeholder:text-stone/60 outline-none focus:border-powder transition-colors"
          />
        </div>

        <div className="flex flex-col gap-1 max-h-[300px] overflow-y-auto">
          {results.length === 0 && (
            <p className="text-xs text-stone text-center py-4">No one by that name.</p>
          )}
          {results.map(target => (
            <button
              key={`${target.kind}-${target.id}`}
              onClick={() => share(target)}
              className="flex items-center gap-3 rounded-2xl px-3 py-2.5 hover:bg-surface text-left transition-colors"
            >
              {target.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={target.photo} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
              ) : (
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                  style={{ backgroundColor: target.avatarColor }}
                >
                  <span
                    className="text-xs font-bold"
                    style={{ color: target.avatarColor === '#AEC8F5' ? '#0D0D0F' : '#FFFFFF' }}
                  >
                    {initials(target.name)}
                  </span>
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-ink truncate flex items-center gap-1.5">
                  {target.name}
                  {target.kind === 'friend' && (
                    <span
                      className="text-[8px] font-bold uppercase tracking-wide rounded-full px-1.5 py-0.5"
                      style={{ backgroundColor: '#AEC8F5', color: '#0D0D0F' }}
                    >
                      friend
                    </span>
                  )}
                </p>
                <p className="text-xs text-stone truncate">{target.studio}</p>
              </div>
              <span
                className="shrink-0 text-xs font-bold rounded-full px-3 py-1.5"
                style={{ backgroundColor: '#0D0D0F', color: '#AEC8F5' }}
              >
                Send
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function generateName(selectedSlots: SlotDetail[], savedAt: number): string {
  if (selectedSlots.length === 0) {
    const d = new Date(savedAt)
    return `Practice — ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
  }
  const slot = selectedSlots[0]
  const date = new Date(slot.date)
  const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return `${slot.slotLabel} — ${dateStr}`
}

export default function ViewRoutinePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ duplicate?: string }>
}) {
  const { id } = use(params)
  const { duplicate } = use(searchParams)
  const isDuplicate = duplicate === 'true'

  const router = useRouter()
  const [routine, setRoutine] = useState<SavedRoutine | null>(null)
  const [blocks, setBlocks] = useState<Block[]>([])
  const [openSwap, setOpenSwap] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [updated, setUpdated] = useState(false)
  const [sharing, setSharing] = useState(false)
  const [sharedWith, setSharedWith] = useState<{ id: string; name: string } | null>(null)
  const [friends, setFriends] = useState<Friend[]>([])
  const { toast, show: showToast } = useUndoToast(3000)

  useEffect(() => {
    if (isSocialConfigured()) {
      ensureAccount(loadProfile()).then(account => {
        if (account) loadFriends().then(setFriends)
      })
    }
  }, [])

  // Playlist generation after the fact — same API as the build flow
  const { data: session } = useSession()
  const [genOpen, setGenOpen] = useState(false)
  const [anchors, setAnchors] = useState('')
  const [genLoading, setGenLoading] = useState(false)
  const [genError, setGenError] = useState<string | null>(null)
  const [trackUris, setTrackUris] = useState<string[]>([])
  const [savingToSpotify, setSavingToSpotify] = useState(false)

  // In-app 30s previews (iTunes catalog — Spotify killed API previews)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const previewCache = useRef<Map<number, string | null>>(new Map())
  const [playingIndex, setPlayingIndex] = useState<number | null>(null)
  const [loadingPreview, setLoadingPreview] = useState<number | null>(null)

  useEffect(() => {
    return () => { audioRef.current?.pause() }
  }, [])

  async function handlePlayPause(index: number, track: { track: string; artist: string }) {
    if (playingIndex === index) {
      audioRef.current?.pause()
      setPlayingIndex(null)
      return
    }
    audioRef.current?.pause()
    let url = previewCache.current.get(index)
    if (url === undefined) {
      setLoadingPreview(index)
      try {
        const q = encodeURIComponent(`${track.artist} ${track.track}`)
        const res = await fetch(`https://itunes.apple.com/search?term=${q}&media=music&limit=1`)
        const data = await res.json()
        url = (data.results?.[0]?.previewUrl ?? null) as string | null
      } catch {
        url = null
      }
      previewCache.current.set(index, url)
      setLoadingPreview(null)
    }
    if (!url) return
    const audio = new Audio(url)
    audio.onended = () => setPlayingIndex(null)
    audio.play().catch(() => {})
    audioRef.current = audio
    setPlayingIndex(index)
  }

  useEffect(() => {
    try {
      const stored = localStorage.getItem('q_routines')
      if (!stored) { router.replace('/library'); return }
      const routines: SavedRoutine[] = JSON.parse(stored)
      const found = routines.find(r => r.id === Number(id))
      if (!found) { router.replace('/library'); return }
      setRoutine(found)
      setBlocks(found.blocks)
    } catch {
      router.replace('/library')
    }
  }, [id, router])

  function swapMove(bi: number, mi: number, newName: string) {
    setBlocks(prev => prev.map((block, b) =>
      b !== bi ? block : {
        ...block,
        moves: block.moves.map((move, m) =>
          m !== mi ? move : { ...move, name: newName }
        ),
      }
    ))
    setOpenSwap(null)
  }

  function handleUpdate() {
    if (!routine) return
    const updated: SavedRoutine = { ...routine, blocks }
    const existing: SavedRoutine[] = (() => {
      try { return JSON.parse(localStorage.getItem('q_routines') ?? '[]') } catch { return [] }
    })()
    localStorage.setItem('q_routines', JSON.stringify(existing.map(r => r.id === routine.id ? updated : r)))
    setUpdated(true)
    setTimeout(() => setUpdated(false), 2000)
    const mins = blocks.reduce((s, b) => s + b.moves.reduce((a, m) => a + (m.duration || 1), 0), 0)
    showToast(mins === 32 ? 'saved. 32 on the dot.' : `saved. ${mins} min — ${mins > 32 ? 'over' : 'under'} target.`)
  }

  /** Write a routine change through to localStorage + state */
  function persistRoutine(next: SavedRoutine) {
    const existing: SavedRoutine[] = (() => {
      try { return JSON.parse(localStorage.getItem('q_routines') ?? '[]') } catch { return [] }
    })()
    localStorage.setItem('q_routines', JSON.stringify(existing.map(r => r.id === next.id ? next : r)))
    setRoutine(next)
  }

  async function handleGeneratePlaylist() {
    if (!routine || genLoading) return
    if (!session?.accessToken || session.error) {
      signIn('spotify')
      return
    }
    setGenLoading(true)
    setGenError(null)
    try {
      const res = await fetch('/api/generate-playlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blocks,
          energyArc: routine.energyArc ?? '',
          emphasis: routine.selectedEmphasis.join(' + ') || 'Evenly distributed',
          vibe: routine.vibe || 'No specific vibe',
          artistAnchors: anchors,
        }),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error ?? `API error ${res.status}`)
      }
      const data = await res.json()
      interface GenTrack { block: string; songTitle: string; artist: string; trackName?: string; artistName?: string; albumArt?: string; trackUri?: string }
      persistRoutine({
        ...routine,
        spotifyPlaylistUrl: null, // old playlist link no longer matches the new tracks
        playlistTracks: (data.results as GenTrack[]).map(t => ({
          track: t.trackName ?? t.songTitle,
          artist: t.artistName ?? t.artist,
          block: t.block,
          albumArt: t.albumArt ?? null,
        })),
      })
      setTrackUris(data.trackUris ?? [])
      setGenOpen(false)
      showToast('playlist curated. give it a listen.')
    } catch (err) {
      setGenError(err instanceof Error ? err.message : 'Something went wrong. Try again.')
    } finally {
      setGenLoading(false)
    }
  }

  /** Stored routines only keep track/artist names — look the URIs back up on Spotify */
  async function resolveStoredUris(): Promise<string[]> {
    if (!routine?.playlistTracks || !session?.accessToken) return []
    const uris = await Promise.all(
      routine.playlistTracks.map(async t => {
        try {
          const q = encodeURIComponent(`${t.track} ${t.artist}`)
          const res = await fetch(`https://api.spotify.com/v1/search?q=${q}&type=track&limit=1`, {
            headers: { Authorization: `Bearer ${session.accessToken}` },
          })
          if (!res.ok) return null
          const data = await res.json()
          return (data.tracks?.items?.[0]?.uri ?? null) as string | null
        } catch {
          return null
        }
      })
    )
    return uris.filter((u): u is string => !!u)
  }

  async function handleSaveToSpotify() {
    if (!routine || savingToSpotify) return
    if (!session?.accessToken || session.error) {
      signIn('spotify')
      return
    }
    setSavingToSpotify(true)
    setGenError(null)
    try {
      let uris = trackUris
      if (uris.length === 0) {
        uris = await resolveStoredUris()
        if (uris.length === 0) throw new Error('Couldn’t match these tracks on Spotify. Try regenerating the playlist.')
        setTrackUris(uris)
      }
      const res = await fetch('/api/save-playlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackUris: uris, playlistName: `Q — ${routine.name}`, accessToken: session?.accessToken }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? `Error ${res.status}`)
      if (data.playlistUrl) {
        persistRoutine({ ...routine, spotifyPlaylistUrl: data.playlistUrl })
        window.open(data.playlistUrl, '_blank')
      }
      setTrackUris([])
    } catch (err) {
      setGenError(err instanceof Error ? err.message : 'Failed to save to Spotify. Try again.')
    } finally {
      setSavingToSpotify(false)
    }
  }

  function handleTeachAgain() {
    if (!routine) return
    localStorage.setItem('q_build_prefill', JSON.stringify({
      selectedClasses: routine.selectedClasses,
      selectedEmphasis: routine.selectedEmphasis,
      energyArc: routine.energyArc,
      vibe: routine.vibe,
      classLevel: routine.classLevel ?? null,
      moveNotes: routine.moveNotes ?? null,
    }))
    router.push('/build')
  }

  function handleSaveAsNew() {
    if (!routine || saving) return
    setSaving(true)
    const savedAt = Date.now()
    const name = generateName(routine.selectedSlots ?? [], savedAt)

    const newRoutine: SavedRoutine = {
      ...routine,
      id: savedAt,
      name,
      savedAt,
      blocks,
      favorited: false,
    }

    const existing: SavedRoutine[] = (() => {
      try { return JSON.parse(localStorage.getItem('q_routines') ?? '[]') } catch { return [] }
    })()
    localStorage.setItem('q_routines', JSON.stringify([...existing, newRoutine]))

    setSaved(true)
    setTimeout(() => router.push('/home'), 1100)
  }

  if (!routine) {
    return (
      <div className="flex items-center justify-center h-[calc(100dvh-72px)]">
        <p className="text-sm text-stone">Loading…</p>
      </div>
    )
  }

  return (
    <>
      {/* Back link */}
      <div className="px-5 pt-8 max-w-lg mx-auto w-full">
        <Link
          href="/library"
          className="text-xs font-medium text-stone hover:text-ink transition-colors"
        >
          ← Library
        </Link>
        <div className="flex items-center justify-between gap-3 mt-2">
          <p className="text-lg font-bold text-ink leading-snug min-w-0">
            {isDuplicate ? `${routine.name} — copy` : routine.name}
          </p>
          {!isDuplicate && (
            <div className="shrink-0 flex items-center gap-2">
              <button
                onClick={() => setSharing(true)}
                aria-label="Share routine"
                className="w-9 h-9 rounded-full flex items-center justify-center border border-border text-ink active:opacity-80 transition-opacity"
              >
                <IconShare2 size={16} stroke={2} />
              </button>
              <Link
                href={`/teach/${routine.id}`}
                className="flex items-center gap-1.5 text-sm font-bold rounded-full px-4 py-2 active:opacity-80 transition-opacity"
                style={{ backgroundColor: '#0D0D0F', color: '#AEC8F5' }}
              >
                ▶ Teach
              </Link>
            </div>
          )}
        </div>
      </div>

      {sharing && (
        <ShareSheet
          routine={{ ...routine, blocks }}
          friends={friends}
          onClose={() => setSharing(false)}
          onShared={target => {
            setSharing(false)
            setSharedWith(target)
            setTimeout(() => setSharedWith(null), 4000)
          }}
        />
      )}

      {toast}

      {sharedWith && (
        <div
          role="status"
          className="fixed left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 rounded-full pl-4 pr-2 py-2 shadow-lg"
          style={{ bottom: '88px', backgroundColor: '#0D0D0F', maxWidth: 'calc(100vw - 40px)' }}
        >
          <IconCheck size={14} stroke={2.5} style={{ color: '#AEC8F5' }} className="shrink-0" />
          <span className="text-xs font-semibold text-white whitespace-nowrap overflow-hidden text-ellipsis">
            Shared with {sharedWith.name.split(' ')[0]}
          </span>
          <Link
            href={`/messages?to=${sharedWith.id}`}
            className="shrink-0 text-xs font-bold rounded-full px-3 py-1.5"
            style={{ backgroundColor: '#AEC8F5', color: '#0D0D0F' }}
          >
            View
          </Link>
        </div>
      )}

      <RoutineView
        classOpener={routine.classOpener}
        tldr={routine.tldr}
        totalMinutes={routine.totalMinutes}
        builtToOrder={routine.builtToOrder}
        blocks={blocks}
        openSwap={openSwap}
        onOpenSwap={setOpenSwap}
        onSwapMove={swapMove}
        onUpdateBlocks={setBlocks}
        footer={
          isDuplicate ? (
            <button
              onClick={handleSaveAsNew}
              disabled={saving}
              className={`w-full h-14 rounded-2xl font-semibold text-base transition-all active:opacity-80 disabled:opacity-80 ${
                saved ? 'bg-moss text-canvas' : 'bg-forest text-canvas'
              }`}
            >
              {saved ? 'Saved' : 'Save as new routine'}
            </button>
          ) : (
            <div className="flex flex-col gap-3">
              {/* Generate panel — shown for routines without a playlist, or when regenerating */}
              {(genOpen || !routine.playlistTracks || routine.playlistTracks.length === 0) && (
                <div className="mb-2 rounded-2xl border border-border bg-white p-4 flex flex-col gap-3">
                  <div>
                    <p className="text-sm font-bold text-ink">
                      {routine.playlistTracks?.length ? 'New playlist for this routine' : 'No playlist yet.'}
                    </p>
                    <p className="text-xs text-stone mt-0.5">
                      Q curates a DJ-style set mapped to this routine&apos;s energy arc.
                    </p>
                  </div>
                  <input
                    value={anchors}
                    onChange={e => setAnchors(e.target.value)}
                    placeholder="Anchor artists (optional) — e.g. Charli XCX, Depeche Mode"
                    className="w-full text-sm rounded-full px-4 py-2.5 bg-surface border border-border text-ink placeholder:text-stone/60 outline-none focus:border-powder transition-colors"
                  />
                  <button
                    onClick={handleGeneratePlaylist}
                    disabled={genLoading}
                    className="w-full h-12 rounded-2xl font-semibold text-sm transition-all active:opacity-80 disabled:opacity-60"
                    style={{ backgroundColor: '#0D0D0F', color: '#AEC8F5' }}
                  >
                    {genLoading
                      ? 'Q is curating…'
                      : session?.accessToken && !session.error
                        ? 'Generate playlist'
                        : session?.error
                          ? 'Reconnect Spotify — session expired'
                          : 'Connect Spotify to generate'}
                  </button>
                  {genError && <p className="text-xs" style={{ color: '#C24B37' }}>{genError}</p>}
                </div>
              )}

              {/* One-tap save into the user's Spotify — works for freshly generated
                  AND older stored playlists (URIs get looked back up on demand) */}
              {(routine.playlistTracks?.length ?? 0) > 0 && !routine.spotifyPlaylistUrl && (
                <button
                  onClick={handleSaveToSpotify}
                  disabled={savingToSpotify}
                  className="w-full h-12 rounded-2xl font-semibold text-sm border-2 flex items-center justify-center gap-2 transition-all active:opacity-80 disabled:opacity-60"
                  style={{ borderColor: '#1DB954', color: '#1DB954' }}
                >
                  <IconBrandSpotify size={16} stroke={1.5} />
                  {savingToSpotify
                    ? 'Saving…'
                    : session?.accessToken && !session.error
                      ? 'Save playlist to Spotify'
                      : session?.error
                        ? 'Reconnect Spotify — session expired'
                        : 'Connect Spotify to save this playlist'}
                </button>
              )}

              {routine.playlistTracks && routine.playlistTracks.length > 0 && (
                <div className="mb-2">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[11px] font-bold tracking-[0.14em] text-stone uppercase">
                      The playlist
                    </p>
                    <button
                      onClick={() => setGenOpen(o => !o)}
                      className="flex items-center gap-1 text-[11px] font-bold text-stone hover:text-ink transition-colors"
                    >
                      <IconRefresh size={12} stroke={2.5} />
                      {genOpen ? 'Cancel' : 'New playlist'}
                    </button>
                  </div>
                  <div className="rounded-2xl border border-border overflow-hidden">
                    {routine.playlistTracks.map((t, i) => (
                      <div
                        key={`${t.track}-${i}`}
                        className={`flex items-center gap-3 px-4 py-3 bg-white ${
                          i > 0 ? 'border-t border-border' : ''
                        }`}
                      >
                        {/* in-app 30s preview */}
                        <button
                          onClick={() => handlePlayPause(i, t)}
                          aria-label={playingIndex === i ? `Pause ${t.track}` : `Play a preview of ${t.track}`}
                          className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 active:scale-95 transition-transform disabled:opacity-50"
                          disabled={loadingPreview === i}
                          style={{ backgroundColor: '#AEC8F5', color: '#0D0D0F' }}
                        >
                          {loadingPreview === i ? (
                            <span className="text-[9px] font-bold">…</span>
                          ) : playingIndex === i ? (
                            <IconPlayerPause size={14} stroke={2} />
                          ) : (
                            <IconPlayerPlay size={14} stroke={2} />
                          )}
                        </button>
                        {t.albumArt ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={t.albumArt}
                            alt=""
                            className="w-9 h-9 rounded-lg object-cover shrink-0 grayscale"
                          />
                        ) : (
                          <div
                            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                            style={{ backgroundColor: '#0D0D0F' }}
                          >
                            <span className="text-xs font-bold" style={{ color: '#AEC8F5' }}>
                              {t.artist.charAt(0)}
                            </span>
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-ink truncate">{t.track}</p>
                          <p className="text-xs text-stone truncate">{t.artist}</p>
                        </div>
                        <span className="shrink-0 text-[10px] font-semibold text-stone uppercase tracking-wide">
                          {t.block}
                        </span>
                        {/* the exact song on Spotify */}
                        <a
                          href={`https://open.spotify.com/search/${encodeURIComponent(`${t.track} ${t.artist}`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Open ${t.track} on Spotify`}
                          className="shrink-0 p-1"
                          style={{ color: '#1DB954' }}
                        >
                          <IconBrandSpotify size={16} stroke={1.5} />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {routine.spotifyPlaylistUrl && (
                <a
                  href={routine.spotifyPlaylistUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full h-14 rounded-2xl font-semibold text-base border-2 flex items-center justify-center gap-2 transition-all active:opacity-80"
                  style={{ borderColor: '#1DB954', color: '#1DB954' }}
                >
                  <IconBrandSpotify size={18} stroke={1.5} />
                  Open playlist in Spotify
                </a>
              )}
              <button
                onClick={handleUpdate}
                className={`w-full h-14 rounded-2xl font-semibold text-base border-2 border-forest transition-all active:opacity-80 ${
                  updated ? 'bg-forest text-canvas' : 'bg-canvas text-forest'
                }`}
              >
                {updated ? 'Routine updated ✓' : 'Update routine'}
              </button>
              <button
                onClick={handleTeachAgain}
                className="w-full h-14 rounded-2xl font-semibold text-base bg-forest text-canvas transition-all active:opacity-80"
              >
                Build again from this
              </button>
            </div>
          )
        }
      />
    </>
  )
}
