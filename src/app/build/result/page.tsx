'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import RoutineView from '@/components/RoutineView'
import type { Block, SlotDetail, SavedRoutine } from '@/types/routine'

interface TempRoutine {
  classOpener: string
  tldr: { focus: string; whereTheyWillFeelIt: string; note: string }
  totalMinutes: number
  blocks: Block[]
  selectedClasses: string[]
  selectedSlots: SlotDetail[]
  energyArc: string | null
  selectedEmphasis: string[]
  vibe: string
}

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

export default function ResultPage() {
  const router = useRouter()
  const [temp, setTemp] = useState<TempRoutine | null>(null)
  const [blocks, setBlocks] = useState<Block[]>([])
  const [openSwap, setOpenSwap] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('q_routine')
    if (!stored) { router.replace('/build'); return }
    try {
      const r: TempRoutine = JSON.parse(stored)
      setTemp(r)
      setBlocks(r.blocks)
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
    if (!temp || saving) return
    setSaving(true)
    const savedAt = Date.now()
    const name = generateName(temp.selectedSlots ?? [], savedAt)

    const savedRoutine: SavedRoutine = {
      id: savedAt,
      name,
      savedAt,
      selectedClasses: temp.selectedClasses ?? [],
      selectedSlots: temp.selectedSlots ?? [],
      energyArc: temp.energyArc ?? null,
      selectedEmphasis: temp.selectedEmphasis ?? [],
      vibe: temp.vibe ?? '',
      favorited: false,
      classOpener: temp.classOpener,
      tldr: temp.tldr,
      totalMinutes: temp.totalMinutes,
      blocks,
    }

    const existing: SavedRoutine[] = (() => {
      try { return JSON.parse(localStorage.getItem('q_routines') ?? '[]') } catch { return [] }
    })()
    localStorage.setItem('q_routines', JSON.stringify([...existing, savedRoutine]))

    setSaved(true)
    setTimeout(() => router.push('/home'), 1100)
  }

  if (!temp) {
    return (
      <div className="flex items-center justify-center h-[calc(100dvh-72px)]">
        <p className="text-sm text-stone">Loading…</p>
      </div>
    )
  }

  return (
    <RoutineView
      classOpener={temp.classOpener}
      tldr={temp.tldr}
      totalMinutes={temp.totalMinutes}
      blocks={blocks}
      openSwap={openSwap}
      onOpenSwap={setOpenSwap}
      onSwapMove={swapMove}
      footer={
        <>
          <button
            onClick={handleSave}
            disabled={saving}
            className={`w-full h-14 rounded-2xl font-semibold text-base transition-all active:opacity-80 disabled:opacity-80 ${
              saved ? 'bg-moss text-canvas' : 'bg-forest text-canvas'
            }`}
          >
            {saved ? 'Routine saved' : 'Save routine'}
          </button>
          <Link
            href="/build"
            className="text-sm font-medium text-center text-stone underline underline-offset-2"
          >
            Build another
          </Link>
        </>
      }
    />
  )
}
