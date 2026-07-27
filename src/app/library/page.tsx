'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { IconStar, IconSearch, IconChevronRight, IconBrandSpotify } from '@tabler/icons-react'
import { ScribbleArrow, PenNote, Highlight } from '@/components/Scribble'
import { estimateDifficulty } from '@/lib/difficulty'
import type { SavedRoutine } from '@/types/routine'

function formatSavedAt(ts: number) {
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// Same spring palette as RoutineView — the real Lagree spring colors
const SPRING_COLORS: Record<string, string> = {
  yellow: '#E7C93F',
  red: '#C24B37',
  blue: '#2E51E6',
  green: '#3E7C4F',
  black: '#111418',
  white: '#D9D4CA',
}

/** Distinct spring colors used across a routine's blocks, in first-use order */
function springsUsed(routine: SavedRoutine): string[] {
  const seen: string[] = []
  for (const b of routine.blocks) {
    for (const m of b.spring.matchAll(/(\d+)\s*(yellow|red|blue|green|black|white)/gi)) {
      const c = SPRING_COLORS[m[2].toLowerCase()]
      if (c && !seen.includes(c)) seen.push(c)
    }
  }
  return seen
}

function routineMinutes(routine: SavedRoutine): number {
  return routine.blocks.reduce((s, b) => s + b.moves.reduce((a, m) => a + (m.duration || 1), 0), 0)
}

export default function LibraryPage() {
  const [routines, setRoutines] = useState<SavedRoutine[]>([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    try {
      const stored = localStorage.getItem('q_routines')
      if (stored) {
        const parsed: SavedRoutine[] = JSON.parse(stored)
        setRoutines(parsed.sort((a, b) => b.savedAt - a.savedAt))
      }
    } catch {}
  }, [])

  function toggleFavorite(id: number) {
    setRoutines(prev => {
      const next = prev.map(r => r.id === id ? { ...r, favorited: !r.favorited } : r)
      localStorage.setItem('q_routines', JSON.stringify(next))
      return next
    })
  }

  const query = search.trim().toLowerCase()
  const filtered = query
    ? routines.filter(r => r.name.toLowerCase().includes(query))
    : routines

  const favorites = filtered.filter(r => r.favorited)
  const rest = filtered.filter(r => !r.favorited)

  return (
    <div className="px-5 pt-12 pb-8 flex flex-col gap-6 max-w-lg mx-auto w-full relative">

      <h1
        className="font-extrabold text-ink"
        style={{ fontSize: '34px', lineHeight: 1, fontVariationSettings: "'opsz' 96" }}
      >
        Library
      </h1>

      {/* Search */}
      <div className="relative">
        <IconSearch
          size={16}
          stroke={1.8}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-stone pointer-events-none"
        />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search routines…"
          className="w-full bg-surface rounded-2xl pl-10 pr-4 py-3.5 text-sm text-ink placeholder:text-stone/60 outline-none border-2 border-border focus:border-powder transition-colors"
        />
      </div>

      {routines.length === 0 ? (
        <div className="rounded-3xl px-5 pt-12 pb-10 flex flex-col items-center text-center gap-2 mt-2 shadow-card bg-white border border-border relative overflow-hidden">
          <span
            aria-hidden
            className="absolute font-extrabold pointer-events-none select-none"
            style={{
              left: '-22px',
              top: '-26px',
              fontSize: '150px',
              lineHeight: 1,
              color: '#AEC8F5',
              opacity: 0.25,
              fontVariationSettings: "'opsz' 96",
            }}
          >
            Q
          </span>
          <p className="text-base font-bold text-ink relative">An empty shelf, for now.</p>
          <p className="text-sm text-stone relative max-w-[240px]">
            Every routine you save lands <Highlight>here</Highlight> —
            searchable, favoritable, reusable.
          </p>
          <div className="relative mt-1 flex flex-col items-center">
            <ScribbleArrow width={52} style={{ transform: 'scaleX(-1) rotate(10deg)' }} />
            <Link href="/build" className="text-sm font-bold mt-1 text-ink underline decoration-powder decoration-2 underline-offset-4">
              Build your first →
            </Link>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl px-5 py-10 flex flex-col items-center text-center gap-1 shadow-card bg-white">
          <p className="text-sm font-medium text-stone">No results for &ldquo;{search}&rdquo;</p>
        </div>
      ) : (
        <>
          {/* Favorites */}
          {favorites.length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className="flex items-center gap-2 text-xs font-medium tracking-widest uppercase text-stone">
                <span className="w-1.5 h-1.5 rounded-full bg-powder shrink-0" />
                Favorites
              </h2>
              <div className="flex flex-col gap-2">
                {favorites.map(r => (
                  <RoutineCard key={r.id} routine={r} onToggleFavorite={toggleFavorite} />
                ))}
              </div>
            </section>
          )}

          {/* All routines */}
          {rest.length > 0 && (
            <section className="flex flex-col gap-3">
              {favorites.length > 0 && (
                <h2 className="flex items-center gap-2 text-xs font-medium tracking-widest uppercase text-stone">
                  <span className="w-1.5 h-1.5 rounded-full bg-powder shrink-0" />
                  All routines
                </h2>
              )}
              <div className="flex flex-col gap-2">
                {rest.map(r => (
                  <RoutineCard key={r.id} routine={r} onToggleFavorite={toggleFavorite} />
                ))}
              </div>
            </section>
          )}
        </>
      )}

    </div>
  )
}

