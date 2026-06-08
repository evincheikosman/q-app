'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { IconArrowsUpDown, IconX } from '@tabler/icons-react'

// ─── Types ────────────────────────────────────────────────────────────────────

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

interface Tldr {
  focus: string
  whereTheyWillFeelIt: string
  note: string
}

interface Routine {
  classOpener: string
  tldr: Tldr
  totalMinutes: number
  blocks: Block[]
}

// ─── Swap alternatives ────────────────────────────────────────────────────────

const HEAVY_LEG_SET = new Set([
  'Spider Lunge', 'Side Kick', 'Skater', 'Ninja Kick', "Runner's Lunge",
  "Reverse Runner's Lunge", 'Spider Kick', 'Mega Donkey Kick',
  'Heavy Leg Press C-Bar', 'Leg Sweep', 'Froggy Kick', 'Super Lunge',
  'Deadlift', 'Single Leg Deadlift', 'Outer Thighs', 'Heavy Squats',
  'Bungee Kick', 'Bungee Hamstring Curl',
])

const SWAP_POOL: Record<string, string[]> = {
  core: [
    'Plank', 'Forearm Plank', 'Bear', 'Reverse Bear', 'Super Crunch',
    'Wheelbarrow', 'Plank to Pike', 'Catfish', 'Bungee Crunch', 'S-Strap Crunch',
    'Giant Bear', 'Giant Kneeling Crunch', 'Reverse Catfish', 'Spoon',
  ],
  'light-leg': [
    'Elevator Lunge', 'Elevator Split Lunge', 'Floor Lunge', 'Express Lunge',
    'Back Lunge', 'Single Leg Squat', 'Well Lunge', 'Escalator Lunge',
    'Fifth Lunge', 'Hamstring Curls', 'Light Squats', 'Giant Single Leg Squat',
  ],
  'heavy-leg': [
    'Spider Lunge', 'Side Kick', 'Skater', "Runner's Lunge", 'Deadlift',
    'Ninja Kick', 'Leg Sweep', 'Spider Kick', 'Super Lunge', 'Froggy Kick',
    'Single Leg Deadlift', 'Bungee Kick',
  ],
  oblique: [
    'Mermaid', 'Mermaid Twist', 'Soul Train', 'Side Plank', 'Kneeling Side Crunch',
    'Twisted Wheelbarrow', 'French Twist', 'Dancing Bear', 'Teaser', 'Torso Twist',
    'Single Side Bear', 'Scrambled Eggs',
  ],
  arm: [
    'Serve the Platter', 'Hug a Tree', 'Shoulder Press', 'Lateral Raise',
    'Tricep Extension', 'Chest Opener', 'Sexy Back', 'Kneeling Bicep Curl',
    'Mega Chest Press', 'Seated Row', 'Mega Shoulder Press', 'Mega Row',
  ],
}

function getMoveCategory(blockName: string, moveName: string): string {
  const bn = blockName.toLowerCase()
  if (bn.includes('leg')) return HEAVY_LEG_SET.has(moveName) ? 'heavy-leg' : 'light-leg'
  if (bn.includes('oblique')) return 'oblique'
  if (bn.includes('arm')) return 'arm'
  return 'core'
}

