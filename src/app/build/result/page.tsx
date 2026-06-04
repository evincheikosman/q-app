'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Move {
  name: string
  duration: number
  bilateral: boolean
  cue: string
}

interface Block {
  name: string
  spring: string
  moves: Move[]
}

interface Routine {
  classOpener: string
  tldr: string
  totalMinutes: number
  blocks: Block[]
}

export default function ResultPage() {
  const router = useRouter()
  const [routine, setRoutine] = useState<Routine | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem('q_routine')
    if (!stored) {
      router.replace('/build')
      return
    }
    try {
      setRoutine(JSON.parse(stored))
    } catch {
      router.replace('/build')
    }
  }, [router])

  if (!routine) {
    return (
      <div className="flex items-center justify-center h-[calc(100dvh-72px)]">
        <p className="text-sm text-stone">Loading…</p>
      </div>
    )
  }

  const totalMoves = routine.blocks.reduce((sum, b) => sum + b.moves.length, 0)

  return (
    <div className="px-5 pt-10 pb-10 max-w-lg mx-auto w-full flex flex-col gap-8">

      {/* Class opener */}
      <div className="flex flex-col gap-3">
        <p className="text-xs font-medium text-stone uppercase tracking-widest">Class opener</p>
        <p className="text-base italic text-ink leading-relaxed">
          {routine.classOpener}
        </p>
      </div>

      {/* TLDR */}
      <div className="bg-surface rounded-2xl px-5 py-4">
        <p className="text-xs font-medium text-stone uppercase tracking-widest mb-2">At a glance</p>
        <p className="text-sm text-ink leading-relaxed">{routine.tldr}</p>
        <div className="flex gap-4 mt-3 pt-3 border-t border-border">
          <div>
            <p className="text-xs text-stone">Duration</p>
            <p className="text-sm font-semibold text-ink">{routine.totalMinutes} min</p>
          </div>
          <div>
            <p className="text-xs text-stone">Moves</p>
            <p className="text-sm font-semibold text-ink">{totalMoves}</p>
          </div>
          <div>
            <p className="text-xs text-stone">Blocks</p>
            <p className="text-sm font-semibold text-ink">{routine.blocks.length}</p>
          </div>
        </div>
      </div>

      {/* Blocks */}
      <div className="flex flex-col gap-6">
        {routine.blocks.map((block, bi) => (
          <div key={bi} className="flex flex-col gap-3">

            {/* Block header */}
            <div className="flex items-baseline justify-between">
              <h2 className="text-xs font-bold uppercase tracking-widest text-forest">
                {block.name}
              </h2>
              <span className="text-xs font-medium text-stone">{block.spring}</span>
            </div>

            {/* Moves */}
            <div className="flex flex-col gap-2">
              {block.moves.map((move, mi) => (
                <div
                  key={mi}
                  className="bg-surface rounded-xl px-4 py-3.5 flex flex-col gap-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-ink">{move.name}</p>
                    <span className="shrink-0 text-xs font-medium text-stone bg-canvas border border-border rounded-full px-2.5 py-0.5">
                      {move.duration} min
                    </span>
                  </div>
                  <p className="text-xs italic text-stone leading-relaxed">{move.cue}</p>
                </div>
              ))}
            </div>

          </div>
        ))}
      </div>

      {/* Save button */}
      <div className="pt-2">
        <button
          disabled
          className="w-full h-14 rounded-2xl font-semibold text-base bg-forest text-canvas opacity-40 cursor-not-allowed"
        >
          Save routine
        </button>
        <p className="text-xs text-center text-stone mt-2">Saving coming soon</p>
      </div>

      {/* Build another */}
      <Link
        href="/build"
        className="text-sm font-medium text-center text-stone underline underline-offset-2"
      >
        Build another
      </Link>

    </div>
  )
}
