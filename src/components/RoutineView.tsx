'use client'

import React, { useState } from 'react'
import {
  IconArrowsUpDown,
  IconX,
  IconChevronDown,
  IconChevronUp,
  IconTrash,
  IconPlus,
} from '@tabler/icons-react'
import type { Block, Move, Tldr } from '@/types/routine'
import AnatomyTooltip from '@/components/AnatomyTooltip'
import { PenNote, ScribbleSweat, PEN } from '@/components/Scribble'
import { estimateDifficulty } from '@/lib/difficulty'
import { useUndoToast } from '@/components/Toast'

// ─── Spring chips ─────────────────────────────────────────────────────────────
// Real Lagree spring colors, straight from the machine (and Evîn's annotated photo)

const SPRING_COLORS: Record<string, string> = {
  yellow: '#E7C93F',
  red: '#C24B37',
  blue: '#2E51E6',
  green: '#3E7C4F',
  black: '#111418',
  white: '#D9D4CA',
}

/** Parses "1 red + 1 yellow" → colored dots + label */
function SpringChip({ spring }: { spring: string }) {
  const dots: string[] = []
  const re = /(\d+)\s*(yellow|red|blue|green|black|white)/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(spring)) !== null) {
    const n = Math.min(parseInt(m[1], 10) || 1, 4)
    for (let i = 0; i < n; i++) dots.push(SPRING_COLORS[m[2].toLowerCase()])
  }
  return (
    <span className="inline-flex items-center gap-1.5 bg-white border border-border rounded-full pl-2 pr-2.5 py-1 shrink-0">
      {dots.length > 0 && (
        <span className="flex items-center gap-0.5">
          {dots.map((c, i) => (
            <span key={i} className="w-2 h-2 rounded-full" style={{ backgroundColor: c }} />
          ))}
        </span>
      )}
      <span className="text-[10px] font-bold uppercase tracking-wide text-ink">{spring}</span>
    </span>
  )
}

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

function getBlockCategory(blockName: string): string {
  const bn = blockName.toLowerCase()
  if (bn.includes('leg')) return 'light-leg'
  if (bn.includes('oblique')) return 'oblique'
  if (bn.includes('arm')) return 'arm'
  return 'core'
}

/** Suggestions for adding a move to a block — anything from the block's pool not already in it */
function getAddSuggestions(block: Block): string[] {
  const used = new Set(block.moves.map(m => m.name))
  const cat = getBlockCategory(block.name)
  const pool = [...(SWAP_POOL[cat] ?? []), ...(cat === 'light-leg' ? SWAP_POOL['heavy-leg'] : [])]
  return pool.filter(m => !used.has(m)).slice(0, 5)
}

