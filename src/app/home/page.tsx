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

// ─── Component ────────────────────────────────────────────────────────────────

export default function HomePage() {
  const [routines, setRoutines] = useState<SavedRoutine[]>([])
  const now = new Date()

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
  const thisWeek = rest.filter(d => d <= sevenDaysOut)

  function linkedRoutine(date: Date): SavedRoutine | undefined {
    return routines.find(r =>
      r.selectedSlots?.some(
        s => s.day === date.getDay() && s.hour === date.getHours() && s.minute === date.getMinutes()
      )
    )
  }

  const nextLinked = linkedRoutine(nextClass)
  const recentRoutines = routines.slice(0, 5)

  return (
    <div className="px-5 pt-14 pb-8 flex flex-col gap-8 max-w-lg mx-auto w-full">

      {/* Greeting */}
      <div>
        <p className="text-sm font-medium text-stone tracking-wide uppercase mb-1">
          {now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
        <h1 className="text-4xl font-extrabold text-ink leading-tight">
          {greeting(now.getHours())},<br />Evîn.
        </h1>
      </div>

      {/* Next class */}
      <section className="flex flex-col gap-3">
        <h2 className="text-xs font-medium tracking-widest uppercase text-stone">
          Next class
        </h2>

        <div className="bg-surface rounded-2xl p-5 flex flex-col gap-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-stone">{formatDate(nextClass)}</p>
              <p className="text-3xl font-extrabold text-ink mt-1 leading-none">
                {formatTime(nextClass)}
              </p>
            </div>
            {nextLinked ? (
              <Link
                href={`/build/result/${nextLinked.id}`}
                className="shrink-0 text-xs font-semibold text-canvas bg-forest rounded-full px-3 py-1.5 mt-0.5 active:opacity-75 transition-opacity"
              >
                Linked
              </Link>
            ) : (
              <span className="shrink-0 text-xs font-medium text-stone bg-canvas border border-border rounded-full px-3 py-1.5 mt-0.5">
                No routine yet
              </span>
            )}
          </div>
          {nextLinked && (
            <p className="text-xs text-stone -mt-2">
              {nextLinked.name}
            </p>
          )}
        </div>

        <Link
          href="/build"
          className="w-full bg-forest text-canvas font-semibold text-base rounded-2xl py-4 text-center block active:opacity-80 transition-opacity"
        >
          Build routine
        </Link>
      </section>

      {/* Upcoming this week */}
      {thisWeek.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-medium tracking-widest uppercase text-stone">
            Upcoming this week
          </h2>
          <div className="flex flex-col gap-2">
            {thisWeek.map((date, i) => {
              const linked = linkedRoutine(date)
              return (
                <div
                  key={i}
                  className="bg-surface rounded-xl px-4 py-3.5 flex items-center justify-between"
                >
                  <span className="text-sm font-medium text-ink">
                    {formatDate(date)}&nbsp;&middot;&nbsp;{formatTime(date)}
                  </span>
                  {linked ? (
                    <Link
                      href={`/build/result/${linked.id}`}
                      className="text-xs font-semibold text-canvas bg-forest rounded-full px-2.5 py-1 shrink-0 ml-3 active:opacity-75 transition-opacity"
                    >
                      Linked
                    </Link>
                  ) : (
                    <span className="text-xs font-medium text-stone shrink-0 ml-3">
                      No routine
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Recent routines */}
      <section className="flex flex-col gap-3">
        <h2 className="text-xs font-medium tracking-widest uppercase text-stone">
          Recent routines
        </h2>
        {recentRoutines.length === 0 ? (
          <div className="bg-surface rounded-2xl px-5 py-10 flex flex-col items-center text-center gap-1">
            <p className="text-sm font-medium text-stone">Nothing here yet.</p>
            <p className="text-sm text-stone opacity-70">Build your first routine.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {recentRoutines.map(r => (
              <div key={r.id} className="bg-surface rounded-2xl px-5 py-4 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ink truncate">{r.name}</p>
                  <p className="text-xs text-stone mt-0.5">
                    {formatSavedAt(r.savedAt)}&nbsp;&middot;&nbsp;{r.tldr.focus}
                  </p>
                </div>
                <Link
                  href={`/build/result/${r.id}`}
                  className="shrink-0 text-xs font-semibold text-forest bg-canvas border border-border rounded-full px-3 py-1.5 active:opacity-70 transition-opacity"
                >
                  View
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

    </div>
  )
}
