import type { Block } from '@/types/routine'

/**
 * Estimates class difficulty from routine content.
 * Heuristic: share of heavy-leg moves + total volume.
 * (Until difficulty becomes an explicit build input.)
 */

const HEAVY_MOVES = new Set([
  'Spider Lunge', 'Side Kick', 'Skater', 'Ninja Kick', "Runner's Lunge",
  "Reverse Runner's Lunge", 'Spider Kick', 'Mega Donkey Kick',
  'Heavy Leg Press C-Bar', 'Leg Sweep', 'Froggy Kick', 'Super Lunge',
  'Deadlift', 'Single Leg Deadlift', 'Outer Thighs', 'Heavy Squats',
  'Bungee Kick', 'Bungee Hamstring Curl', 'Giant Reverse Plank to Pike',
  'Giant Reverse Bear', 'Giant Bear', 'Wheelbarrow', 'Twisted Wheelbarrow',
])

export type Difficulty = 'easy' | 'intermediate' | 'advanced'

export function estimateDifficulty(blocks: Block[]): Difficulty {
  const moves = blocks.flatMap(b => b.moves)
  if (moves.length === 0) return 'intermediate'
  const heavyShare = moves.filter(m => HEAVY_MOVES.has(m.name)).length / moves.length
  if (heavyShare >= 0.28 || moves.length >= 28) return 'advanced'
  if (heavyShare >= 0.12) return 'intermediate'
  return 'easy'
}
