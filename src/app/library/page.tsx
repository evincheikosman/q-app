'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { IconStar, IconSearch, IconChevronRight, IconBrandSpotify } from '@tabler/icons-react'
import type { SavedRoutine } from '@/types/routine'

function formatSavedAt(ts: number) {
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
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
    <div className="px-5 pt-12 pb-8 flex flex-col gap-6 max-w-lg mx-auto w-full">

      <h1 className="text-3xl font-extrabold text-ink">Library</h1>

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
          className="w-full bg-surface rounded-2xl pl-10 pr-4 py-3.5 text-sm text-ink placeholder:text-stone/60 outline-none border-2 border-transparent focus:border-forest transition-colors"
        />
      </div>

      {routines.length === 0 ? (
        <div className="bg-surface rounded-2xl px-5 py-14 flex flex-col items-center text-center gap-1 mt-2">
          <p className="text-sm font-medium text-stone">No saved routines yet.</p>
          <p className="text-sm text-stone opacity-70">Build and save your first.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-surface rounded-2xl px-5 py-10 flex flex-col items-center text-center gap-1">
          <p className="text-sm font-medium text-stone">No results for &ldquo;{search}&rdquo;</p>
        </div>
      ) : (
        <>
          {/* Favorites */}
          {favorites.length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className="text-xs font-medium tracking-widest uppercase text-stone">Favorites</h2>
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
                <h2 className="text-xs font-medium tracking-widest uppercase text-stone">All routines</h2>
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
      className="bg-surface rounded-2xl px-5 py-4 flex flex-col gap-3 border-2 border-transparent hover:border-border cursor-pointer transition-colors"
    >
      <div className="flex items-center gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-ink leading-snug">{routine.name}</p>
          <p className="text-xs text-stone mt-0.5">
            {formatSavedAt(routine.savedAt)}&nbsp;&middot;&nbsp;{routine.tldr.focus}
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
            className={routine.favorited ? 'text-forest fill-forest' : 'text-stone'}
          />
        </button>
        <IconChevronRight size={16} stroke={1.8} className="text-stone shrink-0" />
      </div>

      {routine.energyArc && (
        <p className="text-xs text-stone">
          <span className="font-medium text-ink">Energy:</span> {routine.energyArc}
        </p>
      )}

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
