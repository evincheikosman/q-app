'use client'

/**
 * Teach Mode — the in-class view. Full-bleed black, glanceable from across
 * the room: current move huge, spring load, countdown, next move preview.
 * Auto-advances through the whole routine. POWDER discipline throughout.
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  IconX,
  IconPlayerPause,
  IconPlayerPlay,
  IconChevronLeft,
  IconChevronRight,
} from '@tabler/icons-react'
import type { SavedRoutine } from '@/types/routine'

interface Step {
  blockName: string
  spring: string
  name: string
  duration: number // minutes
  cue: string
  springChange?: string
}

function flatten(routine: SavedRoutine): Step[] {
  const steps: Step[] = []
  for (const b of routine.blocks) {
    for (const m of b.moves) {
      steps.push({
        blockName: b.name,
        spring: m.springChange ?? b.spring,
        name: m.name,
        duration: m.duration || 1,
        cue: m.cue,
        springChange: m.springChange,
      })
    }
  }
  return steps
}

function fmt(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export default function TeachPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [routine, setRoutine] = useState<SavedRoutine | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [running, setRunning] = useState(true)
  const [done, setDone] = useState(false)
  const interval = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    try {
      const stored: SavedRoutine[] = JSON.parse(localStorage.getItem('q_routines') ?? '[]')
      const found = stored.find(r => String(r.id) === String(id))
      if (found) setRoutine(found)
      else setNotFound(true)
    } catch {
      setNotFound(true)
    }
  }, [id])

  const steps = useMemo(() => (routine ? flatten(routine) : []), [routine])
  const step = steps[stepIndex]
  const next = steps[stepIndex + 1]

  // (Re)start the clock whenever the step changes
  useEffect(() => {
    if (!step) return
    setSecondsLeft(step.duration * 60)
  }, [stepIndex, step])

  // The tick
  useEffect(() => {
    if (!running || done || !step) return
    interval.current = setInterval(() => {
      setSecondsLeft(s => {
        if (s > 1) return s - 1
        // auto-advance
        if (stepIndex < steps.length - 1) setStepIndex(i => i + 1)
        else setDone(true)
        return 0
      })
    }, 1000)
    return () => {
      if (interval.current) clearInterval(interval.current)
    }
  }, [running, done, stepIndex, steps.length, step])

  // keep the screen awake while teaching
  useEffect(() => {
    let lock: { release: () => Promise<void> } | null = null
    const nav = navigator as Navigator & {
      wakeLock?: { request: (type: 'screen') => Promise<{ release: () => Promise<void> }> }
    }
    nav.wakeLock?.request('screen').then(l => { lock = l }).catch(() => {})
    return () => { lock?.release().catch(() => {}) }
  }, [])

  const exit = () => router.push(`/build/result/${id}`)

  if (notFound) {
    return (
      <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-3" style={{ backgroundColor: '#0D0D0F' }}>
        <p className="text-white text-sm">Routine not found.</p>
        <button onClick={() => router.push('/library')} className="text-sm font-bold rounded-full px-5 py-2.5" style={{ backgroundColor: '#AEC8F5', color: '#0D0D0F' }}>
          Back to Library
        </button>
      </div>
    )
  }
  if (!routine || !step) return <div className="fixed inset-0 z-[60]" style={{ backgroundColor: '#0D0D0F' }} />

  const elapsed = steps.slice(0, stepIndex).reduce((s, x) => s + x.duration * 60, 0) + (step.duration * 60 - secondsLeft)
  const total = steps.reduce((s, x) => s + x.duration * 60, 0)
  const progress = total > 0 ? elapsed / total : 0

  if (done) {
    return (
      <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-4 px-8 text-center" style={{ backgroundColor: '#0D0D0F' }}>
        <span
          className="font-extrabold"
          style={{ fontSize: '96px', lineHeight: 1, color: '#AEC8F5', fontVariationSettings: "'opsz' 96" }}
        >
          Q
        </span>
        <p className="text-white font-extrabold" style={{ fontSize: '34px', lineHeight: 1.05, fontVariationSettings: "'opsz' 96" }}>
          That&apos;s the class.
        </p>
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>
          {steps.length} moves · {Math.round(total / 60)} minutes · taught with intention.
        </p>
        <button
          onClick={exit}
          className="mt-2 text-sm font-bold rounded-full px-6 py-3"
          style={{ backgroundColor: '#AEC8F5', color: '#0D0D0F' }}
        >
          Back to the routine
        </button>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 flex flex-col" style={{ backgroundColor: "#0D0D0F", zIndex: 60 }}>
      {/* progress */}
      <div className="h-1 w-full" style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}>
        <div className="h-full transition-[width] duration-1000 ease-linear" style={{ width: `${progress * 100}%`, backgroundColor: '#AEC8F5' }} />
      </div>

      {/* top bar */}
      <div className="flex items-center justify-between px-5 pt-4">
        <p className="text-[10px] font-bold tracking-[3px] uppercase" style={{ color: '#AEC8F5' }}>
          {step.blockName}
        </p>
        <button onClick={exit} aria-label="Exit teach mode" className="p-2 -mr-2" style={{ color: 'rgba(255,255,255,0.55)' }}>
          <IconX size={20} stroke={2} />
        </button>
      </div>

      {/* the move — glanceable from across the room.
          Stories-style gesture zones: the left/right thirds of the move area are
          giant prev/next tap targets — no aiming at small buttons mid-class. */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-5 relative">
        <button
          onClick={() => setStepIndex(i => Math.max(0, i - 1))}
          disabled={stepIndex === 0}
          aria-label="Previous move (tap zone)"
          className="absolute inset-y-0 left-0 w-1/3 z-10"
          style={{ background: 'transparent' }}
        />
        <button
          onClick={() => {
            if (stepIndex < steps.length - 1) setStepIndex(i => i + 1)
            else setDone(true)
          }}
          aria-label="Next move (tap zone)"
          className="absolute inset-y-0 right-0 w-1/3 z-10"
          style={{ background: 'transparent' }}
        />
        <p
          className="text-white font-extrabold"
          style={{ fontSize: 'clamp(38px, 11vw, 56px)', lineHeight: 0.98, letterSpacing: '-1px', fontVariationSettings: "'opsz' 96" }}
        >
          {step.name}
        </p>
        <p className="text-sm font-bold uppercase tracking-[2px]" style={{ color: '#AEC8F5' }}>
          {step.spring}
        </p>
        <p
          className="font-extrabold tabular-nums"
          style={{ fontSize: 'clamp(64px, 22vw, 110px)', lineHeight: 1, color: secondsLeft <= 10 ? '#AEC8F5' : '#FFFFFF', fontVariationSettings: "'opsz' 96", letterSpacing: '-2px' }}
        >
          {fmt(secondsLeft)}
        </p>
        {step.cue && (
          <p className="text-sm leading-relaxed max-w-[300px]" style={{ color: 'rgba(255,255,255,0.55)' }}>
            {step.cue}
          </p>
        )}
      </div>

      {/* next up */}
      <div className="px-6 pb-2">
        <div className="rounded-2xl px-4 py-3 flex items-center justify-between" style={{ backgroundColor: 'rgba(255,255,255,0.07)' }}>
          <div className="min-w-0">
            <p className="text-[9px] font-bold tracking-[2.5px] uppercase" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Next
            </p>
            <p className="text-sm font-bold text-white truncate">
              {next ? next.name : 'Last move — bring it home'}
            </p>
          </div>
          {next && (
            <p className="shrink-0 text-xs font-semibold ml-3" style={{ color: '#AEC8F5' }}>
              {next.spring}
            </p>
          )}
        </div>
      </div>

      {/* controls */}
      <div className="flex items-center justify-center gap-6 px-6 pb-10 pt-3" style={{ paddingBottom: 'calc(40px + env(safe-area-inset-bottom))' }}>
        <button
          onClick={() => setStepIndex(i => Math.max(0, i - 1))}
          disabled={stepIndex === 0}
          aria-label="Previous move"
          className="p-3 rounded-full disabled:opacity-25"
          style={{ color: '#FFFFFF', backgroundColor: 'rgba(255,255,255,0.1)' }}
        >
          <IconChevronLeft size={22} stroke={2} />
        </button>
        <button
          onClick={() => setRunning(r => !r)}
          aria-label={running ? 'Pause' : 'Resume'}
          className="w-16 h-16 rounded-full flex items-center justify-center active:scale-95 transition-transform"
          style={{ backgroundColor: '#AEC8F5', color: '#0D0D0F' }}
        >
          {running ? <IconPlayerPause size={26} stroke={2} /> : <IconPlayerPlay size={26} stroke={2} />}
        </button>
        <button
          onClick={() => {
            if (stepIndex < steps.length - 1) setStepIndex(i => i + 1)
            else setDone(true)
          }}
          aria-label="Next move"
          className="p-3 rounded-full"
          style={{ color: '#FFFFFF', backgroundColor: 'rgba(255,255,255,0.1)' }}
        >
          <IconChevronRight size={22} stroke={2} />
        </button>
      </div>
    </div>
  )
}
