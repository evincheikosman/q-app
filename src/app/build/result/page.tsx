'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useSession, signIn } from 'next-auth/react'
import { IconBrandSpotify, IconPlayerPlay, IconPlayerPause } from '@tabler/icons-react'
import RoutineView from '@/components/RoutineView'
import QMarkLoader from '@/components/QMarkLoader'
import type { Block, SlotDetail, SavedRoutine } from '@/types/routine'

interface TempRoutine {
  classOpener: string
  tldr: { focus: string; whereTheyWillFeelIt: string; note: string }
  totalMinutes: number
  blocks: Block[]
  selectedClasses: string[]
  selectedSlots: SlotDetail[]
  energyArc: string | null
  selectedEmphasis: string[]
  vibe: string
  classLevel?: string | null
  moveNotes?: string | null
  builtToOrder?: string[]
}

interface PlaylistTrack {
  block: string
  songTitle: string
  artist: string
  rationale: string
  trackUri?: string
  trackName?: string
  artistName?: string
  albumArt?: string
  previewUrl?: string | null
  spotifyUrl?: string
  searchError?: string
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

export default function ResultPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [temp, setTemp] = useState<TempRoutine | null>(null)
  const [blocks, setBlocks] = useState<Block[]>([])
  const [openSwap, setOpenSwap] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [artistAnchors, setArtistAnchors] = useState('')
  const [playlistLoading, setPlaylistLoading] = useState(false)
  const [playlist, setPlaylist] = useState<PlaylistTrack[] | null>(null)
  const [playlistError, setPlaylistError] = useState<string | null>(null)
  const [trackUris, setTrackUris] = useState<string[]>([])
  const [savingToSpotify, setSavingToSpotify] = useState(false)
  const [savedToSpotify, setSavedToSpotify] = useState(false)
  const [spotifyPlaylistUrl, setSpotifyPlaylistUrl] = useState<string | null>(null)
  const [spotifyError, setSpotifyError] = useState<string | null>(null)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [playingIndex, setPlayingIndex] = useState<number | null>(null)
  const [loadingPreview, setLoadingPreview] = useState<number | null>(null)
  const [noPreview, setNoPreview] = useState<Set<number>>(new Set())

  useEffect(() => {
    const stored = localStorage.getItem('q_routine')
    if (!stored) { router.replace('/build'); return }
    try {
      const r: TempRoutine = JSON.parse(stored)
      setTemp(r)
      setBlocks(r.blocks)
    } catch {
      router.replace('/build')
    }
  }, [router])

  useEffect(() => {
    return () => { audioRef.current?.pause() }
  }, [])

  /** Spotify removed 30s previews from its API for most apps — when a track has
   *  no previewUrl, fall back to the same song's preview from the iTunes catalog. */
  async function resolvePreview(track: PlaylistTrack): Promise<string | null> {
    if (track.previewUrl) return track.previewUrl
    try {
      const q = encodeURIComponent(
        `${track.artistName ?? track.artist} ${track.trackName ?? track.songTitle}`
      )
      const res = await fetch(`https://itunes.apple.com/search?term=${q}&media=music&limit=1`)
      const data = await res.json()
      return data.results?.[0]?.previewUrl ?? null
    } catch {
      return null
    }
  }