function makeMove(name: string): Move {
  return { name, duration: 1, bilateral: false, cue: 'Your cue — coach it your way.' }
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
  /** Enables full editing: remove/add/reorder moves, reorder blocks */
  onUpdateBlocks?: (next: Block[]) => void
  /** "Built to order" receipts — Q acknowledging the instructor's explicit choices */
  builtToOrder?: string[]
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
  onUpdateBlocks,
  builtToOrder,
  footer,
}: Props) {
  const totalMoves = blocks.reduce((sum, b) => sum + b.moves.length, 0)
  // Live total — recomputed on every edit; 32 is the Lagree format target
  const liveMinutes = blocks.reduce(
    (sum, b) => sum + b.moves.reduce((s, m) => s + (m.duration || 0), 0),
    0
  )
  const TARGET_MINUTES = 32
  const minutesDelta = liveMinutes - (totalMinutes || TARGET_MINUTES)
  const swapKey = (bi: number, mi: number) => `${bi}-${mi}`
  const [showCues, setShowCues] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [addOpenFor, setAddOpenFor] = useState<number | null>(null)
  const [customMove, setCustomMove] = useState('')
  const canEdit = !!onUpdateBlocks
  const { toast, show: showToast } = useUndoToast()

  // ── Editing helpers (no-ops unless onUpdateBlocks is provided) ──
  function removeMove(bi: number, mi: number) {
    const prev = blocks
    const name = blocks[bi]?.moves[mi]?.name ?? 'Move'
    onUpdateBlocks?.(
      blocks.map((b, i) => (i === bi ? { ...b, moves: b.moves.filter((_, j) => j !== mi) } : b))
    )
    onOpenSwap(null)
    showToast(`${name} removed`, () => onUpdateBlocks?.(prev))
  }
  function addMove(bi: number, name: string) {
    const clean = name.trim()
    if (!clean) return
    onUpdateBlocks?.(
      blocks.map((b, i) => (i === bi ? { ...b, moves: [...b.moves, makeMove(clean)] } : b))
    )
    setCustomMove('')
    setAddOpenFor(null)
  }
  function swapCustom(bi: number, mi: number, name: string) {
    const clean = name.trim()
    if (!clean) return
    onSwapMove(bi, mi, clean)
    setCustomMove('')
  }
  function moveMove(bi: number, mi: number, dir: -1 | 1) {
    const target = mi + dir
    if (target < 0 || target >= blocks[bi].moves.length) return
    onUpdateBlocks?.(
      blocks.map((b, i) => {
        if (i !== bi) return b
        const moves = [...b.moves]
        ;[moves[mi], moves[target]] = [moves[target], moves[mi]]
        return { ...b, moves }
      })
    )
    onOpenSwap(swapKey(bi, target))
  }
  function moveBlock(bi: number, dir: -1 | 1) {
    const target = bi + dir
    if (target < 0 || target >= blocks.length) return
    const next = [...blocks]
    ;[next[bi], next[target]] = [next[target], next[bi]]
    onUpdateBlocks?.(next)
    onOpenSwap(null)
  }
  const focusChips = tldr.focus.split(/,\s*/).filter(Boolean)
  const difficulty = estimateDifficulty(blocks)

  return (
    <div className="px-5 pt-10 pb-10 max-w-lg mx-auto w-full flex flex-col gap-7">
      {toast}

      {/* Class opener — the page's editorial moment */}
      <div
        className="rounded-3xl px-6 py-6 relative overflow-hidden"
        style={{ backgroundColor: '#0D0D0F' }}
      >
        <span
          aria-hidden
          className="absolute font-extrabold pointer-events-none select-none"
          style={{
            right: '-34px',
            top: '-30px',
            fontSize: '150px',
            lineHeight: 1,
            color: '#AEC8F5',
            opacity: 0.18,
            fontVariationSettings: "'opsz' 96",
          }}
        >
          Q
        </span>
        <p className="text-[10px] font-bold uppercase tracking-[3px] relative mb-3" style={{ color: '#AEC8F5' }}>
          Class opener
        </p>
        <p className="text-lg font-bold text-white leading-snug relative">{classOpener}</p>
      </div>

      {/* At a glance — numbers first, prose on demand. Minutes are LIVE:
          editing moves recomputes the total against the 32-min Lagree format. */}
      <div className="bg-white rounded-3xl px-5 py-5 shadow-card border border-border">
        <div className="flex items-start gap-6">
          {[
            [String(liveMinutes), 'min'],
            [String(totalMoves), 'moves'],
            [String(blocks.length), 'blocks'],
          ].map(([n, label]) => (
            <div key={label} className="flex items-baseline gap-1.5">
              <span
                className="font-extrabold text-ink"
                style={{ fontSize: '30px', lineHeight: 1, fontVariationSettings: "'opsz' 96" }}
              >
                {n}
              </span>
              <span className="text-xs font-semibold uppercase tracking-wide text-stone">{label}</span>
            </div>
          ))}
          {minutesDelta !== 0 && (
            <PenNote size={15} rotate="-3deg" className="ml-auto mt-1">
              {Math.abs(minutesDelta)} min {minutesDelta > 0 ? 'over' : 'under'}!
            </PenNote>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5 mt-4">
          {focusChips.map(chip => (
            <span
              key={chip}
              className="text-xs font-bold rounded-full px-3 py-1.5 capitalize"
              style={{ backgroundColor: '#0D0D0F', color: '#AEC8F5' }}
            >
              {chip}
            </span>
          ))}
          {/* Difficulty — noted in the margin like an instructor would */}
          <span className="flex items-center gap-1.5 ml-1.5">
            <PenNote size={16} rotate="-3deg">
              {difficulty}
              {difficulty === 'advanced' ? '!!' : ''}
            </PenNote>
            {difficulty === 'advanced' && (
              <ScribbleSweat color={PEN.violet} width={24} style={{ transform: 'rotate(6deg)' }} />
            )}
          </span>
        </div>

        <button
          onClick={() => setShowDetails(d => !d)}
          className="flex items-center gap-1 mt-4 text-xs font-bold text-ink underline decoration-powder decoration-2 underline-offset-2"
        >
          {showDetails ? 'Hide the details' : 'Where they’ll feel it'}
          <IconChevronDown
            size={14}
            stroke={2.5}
            style={{ transform: showDetails ? 'rotate(180deg)' : 'none', transition: 'transform 200ms' }}
          />
        </button>
        {showDetails && (
          <div className="flex flex-col gap-2.5 mt-3 pt-3 border-t border-border">
            <p className="text-sm text-ink leading-relaxed">
              <AnatomyTooltip text={tldr.whereTheyWillFeelIt} />
            </p>
            <p className="text-sm text-stone leading-relaxed">
              <span className="font-bold text-ink">Note:</span> {tldr.note}
            </p>
          </div>
        )}
      </div>

      {/* Built to order — Q showing its work on the instructor's explicit asks */}
      {builtToOrder && builtToOrder.length > 0 && (
        <div className="flex gap-3.5 -mt-2">
          <div className="w-[3px] rounded-full shrink-0" style={{ backgroundColor: '#AEC8F5' }} />
          <div className="flex flex-col gap-1.5 py-0.5">
            <PenNote size={15} rotate="-2deg">built to order</PenNote>
            {builtToOrder.map((line, i) => (
              <p key={i} className="text-sm text-ink leading-relaxed flex gap-2">
                <span className="font-bold shrink-0" style={{ color: '#AEC8F5' }}>✓</span>
                {line}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Cue visibility toggle */}
      <div className="flex items-center justify-between -mb-2">
        <p className="text-xs font-semibold tracking-widest uppercase text-stone">The routine</p>
        <button
          onClick={() => setShowCues(c => !c)}
          className={`text-xs font-bold rounded-full px-3.5 py-1.5 border-2 transition-all ${
            showCues ? 'bg-forest text-white border-forest' : 'bg-white text-ink border-border'
          }`}
        >
          {showCues ? 'Cues on' : 'Show cues'}
        </button>
      </div>

      {/* Blocks */}
      <div className="flex flex-col gap-6">
        {blocks.map((block, bi) => (
          <div key={bi} className="flex flex-col gap-3">

            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 min-w-0">
                <h2 className="text-sm font-extrabold uppercase tracking-widest text-forest truncate">
                  {block.name}
                </h2>
                {canEdit && (
                  <span className="flex items-center shrink-0">
                    <button
                      onClick={() => moveBlock(bi, -1)}
                      disabled={bi === 0}
                      aria-label="Move block up"
                      className="p-0.5 text-stone hover:text-ink disabled:opacity-25 transition-colors"
                    >
                      <IconChevronUp size={15} stroke={2.5} />
                    </button>
                    <button
                      onClick={() => moveBlock(bi, 1)}
                      disabled={bi === blocks.length - 1}
                      aria-label="Move block down"
                      className="p-0.5 text-stone hover:text-ink disabled:opacity-25 transition-colors"
                    >
                      <IconChevronDown size={15} stroke={2.5} />
                    </button>
                  </span>
                )}
              </div>
              <SpringChip spring={block.spring} />
            </div>

            <div className="flex flex-col gap-2">
              {block.moves.map((move, mi) => {
                const key = swapKey(bi, mi)
                const isOpen = openSwap === key
                const alts = getAlternatives(block.name, move.name)

                return (
                  <div key={mi} className="flex flex-col gap-1.5">
                    {move.springChange && (
                      <div className="flex justify-center py-1">
                        <span
                          className="inline-flex items-center gap-2 text-xs font-bold rounded-full px-3.5 py-1.5"
                          style={{ backgroundColor: '#0D0D0F', color: '#AEC8F5' }}
                        >
                          <IconArrowsUpDown size={12} stroke={2.5} />
                          Change to {move.springChange}
                        </span>
                      </div>
                    )}
                  <div className="bg-white rounded-xl px-4 py-3.5 flex flex-col shadow-card">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="shrink-0 text-[10px] font-extrabold text-stone w-5 text-right"
                        style={{ fontVariationSettings: "'opsz' 96" }}
                      >
                        {String(mi + 1).padStart(2, '0')}
                      </span>
                      <p className="flex-1 text-sm font-bold text-ink">{move.name}</p>
                      <span className="shrink-0 text-[10px] font-semibold text-stone uppercase tracking-wide">
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

                    {showCues && (
                      <p className="text-xs text-stone leading-relaxed mt-1.5 pl-[30px]">{move.cue}</p>
                    )}

                    {isOpen && (
                      <div className="mt-2.5 pt-2.5 border-t border-border flex flex-col gap-2.5">
                        <p className="text-xs font-bold text-stone uppercase tracking-wide">Swap with</p>
                        <div className="flex flex-wrap gap-1.5">
                          {alts.map(alt => (
                            <button
                              key={alt}
                              onClick={() => onSwapMove(bi, mi, alt)}
                              className="rounded-full px-3 py-1.5 text-xs font-semibold bg-canvas border border-border text-ink hover:border-forest active:bg-border transition-colors"
                            >
                              {alt}
                            </button>
                          ))}
                        </div>
                        {/* Any move — not just the suggestions */}
                        <div className="flex items-center gap-1.5">
                          <input
                            value={customMove}
                            onChange={e => setCustomMove(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') swapCustom(bi, mi, customMove)
                            }}
                            placeholder="or type any move…"
                            className="flex-1 min-w-0 text-xs rounded-full px-3 py-1.5 bg-canvas border border-border text-ink placeholder:text-stone/60 outline-none focus:border-forest transition-colors"
                          />
                          <button
                            onClick={() => swapCustom(bi, mi, customMove)}
                            disabled={!customMove.trim()}
                            className="shrink-0 text-xs font-bold rounded-full px-3 py-1.5 disabled:opacity-30 transition-opacity"
                            style={{ backgroundColor: '#0D0D0F', color: '#AEC8F5' }}
                          >
                            Swap
                          </button>
                        </div>
                        {canEdit && (
                          <div className="flex items-center justify-between pt-0.5">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => moveMove(bi, mi, -1)}
                                disabled={mi === 0}
                                aria-label="Move up"
                                className="p-1 rounded-lg text-stone hover:text-ink disabled:opacity-25 transition-colors"
                              >
                                <IconChevronUp size={15} stroke={2.5} />
                              </button>
                              <button
                                onClick={() => moveMove(bi, mi, 1)}
                                disabled={mi === block.moves.length - 1}
                                aria-label="Move down"
                                className="p-1 rounded-lg text-stone hover:text-ink disabled:opacity-25 transition-colors"
                              >
                                <IconChevronDown size={15} stroke={2.5} />
                              </button>
                              <span className="text-[10px] text-stone uppercase tracking-wide ml-0.5">Reorder</span>
                            </div>
                            <button
                              onClick={() => removeMove(bi, mi)}
                              aria-label="Remove move"
                              className="flex items-center gap-1 text-xs font-semibold text-stone hover:text-ink transition-colors"
                            >
                              <IconTrash size={13} stroke={2} />
                              Remove
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  </div>
                )
              })}

              {/* Add a move to this block — suggestions + any move */}
              {canEdit && (
                addOpenFor === bi ? (
                  <div className="bg-white rounded-xl px-4 py-3.5 flex flex-col gap-2.5 shadow-card border border-border">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-stone uppercase tracking-wide">
                        Add to {block.name}
                      </p>
                      <button
                        onClick={() => { setAddOpenFor(null); setCustomMove('') }}
                        aria-label="Close"
                        className="p-1 text-stone hover:text-ink transition-colors"
                      >
                        <IconX size={14} stroke={2} />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {getAddSuggestions(block).map(s => (
                        <button
                          key={s}
                          onClick={() => addMove(bi, s)}
                          className="rounded-full px-3 py-1.5 text-xs font-semibold bg-canvas border border-border text-ink hover:border-forest active:bg-border transition-colors"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input
                        value={customMove}
                        onChange={e => setCustomMove(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') addMove(bi, customMove)
                        }}
                        placeholder="or type any move…"
                        autoFocus
                        className="flex-1 min-w-0 text-xs rounded-full px-3 py-1.5 bg-canvas border border-border text-ink placeholder:text-stone/60 outline-none focus:border-forest transition-colors"
                      />
                      <button
                        onClick={() => addMove(bi, customMove)}
                        disabled={!customMove.trim()}
                        className="shrink-0 text-xs font-bold rounded-full px-3 py-1.5 disabled:opacity-30 transition-opacity"
                        style={{ backgroundColor: '#0D0D0F', color: '#AEC8F5' }}
                      >
                        Add
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => { setAddOpenFor(bi); setCustomMove('') }}
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-border py-2.5 text-xs font-semibold text-stone hover:text-ink hover:border-forest transition-colors"
                  >
                    <IconPlus size={13} stroke={2.5} />
                    Add move
                  </button>
                )
              )}
            </div>

          </div>
        ))}
      </div>

      {footer && <div className="pt-2 flex flex-col gap-4">{footer}</div>}

    </div>
  )
}