function getAlternatives(blockName: string, moveName: string): string[] {
  const cat = getMoveCategory(blockName, moveName)
  return (SWAP_POOL[cat] ?? []).filter(m => m !== moveName).slice(0, 4)
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ResultPage() {
  const router = useRouter()
  const [routine, setRoutine] = useState<Omit<Routine, 'blocks'> | null>(null)
  const [blocks, setBlocks] = useState<Block[]>([])
  const [openSwap, setOpenSwap] = useState<string | null>(null) // `${bi}-${mi}`
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('q_routine')
    if (!stored) { router.replace('/build'); return }
    try {
      const r: Routine = JSON.parse(stored)
      const { blocks: b, ...meta } = r
      setRoutine(meta)
      setBlocks(b)
    } catch {
      router.replace('/build')
    }
  }, [router])

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
    if (!routine) return
    localStorage.setItem('q_routine', JSON.stringify({ ...routine, blocks }))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (!routine) {
    return (
      <div className="flex items-center justify-center h-[calc(100dvh-72px)]">
        <p className="text-sm text-stone">Loading…</p>
      </div>
    )
  }

  const totalMoves = blocks.reduce((sum, b) => sum + b.moves.length, 0)
  const swapKey = (bi: number, mi: number) => `${bi}-${mi}`

  return (
    <div className="px-5 pt-10 pb-10 max-w-lg mx-auto w-full flex flex-col gap-8">

      {/* Class opener */}
      <div className="flex flex-col gap-3">
        <p className="text-xs font-medium text-stone uppercase tracking-widest">Class opener</p>
        <p className="text-base italic text-ink leading-relaxed">{routine.classOpener}</p>
      </div>

      {/* TLDR */}
      <div className="bg-surface rounded-2xl px-5 py-4">
        <p className="text-xs font-medium text-stone uppercase tracking-widest mb-3">At a glance</p>
        <div className="flex flex-col gap-2">
          <p className="text-xs text-ink">
            <span className="font-semibold">Focus:</span> {routine.tldr.focus}
          </p>
          <p className="text-xs text-ink">
            <span className="font-semibold">Where they'll feel it:</span> {routine.tldr.whereTheyWillFeelIt}
          </p>
          <p className="text-xs text-stone">
            <span className="font-semibold text-ink">Note:</span> {routine.tldr.note}
          </p>
        </div>
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
            <p className="text-sm font-semibold text-ink">{blocks.length}</p>
          </div>
        </div>
      </div>

      {/* Blocks */}
      <div className="flex flex-col gap-6">
        {blocks.map((block, bi) => (
          <div key={bi} className="flex flex-col gap-3">

            <div className="flex items-baseline justify-between">
              <h2 className="text-xs font-bold uppercase tracking-widest text-forest">
                {block.name}
              </h2>
              <span className="text-xs font-medium text-stone">{block.spring}</span>
            </div>

            <div className="flex flex-col gap-2">
              {block.moves.map((move, mi) => {
                const key = swapKey(bi, mi)
                const isOpen = openSwap === key
                const alts = getAlternatives(block.name, move.name)

                return (
                  <div
                    key={mi}
                    className="bg-surface rounded-xl px-4 py-3.5 flex flex-col gap-1.5"
                  >
                    {/* Move row */}
                    <div className="flex items-center gap-2">
                      <p className="flex-1 text-sm font-semibold text-ink">{move.name}</p>
                      <span className="shrink-0 text-xs font-medium text-stone bg-canvas border border-border rounded-full px-2.5 py-0.5">
                        {move.duration} min
                      </span>
                      <button
                        onClick={() => setOpenSwap(isOpen ? null : key)}
                        aria-label={isOpen ? 'Close swap' : 'Swap move'}
                        className="shrink-0 p-1 rounded-lg text-stone hover:text-ink transition-colors"
                      >
                        {isOpen
                          ? <IconX size={14} stroke={2} />
                          : <IconArrowsUpDown size={14} stroke={2} />}
                      </button>
                    </div>

                    <p className="text-xs italic text-stone leading-relaxed">{move.cue}</p>

                    {/* Swap panel */}
                    {isOpen && (
                      <div className="mt-1 pt-2.5 border-t border-border flex flex-col gap-2">
                        <p className="text-xs font-medium text-stone">Swap with:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {alts.map(alt => (
                            <button
                              key={alt}
                              onClick={() => swapMove(bi, mi, alt)}
                              className="rounded-full px-3 py-1.5 text-xs font-medium bg-canvas border border-border text-ink active:bg-border transition-colors"
                            >
                              {alt}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

          </div>
        ))}
      </div>

      {/* Save button */}
      <div className="pt-2">
        <button
          onClick={handleSave}
          className={`w-full h-14 rounded-2xl font-semibold text-base transition-all active:opacity-80 ${
            saved
              ? 'bg-moss text-canvas'
              : 'bg-forest text-canvas'
          }`}
        >
          {saved ? 'Saved ✓' : 'Save routine'}
        </button>
      </div>

      <Link
        href="/build"
        className="text-sm font-medium text-center text-stone underline underline-offset-2"
      >
        Build another
      </Link>

    </div>
  )
}
