'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { SavedRoutine } from '@/types/routine'

// ─── Schedule ─────────────────────────────────────────────────────────────────

const SCHEDULE = [
  { day: 6, hour: 11, minute: 0 },
  { day: 6, hour: 11, minute: 50 },
  { day: 0, hour: 10, minute: 10 },
  { day: 0, hour: 11, minute: 0 },
]

function nextOccurrence(day: number, hour: number, minute: number, now: Date): Date {
  const currentDay = now.getDay()
  let daysUntil = (day - currentDay + 7) % 7
  if (daysUntil === 0) {
    const slot = new Date(now)
    slot.setHours(hour, minute, 0, 0)
    if (slot <= now) daysUntil = 7
  }
  const date = new Date(now)
  date.setDate(now.getDate() + daysUntil)
  date.setHours(hour, minute, 0, 0)
  date.setSeconds(0, 0)
  return date
}

function formatDate(date: Date) {
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}

function formatTime(date: Date) {
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

function greeting(hour: number) {
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function formatSavedAt(ts: number) {
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ─── Shared section label with divider ────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="pb-2" style={{ borderBottom: '1px solid #E0DAD0' }}>
      <h2 className="text-xs font-medium tracking-widest uppercase text-stone">{children}</h2>
    </div>
  )
}

// ─── Linked indicator ─────────────────────────────────────────────────────────

function LinkedDot({ white = false }: { white?: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: '#1DB954' }} />
      <span className={`text-xs font-semibold ${white ? 'text-white' : 'text-ink'}`}>Ready ✓</span>
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function HomePage() {
  const [routines, setRoutines] = useState<SavedRoutine[]>([])
  const now = new Date()
  const hour = now.getHours()

  useEffect(() => {
    try {
      const stored = localStorage.getItem('q_routines')
      if (stored) {
        const parsed: SavedRoutine[] = JSON.parse(stored)
        setRoutines(parsed.sort((a, b) => b.savedAt - a.savedAt))
      }
    } catch {}
  }, [])

  const upcoming = SCHEDULE
    .map(({ day, hour, minute }) => nextOccurrence(day, hour, minute, now))
    .sort((a, b) => a.getTime() - b.getTime())

  const [nextClass, ...rest] = upcoming
  const sevenDaysOut = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const moreThisWeek = rest.filter(d => d <= sevenDaysOut).length

  function linkedRoutine(date: Date): SavedRoutine | undefined {
    return routines.find(r =>
      r.selectedSlots?.some(
        s => s.day === date.getDay() && s.hour === date.getHours() && s.minute === date.getMinutes()
      )
    )
  }

  const nextLinked = linkedRoutine(nextClass)
  const isLinked = !!(nextLinked?.spotifyPlaylistUrl)

  const albumArts: string[] = (() => {
    if (!isLinked || !nextLinked) return []
    const seen = new Set<string>()
    const arts: string[] = []
    for (const t of nextLinked.playlistTracks ?? []) {
      if (t.albumArt && !seen.has(t.albumArt)) {
        seen.add(t.albumArt)
        arts.push(t.albumArt)
        if (arts.length === 5) break
      }
    }
    return arts
  })()

  const recentRoutines = routines.slice(0, 5)

  // Time-of-day hero accent
  const heroBorderColor = hour >= 5 && hour < 11 ? '#EBF0EC'
    : hour >= 11 && hour < 17 ? '#FBF5E6'
    : null
  const heroEveningOverlay = hour >= 17

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .routine-scroll::-webkit-scrollbar { display: none; }
        .routine-scroll { scrollbar-width: none; }
      `}</style>

      <div className="px-5 pt-14 pb-8 flex flex-col gap-8 max-w-lg mx-auto w-full">

        {/* ── Greeting ── */}
        <div style={{ animation: 'fadeUp 400ms ease-out both' }}>
          <p className="text-sm font-medium text-stone tracking-wide uppercase mb-1">
            {now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
          <h1 className="text-4xl font-extrabold text-ink leading-tight">
            {greeting(hour)},<br />Evîn.
          </h1>
        </div>

        {/* ── Next class hero card ── */}
        <section
          className="flex flex-col gap-3"
          style={{ animation: 'fadeUp 400ms ease-out 80ms both' }}
        >
          <div
            className="rounded-2xl p-5 flex flex-col gap-4 relative overflow-hidden"
            style={{
              backgroundColor: '#1B3828',
              ...(heroBorderColor ? { borderLeft: `2px solid ${heroBorderColor}` } : {}),
            }}
          >
            {/* Radial gradient overlay */}
            <div
              className="absolute inset-0 pointer-events-none rounded-2xl"
              style={{ background: 'radial-gradient(circle at 85% 85%, transparent 20%, rgba(0,0,0,0.25) 100%)' }}
            />
            {/* Evening tint */}
            {heroEveningOverlay && (
              <div
                className="absolute inset-0 pointer-events-none rounded-2xl"
                style={{ backgroundColor: 'rgba(27,56,40,0.08)' }}
              />
            )}

            <p className="text-xs font-medium tracking-widest uppercase text-white/50 relative">
              Next Class
            </p>

            <div className="flex items-start justify-between gap-3 relative">
              <div>
                <p className="text-xs font-medium tracking-widest uppercase text-white/60">
                  {formatDate(nextClass)}
                </p>
                <p className="text-white leading-none mt-1" style={{ fontSize: '52px', fontWeight: 800 }}>
                  {formatTime(nextClass)}
                </p>
                {moreThisWeek > 0 && (
                  <p className="text-xs mt-1.5 text-white/60">
                    + {moreThisWeek} more this week
                  </p>
                )}
              </div>
              {isLinked && nextLinked && (
                <Link href={`/build/result/${nextLinked.id}`} className="mt-1">
                  <LinkedDot white />
                </Link>
              )}
            </div>

            {albumArts.length > 0 && (
              <div className="flex items-center relative">
                {albumArts.map((url, i) => (
                  <img
                    key={url}
                    src={url}
                    alt=""
                    className={`w-8 h-8 rounded-full object-cover border-2 border-white${i > 0 ? ' -ml-2' : ''}`}
                  />
                ))}
              </div>
            )}

            <Link
              href={isLinked ? '/library' : '/build'}
              className="w-full text-center font-semibold text-base rounded-xl py-3.5 block active:opacity-80 transition-opacity relative bg-[#F6F1E9] hover:bg-white text-[#0F1A14]"
            >
              {isLinked ? 'Review your routine →' : 'Build routine'}
            </Link>
          </div>
        </section>

        {/* ── Recent routines (horizontal scroll) ── */}
        <section
          className="flex flex-col gap-3"
          style={{ animation: 'fadeUp 400ms ease-out 160ms both' }}
        >
          <SectionLabel>Recent routines</SectionLabel>
          {recentRoutines.length === 0 ? (
            <div className="bg-surface rounded-2xl px-5 py-10 flex flex-col items-center text-center gap-1">
              <p className="text-sm font-medium text-stone">Nothing here yet.</p>
              <p className="text-sm text-stone opacity-70">Build your first routine.</p>
            </div>
          ) : (
            <div
              className="routine-scroll flex overflow-x-auto gap-3 -mx-4 px-4 pb-1"
              style={{ scrollSnapType: 'x mandatory' }}
            >
              {recentRoutines.map(r => (
                <Link
                  key={r.id}
                  href={`/build/result/${r.id}`}
                  className="flex-shrink-0 bg-surface rounded-xl p-4 flex flex-col active:opacity-75 transition-opacity"
                  style={{ minWidth: '220px', scrollSnapAlign: 'start' }}
                >
                  <p className="text-sm font-semibold text-ink truncate">{r.name}</p>
                  <p className="text-xs text-stone mt-0.5">
                    {formatSavedAt(r.savedAt)}&nbsp;&middot;&nbsp;{r.tldr.focus}
                  </p>
                  {r.spotifyPlaylistUrl && (
                    <a
                      href={r.spotifyPlaylistUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="inline-flex items-center gap-1 mt-1.5"
                      style={{ color: '#1DB954' }}
                    >
                      <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: '#1DB954' }} />
                      <span className="text-xs font-medium">
                        {r.playlistTracks ? `${r.playlistTracks.length} tracks` : 'Playlist'}
                      </span>
                    </a>
                  )}
                </Link>
              ))}
            </div>
          )}
        </section>

      </div>
    </>
  )
}
