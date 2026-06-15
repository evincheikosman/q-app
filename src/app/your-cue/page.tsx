'use client'

import { useEffect, useState } from 'react'
import type { SavedRoutine } from '@/types/routine'

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

function buildReflection(total: number, topEmphasis: string | null, topArc: string | null): string {
  if (total === 0) {
    return "You haven't built a routine yet. Once you do, this is where Q will start reflecting back what it sees in your teaching — patterns, tendencies, the things you reach for without thinking."
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

export default function YourCuePage() {
  const [routines, setRoutines] = useState<SavedRoutine[]>([])

  useEffect(() => {
    try {
      const stored = localStorage.getItem('q_routines')
      if (stored) setRoutines(JSON.parse(stored))
    } catch {}
  }, [])

  const { total, topEmphasis, topArc } = computeStats(routines)
  const reflection = buildReflection(total, topEmphasis, topArc)

  return (
    <div className="px-5 pt-12 pb-10 flex flex-col gap-8 max-w-lg mx-auto w-full">

      {/* ── Section 1: My Account ── */}
      <section className="flex flex-col gap-5">
        <h1 className="text-3xl font-extrabold text-ink">My Account</h1>

        {/* Identity */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full border-2 border-forest bg-forest/10 flex items-center justify-center shrink-0">
            <span className="text-2xl font-extrabold text-forest">E</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <p className="text-lg font-extrabold text-ink leading-tight">Evîn Cheikosman</p>
            <p className="text-xs text-stone">she/her</p>
            <p className="text-xs font-medium text-stone mt-0.5">Certified Lagree Instructor · Core 40 SF</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-surface rounded-2xl px-3 py-4 flex flex-col gap-1 items-center text-center">
            <p className="text-3xl font-extrabold text-ink">{total}</p>
            <p className="text-xs text-stone leading-snug">Routines built</p>
          </div>
          <div className="bg-surface rounded-2xl px-3 py-4 flex flex-col gap-1 items-center text-center">
            <p className="text-sm font-bold text-ink leading-snug">
              {topEmphasis ?? '—'}
            </p>
            <p className="text-xs text-stone mt-auto leading-snug">Top emphasis</p>
          </div>
          <div className="bg-surface rounded-2xl px-3 py-4 flex flex-col gap-1 items-center text-center">
            <p className="text-sm font-bold text-ink leading-snug">
              {topArc ? shortArcLabel(topArc) : '—'}
            </p>
            <p className="text-xs text-stone mt-auto leading-snug">Fav energy arc</p>
          </div>
        </div>

        {/* Archetype */}
        <div className="bg-forest/8 rounded-2xl px-5 py-4">
          <p className="text-xs font-medium text-stone uppercase tracking-widest mb-1.5">Archetype</p>
          <p className="text-sm font-semibold text-ink">
            The Architect — builds with intention, never repeats a routine
          </p>
        </div>
      </section>

      {/* ── Divider ── */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs font-medium text-stone uppercase tracking-widest">Your Cue</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* ── Section 2: Your Cue ── */}
      <section className="flex flex-col gap-4">
        <div className="bg-surface rounded-2xl px-5 py-5">
          <p className="text-sm text-ink leading-relaxed italic">{reflection}</p>
        </div>
      </section>

    </div>
  )
}
