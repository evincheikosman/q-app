'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import RoutineView from '@/components/RoutineView'
import type { Block, SavedRoutine } from '@/types/routine'

export default function ViewRoutinePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [routine, setRoutine] = useState<SavedRoutine | null>(null)
  const [blocks, setBlocks] = useState<Block[]>([])
  const [openSwap, setOpenSwap] = useState<string | null>(null)

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
        <p className="text-lg font-bold text-ink mt-2 leading-snug">{routine.name}</p>
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
          <button
            onClick={handleTeachAgain}
            className="w-full h-14 rounded-2xl font-semibold text-base bg-forest text-canvas transition-all active:opacity-80"
          >
            Teach again
          </button>
        }
      />
    </>
  )
}
