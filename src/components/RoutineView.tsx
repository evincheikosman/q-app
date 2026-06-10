'use client'

import React from 'react'
import { IconArrowsUpDown, IconX } from '@tabler/icons-react'
import type { Block, Tldr } from '@/types/routine'
import AnatomyTooltip from '@/components/AnatomyTooltip'

// ─── Swap helpers ─────────────────────────────────────────────────────────────

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

interface Props {
  classOpener: string
  tldr: Tldr
  totalMinutes: number
  blocks: Block[]
  openSwap: string | null
  onOpenSwap: (key: string | null) => void
  onSwapMove: (bi: number, mi: number, newName: string) => void
  footer?: React.ReactNode
}

export default function RoutineView({
  classOpener,
  tldr,
  totalMinutes,
  blocks,
  openSwap,
  onOpenSwap,
  onSwapMove,
  footer,
}: Props) {
  const totalMoves = blocks.reduce((sum, b) => sum + b.moves.length, 0)
  const swapKey = (bi: number, mi: number) => `${bi}-${mi}`

  return (
    <div className="px-5 pt-10 pb-10 max-w-lg mx-auto w-full flex flex-col gap-8">

      {/* Class opener */}
      <div className="flex flex-col gap-3">
        <p className="text-xs font-medium text-stone uppercase tracking-widest">Class opener</p>
        <p className="text-base italic text-ink leading-relaxed">{classOpener}</p>
      </div>

      {/* TLDR */}
      <div className="bg-surface rounded-2xl px-5 py-4">
        <p className="text-xs font-medium text-stone uppercase tracking-widest mb-3">At a glance</p>
        <div className="flex flex-col gap-2">
          <p className="text-xs text-ink">
            <span className="font-semibold">Focus:</span> {tldr.focus}
          </p>
          <p className="text-xs text-ink">
            <span className="font-semibold">Where they&apos;ll feel it:</span>{' '}
            <AnatomyTooltip text={tldr.whereTheyWillFeelIt} />
          </p>
          <p className="text-xs text-stone">
            <span className="font-semibold text-ink">Note:</span> {tldr.note}
          </p>
        </div>
        <div className="flex gap-4 mt-3 pt-3 border-t border-border">
          <div>
            <p className="text-xs text-stone">Duration</p>
            <p className="text-sm font-semibold text-ink">{totalMinutes} min</p>
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
                  <div key={mi} className="flex flex-col gap-1.5">
                    {move.springChange && (
                      <div className="flex justify-center py-0.5">
                        <span className="text-xs font-semibold text-canvas bg-forest rounded-full px-3.5 py-1.5">
                          Change to {move.springChange}
                        </span>
                      </div>
                    )}
                  <div
                    className="bg-surface rounded-xl px-4 py-3.5 flex flex-col gap-1.5"
                  >
                    <div className="flex items-center gap-2">
                      <p className="flex-1 text-sm font-semibold text-ink">{move.name}</p>
                      <span className="shrink-0 text-xs font-medium text-stone bg-canvas border border-border rounded-full px-2.5 py-0.5">
                        {move.duration} min
                      </span>
                      <button
                        onClick={() => onOpenSwap(isOpen ? null : key)}
                        aria-label={isOpen ? 'Close swap' : 'Swap move'}
                        className="shrink-0 p-1 rounded-lg text-stone hover:text-ink transition-colors"
                      >
                        {isOpen
                          ? <IconX size={14} stroke={2} />
                          : <IconArrowsUpDown size={14} stroke={2} />}
                      </button>
                    </div>

                    <p className="text-xs italic text-stone leading-relaxed">{move.cue}</p>

                    {isOpen && (
                      <div className="mt-1 pt-2.5 border-t border-border flex flex-col gap-2">
                        <p className="text-xs font-medium text-stone">Swap with:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {alts.map(alt => (
                            <button
                              key={alt}
                              onClick={() => onSwapMove(bi, mi, alt)}
                              className="rounded-full px-3 py-1.5 text-xs font-medium bg-canvas border border-border text-ink active:bg-border transition-colors"
                            >
                              {alt}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  </div>
                )
              })}
            </div>

          </div>
        ))}
      </div>

      {footer && <div className="pt-2 flex flex-col gap-4">{footer}</div>}

    </div>
  )
}
