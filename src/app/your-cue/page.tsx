'use client'

import { useCallback, useEffect, useState } from 'react'
import { IconRefresh, IconPencil } from '@tabler/icons-react'
import { PenNote } from '@/components/Scribble'
import NotesStack from '@/components/NotesStack'
import BrandPhoto from '@/components/BrandPhoto'
import EditProfileSheet from '@/components/EditProfileSheet'
import type { SavedRoutine } from '@/types/routine'
import { loadProfile, type Profile } from '@/lib/profile'

/** Distinct moves ever used — the data behind "NEVER REPEATS." */
function computeDistinctMoves(routines: SavedRoutine[]): number {
  const names = new Set<string>()
  for (const r of routines) {
    for (const b of r.blocks ?? []) {
      for (const m of b.moves) names.add(m.name)
    }
  }
  return names.size
}

/** Consecutive weeks (ending this week or last) with at least one routine built */
function computeStreakWeeks(routines: SavedRoutine[]): number {
  if (routines.length === 0) return 0
  const WEEK = 7 * 24 * 60 * 60 * 1000
  const weeks = new Set(routines.map(r => Math.floor(r.savedAt / WEEK)))
  const thisWeek = Math.floor(Date.now() / WEEK)
  let start = weeks.has(thisWeek) ? thisWeek : weeks.has(thisWeek - 1) ? thisWeek - 1 : -1
  if (start === -1) return 0
  let streak = 0
  while (weeks.has(start - streak)) streak++
  return streak
}