  async function handlePlayPause(index: number, track: PlaylistTrack) {
    if (playingIndex === index) {
      audioRef.current?.pause()
      setPlayingIndex(null)
      return
    }
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.onended = null
    }
    setLoadingPreview(index)
    const url = await resolvePreview(track)
    setLoadingPreview(null)
    if (!url) {
      setNoPreview(prev => new Set(prev).add(index))
      return
    }
    // cache it so replays are instant
    setPlaylist(prev =>
      prev ? prev.map((t, i) => (i === index ? { ...t, previewUrl: url } : t)) : prev
    )
    const audio = new Audio(url)
    audio.onended = () => setPlayingIndex(null)
    audio.play().catch(() => {})
    audioRef.current = audio
    setPlayingIndex(index)
  }

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

  function handleSave() {
    if (!temp || saving) return
    setSaving(true)
    const savedAt = Date.now()
    const name = generateName(temp.selectedSlots ?? [], savedAt)

    const savedRoutine: SavedRoutine = {
      id: savedAt,
      name,
      savedAt,
      selectedClasses: temp.selectedClasses ?? [],
      selectedSlots: temp.selectedSlots ?? [],
      energyArc: temp.energyArc ?? null,
      selectedEmphasis: temp.selectedEmphasis ?? [],
      vibe: temp.vibe ?? '',
      classLevel: temp.classLevel ?? null,
      moveNotes: temp.moveNotes ?? null,
      builtToOrder: temp.builtToOrder ?? [],
      favorited: false,
      classOpener: temp.classOpener,
      tldr: temp.tldr,
      totalMinutes: temp.totalMinutes,
      blocks,
      spotifyPlaylistUrl: spotifyPlaylistUrl || null,
      playlistTracks: playlist?.map(t => ({
        track: t.trackName ?? t.songTitle,
        artist: t.artistName ?? t.artist,
        block: t.block,
        albumArt: t.albumArt ?? null,
      })) ?? [],
    }

    const existing: SavedRoutine[] = (() => {
      try { return JSON.parse(localStorage.getItem('q_routines') ?? '[]') } catch { return [] }
    })()
    localStorage.setItem('q_routines', JSON.stringify([...existing, savedRoutine]))

    setSaved(true)
    setTimeout(() => router.push('/home'), 1100)
  }

  async function handleGeneratePlaylist() {
    if (!temp || !session?.accessToken) return
    audioRef.current?.pause()
    setPlayingIndex(null)
    setPlaylistLoading(true)
    setPlaylistError(null)
    setPlaylist(null)
    setSavedToSpotify(false)
    setSpotifyPlaylistUrl(null)
    setSpotifyError(null)

    try {
      console.log('[Generate Playlist] accessToken:', session?.accessToken ?? 'MISSING')
      const res = await fetch('/api/generate-playlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blocks,
          energyArc: temp.energyArc ?? '',
          emphasis: temp.selectedEmphasis.join(' + ') || 'Evenly distributed',
          vibe: temp.vibe || 'No specific vibe',
          artistAnchors,
          accessToken: session.accessToken,
        }),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error ?? `API error ${res.status}`)
      }
      const data = await res.json()
      console.log('[Playlist] received:', data)
      setPlaylist(data.results)
      setTrackUris(data.trackUris ?? [])
      const failed = (data.results as PlaylistTrack[]).filter(t => t.searchError)
      if (failed.length > 0) {
        console.warn('[Playlist] Spotify search errors:', failed)
        setPlaylistError(`${failed.length} track(s) not found on Spotify — check console for details`)
      }
    } catch (err) {
      setPlaylistError(err instanceof Error ? err.message : 'Something went wrong. Try again.')
    } finally {
      setPlaylistLoading(false)
    }
  }

  async function handleSaveToSpotify() {
    if (!temp || !playlist) return

    if (trackUris.length === 0) {
      setSpotifyError('No Spotify-matched tracks to save. Try regenerating the playlist.')
      return
    }

    setSavingToSpotify(true)
    setSpotifyError(null)

    try {
      const playlistName = `Q — ${generateName(temp.selectedSlots ?? [], Date.now())}`
      const res = await fetch('/api/save-playlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackUris, playlistName, accessToken: session?.accessToken }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? `Error ${res.status}`)

      setSavedToSpotify(true)
      if (data.playlistUrl) {
        window.open(data.playlistUrl, '_blank')
        setSpotifyPlaylistUrl(data.playlistUrl)
      }
    } catch (err) {
      console.error('[Save to Spotify] error:', err)
      setSpotifyError(err instanceof Error ? err.message : 'Failed to save to Spotify. Try again.')
    } finally {
      setSavingToSpotify(false)
    }
  }

  if (!temp) {
    return (
      <div className="flex items-center justify-center h-[calc(100dvh-72px)]">
        <QMarkLoader />
      </div>
    )
  }

  return (
    <RoutineView
      classOpener={temp.classOpener}
      tldr={temp.tldr}
      totalMinutes={temp.totalMinutes}
      builtToOrder={temp.builtToOrder}
      blocks={blocks}
      openSwap={openSwap}
      onOpenSwap={setOpenSwap}
      onSwapMove={swapMove}
      onUpdateBlocks={setBlocks}
      footer={
        <>
          {/* ── Artist anchors ── */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-stone uppercase tracking-widest">
              Who&apos;s been on repeat lately?
            </label>
            <input
              type="text"
              value={artistAnchors}
              onChange={e => setArtistAnchors(e.target.value)}
              placeholder="e.g. Beyoncé, Fred again.., Kaytranada"
              className="w-full bg-surface rounded-2xl px-4 py-3.5 text-sm text-ink placeholder:text-stone/60 outline-none border-2 border-border focus:border-forest transition-colors"
            />
          </div>

          {/* ── Generate Playlist ── */}
          {!session ? (
            <button
              onClick={() => signIn('spotify')}
              className="w-full h-14 rounded-2xl font-bold text-base flex items-center justify-center gap-2 text-white transition-all active:opacity-80"
              style={{ backgroundColor: '#1DB954' }}
            >
              <IconBrandSpotify size={20} stroke={1.8} />
              Connect Spotify to build the playlist
            </button>
          ) : (
            <button
              onClick={handleGeneratePlaylist}
              disabled={playlistLoading}
              className="w-full h-14 rounded-2xl font-semibold text-base bg-forest text-canvas transition-all active:opacity-80 disabled:opacity-60"
            >
              {playlistLoading ? 'Building playlist…' : 'Generate Playlist'}
            </button>
          )}

          {playlistError && (
            <p className="text-xs font-medium text-center" style={{ color: '#b45309' }}>
              {playlistError}
            </p>
          )}

          {/* ── Playlist results ── */}
          {playlist && playlist.length > 0 && (
            <div className="flex flex-col gap-4">
              <p className="text-xs font-medium text-stone uppercase tracking-widest">Playlist</p>

              <div className="flex flex-col gap-2.5">
                {playlist.map((track, i) => (
                  <div key={i} className="bg-surface rounded-xl px-4 py-3.5 flex gap-3">
                    {track.albumArt ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={track.albumArt}
                        alt={track.trackName ?? track.songTitle}
                        width={48}
                        height={48}
                        className="w-12 h-12 rounded-lg object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-border shrink-0" />
                    )}
                    <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {!noPreview.has(i) && (
                          <button
                            onClick={() => handlePlayPause(i, track)}
                            aria-label={playingIndex === i ? 'Pause' : 'Play 30-second preview'}
                            className={`text-forest shrink-0 transition-opacity active:opacity-60 ${
                              loadingPreview === i ? 'animate-pulse opacity-50' : ''
                            }`}
                          >
                            {playingIndex === i
                              ? <IconPlayerPause size={16} stroke={2} />
                              : <IconPlayerPlay size={16} stroke={2} />}
                          </button>
                        )}
                        <p className="text-sm font-semibold text-ink truncate flex-1">
                          {track.trackName ?? track.songTitle}
                        </p>
                      </div>
                      <p className="text-xs text-stone truncate">
                        {track.artistName ?? track.artist}
                      </p>
                      <p className="text-xs font-semibold text-forest mt-0.5">{track.block}</p>
                      <p className="text-xs text-stone leading-relaxed mt-0.5">
                        {track.rationale}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* ── Save to Spotify ── */}
              <div className="flex flex-col gap-2">
                {savedToSpotify ? (
                  <div className="flex flex-col gap-2">
                    <p className="text-sm font-semibold text-center text-forest py-1">
                      Opened in Spotify ✓
                    </p>
                    {spotifyPlaylistUrl && (
                      <a
                        href={spotifyPlaylistUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full h-14 rounded-2xl font-semibold text-base border-2 border-forest text-forest flex items-center justify-center gap-2 transition-all active:opacity-80"
                      >
                        <IconBrandSpotify size={18} stroke={1.5} />
                        Open playlist in Spotify
                      </a>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={handleSaveToSpotify}
                    disabled={savingToSpotify}
                    className="w-full h-14 rounded-2xl font-semibold text-base border-2 border-forest text-forest transition-all active:opacity-80 disabled:opacity-60"
                  >
                    {savingToSpotify ? 'Saving…' : 'Save to Spotify'}
                  </button>
                )}
                {spotifyError && (
                  <p className="text-xs font-medium text-center" style={{ color: '#b45309' }}>
                    {spotifyError}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ── Save routine ── */}
          <div className="border-t border-border pt-4 flex flex-col gap-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className={`w-full h-14 rounded-2xl font-semibold text-base transition-all active:opacity-80 disabled:opacity-80 ${
                saved ? 'bg-moss text-white' : 'bg-forest text-white'
              }`}
            >
              {saved ? 'Routine saved' : 'Save routine'}
            </button>
            <Link
              href="/build"
              className="text-sm font-medium text-center text-stone underline underline-offset-2"
            >
              Build another
            </Link>
          </div>
        </>
      }
    />
  )
}