function RoutineCard({
  routine,
  onToggleFavorite,
}: {
  routine: SavedRoutine
  onToggleFavorite: (id: number) => void
}) {
  return (
    <Link
      href={`/build/result/${routine.id}`}
      className="bg-white rounded-2xl px-5 py-4 flex flex-col gap-3 cursor-pointer shadow-card"
    >
      <div className="flex items-center gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-ink leading-snug">{routine.name}</p>
          <p className="text-xs text-stone mt-0.5 flex items-center gap-1.5">
            <span>
              {formatSavedAt(routine.savedAt)}&nbsp;&middot;&nbsp;{routine.tldr.focus}
            </span>
            <PenNote size={13} rotate="-2deg">
              {estimateDifficulty(routine.blocks)}
            </PenNote>
          </p>
        </div>
        <button
          onClick={e => { e.preventDefault(); e.stopPropagation(); onToggleFavorite(routine.id) }}
          aria-label={routine.favorited ? 'Remove from favorites' : 'Add to favorites'}
          className="shrink-0 p-1.5 rounded-lg transition-colors"
        >
          <IconStar
            size={18}
            stroke={1.8}
            style={routine.favorited ? { color: '#AEC8F5', fill: '#AEC8F5' } : undefined}
            className={routine.favorited ? undefined : 'text-stone'}
          />
        </button>
        <IconChevronRight size={16} stroke={1.8} className="text-stone shrink-0" />
      </div>

      {routine.energyArc && (
        <p className="text-xs text-stone">
          <span className="font-medium text-ink">Energy:</span> {routine.energyArc}
        </p>
      )}

      {/* Scent for scanning: springs used + block/minute totals at a glance */}
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-1">
          {springsUsed(routine).map((c, i) => (
            <span key={i} className="w-2 h-2 rounded-full" style={{ backgroundColor: c }} />
          ))}
        </span>
        <span className="text-[11px] font-semibold text-stone">
          {routine.blocks.length} blocks · {routineMinutes(routine)} min
        </span>
      </div>

      {routine.spotifyPlaylistUrl && (
        <a
          href={routine.spotifyPlaylistUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          className="self-start flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
          style={{ backgroundColor: '#1DB95420', color: '#1DB954' }}
        >
          <IconBrandSpotify size={12} stroke={2} />
          Open in Spotify
        </a>
      )}
    </Link>
  )
}
