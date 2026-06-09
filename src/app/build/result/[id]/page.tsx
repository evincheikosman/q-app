'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import RoutineView from '@/components/RoutineView'
import type { Block, SavedRoutine, SlotDetail } from '@/types/routine'

function generateName(selectedSlots: SlotDetail[], savedAt: number): string {
  if (selectedSlots.length === 0) {
    const d = new Date(savedAt)
    return `Practice — ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
  }
  const slot = selectedSlots[0]
  const date = new Date(slot.date)
  const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return `${slot.slotLabel} — ${dateStr}`
}

export default function ViewRoutinePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ duplicate?: string }>
}) {
  const { id } = use(params)
  const { duplicate } = use(searchParams)
  const isDuplicate = duplicate === 'true'

  const router = useRouter()
  const [routine, setRoutine] = useState<SavedRoutine | null>(null)
  const [blocks, setBlocks] = useState<Block[]>([])
  const [openSwap, setOpenSwap] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('q_routines')
      if (!stored) { router.replace('/library'); return }
      const routines: SavedRoutine[] = JSON.parse(stored)
      const found = routines.find(r => r.id === Number(id))
      if (!found) { router.replace('/library'); return }
      setRoutine(found)
      setBlocks(found.blocks)
    } catch {
      router.replace('/library')
    }
  }, [id, router])

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

  function handleTeachAgain() {
    if (!routine) return
    localStorage.setItem('q_build_prefill', JSON.stringify({
      selectedClasses: routine.selectedClasses,
      selectedEmphasis: routine.selectedEmphasis,
      energyArc: routine.energyArc,
      vibe: routine.vibe,
    }))
    router.push('/build')
  }

  function handleSaveAsNew() {
    if (!routine || saving) return
    setSaving(true)
    const savedAt = Date.now()
    const name = generateName(routine.selectedSlots ?? [], savedAt)

    const newRoutine: SavedRoutine = {
      ...routine,
      id: savedAt,
      name,
      savedAt,
      blocks,
      favorited: false,
    }

    const existing: SavedRoutine[] = (() => {
      try { return JSON.parse(localStorage.getItem('q_routines') ?? '[]') } catch { return [] }
    })()
    localStorage.setItem('q_routines', JSON.stringify([...existing, newRoutine]))

    setSaved(true)
    setTimeout(() => router.push('/home'), 1100)
  }

  if (!routine) {
    return (
      <div className="flex items-center justify-center h-[calc(100dvh-72px)]">
        <p className="text-sm text-stone">Loading…</p>
      </div>
    )
  }

  return (
    <>
      {/* Back link */}
      <div className="px-5 pt-8 max-w-lg mx-auto w-full">
        <Link
          href="/library"
          className="text-xs font-medium text-stone hover:text-ink transition-colors"
        >
          ← Library
        </Link>
        <p className="text-lg font-bold text-ink mt-2 leading-snug">
          {isDuplicate ? `${routine.name} — copy` : routine.name}
        </p>
      </div>

      <RoutineView
        classOpener={routine.classOpener}
        tldr={routine.tldr}
        totalMinutes={routine.totalMinutes}
        blocks={blocks}
        openSwap={openSwap}
        onOpenSwap={setOpenSwap}
        onSwapMove={swapMove}
        footer={
          isDuplicate ? (
            <button
              onClick={handleSaveAsNew}
              disabled={saving}
              className={`w-full h-14 rounded-2xl font-semibold text-base transition-all active:opacity-80 disabled:opacity-80 ${
                saved ? 'bg-moss text-canvas' : 'bg-forest text-canvas'
              }`}
            >
              {saved ? 'Saved' : 'Save as new routine'}
            </button>
          ) : (
            <button
              onClick={handleTeachAgain}
              className="w-full h-14 rounded-2xl font-semibold text-base bg-forest text-canvas transition-all active:opacity-80"
            >
              Teach again
            </button>
          )
        }
      />
    </>
  )
}