function computeStats(routines: SavedRoutine[]) {
  const total = routines.length

  const emphasisCount: Record<string, number> = {}
  for (const r of routines) {
    for (const e of r.selectedEmphasis ?? []) {
      emphasisCount[e] = (emphasisCount[e] ?? 0) + 1
    }
  }
  const topEmphasis = Object.entries(emphasisCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null

  const arcCount: Record<string, number> = {}
  for (const r of routines) {
    if (r.energyArc) arcCount[r.energyArc] = (arcCount[r.energyArc] ?? 0) + 1
  }
  const topArc = Object.entries(arcCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null

  return { total, topEmphasis, topArc }
}

function shortArcLabel(arc: string): string {
  if (arc.startsWith('Slow')) return 'Slow build'
  if (arc.startsWith('Sustained')) return 'Sustained'
  if (arc.startsWith('Peak')) return 'Peak & hold'
  return arc
}

function computeSoundPatterns(routines: SavedRoutine[]) {
  const withTracks = routines.filter(r => r.playlistTracks && r.playlistTracks.length > 0)
  if (withTracks.length === 0) return null

  // per-routine occurrence count (how many playlists feature this artist)
  const playlistCount: Record<string, number> = {}
  // raw track count across all playlists
  const trackCount: Record<string, number> = {}
  // first album art seen per artist — the visual for On Repeat
  const artistArt: Record<string, string> = {}

  for (const r of withTracks) {
    const seenInRoutine = new Set<string>()
    for (const t of r.playlistTracks!) {
      const a = t.artist
      trackCount[a] = (trackCount[a] ?? 0) + 1
      if (t.albumArt && !artistArt[a]) artistArt[a] = t.albumArt
      if (!seenInRoutine.has(a)) {
        seenInRoutine.add(a)
        playlistCount[a] = (playlistCount[a] ?? 0) + 1
      }
    }
  }

  // rank by playlist presence, then raw track count
  const sorted = Object.entries(playlistCount).sort(
    (a, b) => b[1] - a[1] || (trackCount[b[0]] ?? 0) - (trackCount[a[0]] ?? 0)
  )
  const top3 = sorted.slice(0, 3).map(([artist, count]) => ({
    artist,
    count,
    tracks: trackCount[artist] ?? 0,
    art: artistArt[artist],
  }))
  const uniqueCount = sorted.length
  const [topName, topCount] = sorted[0] ?? []

  return { top3, uniqueCount, topName, topCount, topArt: topName ? artistArt[topName] : undefined }
}

function buildReflection(total: number, topEmphasis: string | null, topArc: string | null): string {
  if (total < PROFILE_THRESHOLD) {
    const remaining = PROFILE_THRESHOLD - total
    if (total === 0) {
      return `Nothing here yet. Build ${PROFILE_THRESHOLD} routines and Q starts reflecting back what it sees in your teaching — the emphasis you keep reaching for, the arcs you build, the moves you never repeat.`
    }
    return `${total} of ${PROFILE_THRESHOLD} routines built. ${remaining} more and Q will start reflecting back patterns in your teaching.`
  }

  const parts: string[] = []

  if (topEmphasis && topArc) {
    parts.push(
      `${total === 1 ? 'One routine in' : `${total} routines in`} and a pattern is already clear: you keep coming back to ${topEmphasis.toLowerCase()}, and you almost always build with a ${shortArcLabel(topArc).toLowerCase()} arc.`
    )
    parts.push(
      "That's not coincidence — that's your teaching voice finding its shape. Keep going."
    )
  } else if (topEmphasis) {
    parts.push(
      `${total === 1 ? 'One routine in' : `${total} routines built`}, and you're already showing a clear lean toward ${topEmphasis.toLowerCase()}.`
    )
    parts.push("Build more and Q will have more to say.")
  } else {
    parts.push(
      `You've built ${total} routine${total === 1 ? '' : 's'}. Keep going — the more you build, the more Q can reflect back what makes your classes yours.`
    )
  }

  return parts.join(' ')
}


// ─── The one-liner — Q-written, unique per instructor ─────────────────────────

const ONE_LINER_KEY = 'q_one_liner'
const SIX_MONTHS = 182 * 24 * 60 * 60 * 1000
/** Routines needed before Q starts writing a profile — no fabricated claims before this. */
const PROFILE_THRESHOLD = 10

export default function YourCuePage() {
  const [routines, setRoutines] = useState<SavedRoutine[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [editingProfile, setEditingProfile] = useState(false)

  useEffect(() => {
    setProfile(loadProfile())
  }, [])

  useEffect(() => {
    try {
      const stored = localStorage.getItem('q_routines')
      if (stored) setRoutines(JSON.parse(stored))
    } catch {}
  }, [])

  const { total, topEmphasis, topArc } = computeStats(routines)
  const hasProfileData = total >= PROFILE_THRESHOLD
  const routinesRemaining = Math.max(0, PROFILE_THRESHOLD - total)
  const reflection = buildReflection(total, topEmphasis, topArc)
  const soundPatterns = computeSoundPatterns(routines)
  const distinctMoves = computeDistinctMoves(routines)
  const streakWeeks = computeStreakWeeks(routines)

  // ── One-liner: cached ~6 months, regenerates from the instructor's own data.
  // Q doesn't write anything until there's enough data to actually reflect —
  // no fabricated one-liners before PROFILE_THRESHOLD routines exist.
  const [oneLiner, setOneLiner] = useState<string | null>(null)
  const [writing, setWriting] = useState(false)

  const generateOneLiner = useCallback(
    async (currentRoutines: SavedRoutine[]) => {
      if (currentRoutines.length < PROFILE_THRESHOLD) return
      setWriting(true)
      try {
        const stats = computeStats(currentRoutines)
        const sounds = computeSoundPatterns(currentRoutines)
        const res = await fetch('/api/generate-one-liner', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topArtists: sounds?.top3.map(t => t.artist) ?? [],
            topEmphasis: stats.topEmphasis,
            topArc: stats.topArc ? shortArcLabel(stats.topArc) : null,
            vibes: currentRoutines.map(r => r.vibe).filter(Boolean).slice(0, 5),
            totalRoutines: stats.total,
            distinctMoves: computeDistinctMoves(currentRoutines),
          }),
        })
        if (!res.ok) throw new Error('api')
        const { oneLiner: text } = await res.json()
        if (text) {
          setOneLiner(text)
          localStorage.setItem(ONE_LINER_KEY, JSON.stringify({ text, generatedAt: Date.now() }))
        }
      } catch {
        // keep whatever is showing — placeholder or last good line
      } finally {
        setWriting(false)
      }
    },
    []
  )

  // On load: use the cached line; regenerate when stale (~6 months) or missing
  useEffect(() => {
    if (routines.length < PROFILE_THRESHOLD) return
    try {
      const cached = JSON.parse(localStorage.getItem(ONE_LINER_KEY) ?? 'null')
      if (cached?.text) {
        setOneLiner(cached.text)
        if (Date.now() - (cached.generatedAt ?? 0) < SIX_MONTHS) return
      }
    } catch {}
    generateOneLiner(routines)
  }, [routines, generateOneLiner])

  return (
    <div className="px-5 pt-12 pb-10 flex flex-col gap-8 max-w-lg mx-auto w-full relative">

      <div className="flex items-center justify-between">
        <h1
          className="font-extrabold text-ink"
          style={{ fontSize: '34px', lineHeight: 1, fontVariationSettings: "'opsz' 96" }}
        >
          Your Cue
        </h1>
        <button
          onClick={() => setEditingProfile(true)}
          className="flex items-center gap-1.5 text-xs font-bold text-stone hover:text-ink transition-colors rounded-full px-3 py-2 border border-border"
        >
          <IconPencil size={13} stroke={2} />
          Edit profile
        </button>
      </div>

      {editingProfile && (
        <EditProfileSheet
          initial={profile}
          onClose={() => setEditingProfile(false)}
          onSaved={setProfile}
        />
      )}

      {/* ── The POWDER poster: full-bleed B&W photo + marker annotations ── */}
      <section
        className="relative rounded-3xl overflow-hidden"
        style={{ height: '560px', backgroundColor: '#0D0D0F' }}
      >
        {profile?.photoDataUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.photoDataUrl}
            alt={profile.name || 'Instructor'}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ objectPosition: '50% 20%' }}
          />
        )}
        {/* veil — grounding gradient so the writing always reads */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(0,0,0,0.32) 0%, transparent 30%, transparent 52%, rgba(0,0,0,0.82) 100%)',
          }}
        />

        {/* the Q mark — big, low-opacity, bleeding off the right edge */}
        <span
          aria-hidden
          className="absolute font-extrabold pointer-events-none select-none"
          style={{
            right: '-42px',
            top: '34%',
            fontSize: '190px',
            lineHeight: 1,
            color: '#AEC8F5',
            opacity: 0.35,
            fontVariationSettings: "'opsz' 96",
          }}
        >
          Q
        </span>

        {/* name — big powder marker */}
        <div className="absolute" style={{ top: '16px', left: '20px' }}>
          <PenNote color="#AEC8F5" size={52} rotate="-3deg">
            {profile?.name || 'You'}
          </PenNote>
        </div>

        {/* one-liner — white marker. UNIQUE PER USER: Q writes it from the
            instructor's own data (music taste, emphasis, arcs, vibe prompts)
            via /api/generate-one-liner once PROFILE_THRESHOLD routines exist;
            cached ~6 months; tap ↻ to rewrite. Before that, no fabricated
            copy — just a plain explanation of what's coming and why. */}
        <div className="absolute flex items-start gap-2" style={{ top: '90px', left: '24px', maxWidth: '310px' }}>
          <PenNote color="#FFFFFF" size={17} rotate="-2deg" style={{ lineHeight: 1.45 }}>
            {hasProfileData
              ? writing
                ? 'q is writing your line…'
                : oneLiner
              : routinesRemaining === PROFILE_THRESHOLD
                ? `build ${PROFILE_THRESHOLD} routines and q will write your line from your own teaching`
                : `${routinesRemaining} more routine${routinesRemaining === 1 ? '' : 's'} and q will write your line`}
          </PenNote>
          {hasProfileData && !writing && (
            <button
              onClick={() => generateOneLiner(routines)}
              aria-label="Rewrite my one-liner"
              title="Rewrite my one-liner"
              className="shrink-0 mt-0.5 w-6 h-6 rounded-full flex items-center justify-center active:scale-90 transition-transform"
              style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: '#AEC8F5' }}
            >
              <IconRefresh size={12} stroke={2.5} />
            </button>
          )}
        </div>

        {/* stats — powder marker list. Below threshold this is a plain
            progress count, not a claim about the instructor's style. */}
        <div className="absolute flex flex-col" style={{ left: '20px', bottom: '150px', gap: '2px' }}>
          {hasProfileData ? (
            <>
              <PenNote color="#AEC8F5" size={17} rotate="-1deg">
                + {total} routine{total === 1 ? '' : 's'} built
              </PenNote>
              {topEmphasis && (
                <PenNote color="#AEC8F5" size={17} rotate="-1deg">
                  + {topEmphasis.toLowerCase()}
                </PenNote>
              )}
              {topArc && (
                <PenNote color="#AEC8F5" size={17} rotate="-1deg">
                  + {shortArcLabel(topArc).toLowerCase()} arc
                </PenNote>
              )}
            </>
          ) : (
            <PenNote color="#AEC8F5" size={17} rotate="-1deg">
              + {total} of {PROFILE_THRESHOLD} routines built
            </PenNote>
          )}
        </div>

        {/* credential line — quiet small caps */}
        <p
          className="absolute text-[10px] font-bold uppercase"
          style={{ left: '20px', bottom: '126px', letterSpacing: '2.5px', color: 'rgba(255,255,255,0.85)' }}
        >
          {profile?.studio ? `Certified Lagree Instructor · ${profile.studio}` : 'Certified Lagree Instructor'}
        </p>

        {/* giant statement — last line in powder */}
        <p
          className="absolute left-0 right-0 text-white font-extrabold"
          style={{
            bottom: '18px',
            padding: '0 18px',
            fontSize: '40px',
            lineHeight: 0.96,
            letterSpacing: '-1px',
            fontVariationSettings: "'opsz' 96",
          }}
        >
          {hasProfileData ? (
            <>
              BUILDS WITH INTENTION.
              <br />
              <span style={{ color: '#AEC8F5' }}>NEVER REPEATS.</span>
            </>
          ) : (
            <>
              STILL FINDING
              <br />
              <span style={{ color: '#AEC8F5' }}>YOUR STYLE.</span>
            </>
          )}
        </p>
      </section>

      {/* ── Divider ── */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs font-medium text-stone uppercase tracking-widest">Your Cue</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* ── Section 2: Your Cue ── */}
      <section className="flex flex-col gap-4">
        <div className="bg-white rounded-2xl px-5 py-5 shadow-card">
          <p className="text-sm text-ink leading-relaxed">{reflection}</p>
        </div>

        {/* Receipts — the poster's claims, backed by data */}
        {total > 0 && (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-surface rounded-2xl px-4 py-5 flex flex-col gap-1 relative overflow-hidden">
              <p
                className="font-extrabold text-ink"
                style={{ fontSize: '30px', lineHeight: 1, fontVariationSettings: "'opsz' 96" }}
              >
                {distinctMoves}
              </p>
              <p className="text-xs text-stone leading-snug">
                distinct moves used — <span className="font-bold text-ink">never repeats</span>
              </p>
            </div>
            <div className="bg-surface rounded-2xl px-4 py-5 flex flex-col gap-1">
              <p
                className="font-extrabold text-ink"
                style={{ fontSize: '30px', lineHeight: 1, fontVariationSettings: "'opsz' 96" }}
              >
                {streakWeeks || '—'}
              </p>
              <p className="text-xs text-stone leading-snug">
                {streakWeeks === 1 ? 'week building' : 'weeks building, back to back'}
              </p>
            </div>
          </div>
        )}
      </section>

      {/* ── Photo beat ── */}
      <BrandPhoto
        src="/photos/socks-bw.jpg"
        alt="Grip socks with heart-dot soles on a reformer"
        height={170}
        position="50% 45%"
        caption="The uniform"
      />

      {/* ── Section: Notes to self — the user's own sticky stack ── */}
      <section className="flex flex-col gap-4 px-1">
        <NotesStack />
      </section>

      {/* ── Section 3: On Repeat — the sound of your classes ── */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs font-medium text-stone uppercase tracking-widest">On Repeat</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {soundPatterns ? (
          <>
            {/* #1 artist — the hero */}
            <div className="bg-white rounded-3xl p-5 shadow-card border border-border flex items-center gap-4 relative overflow-hidden">
              {soundPatterns.topArt ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={soundPatterns.topArt}
                  alt=""
                  className="w-20 h-20 rounded-xl object-cover shrink-0"
                  style={{ filter: 'grayscale(1) contrast(1.1)' }}
                />
              ) : (
                <div
                  className="w-20 h-20 rounded-xl shrink-0 flex items-center justify-center font-extrabold text-2xl"
                  style={{ backgroundColor: '#0D0D0F', color: '#AEC8F5' }}
                >
                  {soundPatterns.topName?.[0]}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold tracking-[3px] uppercase" style={{ color: '#8A8A8A' }}>
                  Most on repeat
                </p>
                <p className="text-lg font-extrabold text-ink leading-tight mt-0.5 truncate">
                  {soundPatterns.topName}
                </p>
                <p className="text-xs text-stone mt-0.5">
                  in {soundPatterns.topCount} of my playlist{soundPatterns.topCount !== 1 ? 's' : ''} ·{' '}
                  {soundPatterns.uniqueCount} artists total
                </p>
              </div>
              <PenNote color="#AEC8F5" size={15} rotate="-4deg" className="shrink-0">
                on repeat!
              </PenNote>
            </div>

            {/* top 3 with covers */}
            {soundPatterns.top3.length > 1 && (
              <div className="bg-surface rounded-2xl px-5 py-4 flex flex-col gap-3">
                <p className="text-xs font-medium text-stone uppercase tracking-widest">My top three</p>
                <div className="flex flex-col gap-2.5">
                  {soundPatterns.top3.map(({ artist, count, tracks, art }, i) => (
                    <div key={artist} className="flex items-center gap-3">
                      <span className="text-[10px] font-extrabold text-stone w-4 text-right shrink-0">
                        {i + 1}
                      </span>
                      {art ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={art}
                          alt=""
                          className="w-9 h-9 rounded-lg object-cover shrink-0"
                          style={{ filter: 'grayscale(1) contrast(1.1)' }}
                        />
                      ) : (
                        <div
                          className="w-9 h-9 rounded-lg shrink-0 flex items-center justify-center text-xs font-extrabold"
                          style={{ backgroundColor: '#0D0D0F', color: '#AEC8F5' }}
                        >
                          {artist[0]}
                        </div>
                      )}
                      <p className="text-sm font-medium text-ink truncate flex-1">{artist}</p>
                      <span
                        className="shrink-0 text-xs font-semibold rounded-full px-2.5 py-0.5"
                        style={{ backgroundColor: '#0D0D0F', color: '#AEC8F5' }}
                      >
                        {count} playlist{count !== 1 ? 's' : ''} · {tracks} track{tracks !== 1 ? 's' : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="bg-surface rounded-2xl px-5 py-6 flex flex-col items-center text-center gap-1">
            <p className="text-sm font-bold text-ink">No sound yet.</p>
            <p className="text-xs text-stone max-w-[250px]">
              Build a routine with a playlist and Q starts tracking who&apos;s on repeat across my classes.
            </p>
          </div>
        )}
      </section>

    </div>
  )
}
