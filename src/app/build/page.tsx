'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { IconMicrophone, IconChevronLeft, IconCheck, IconBrandSpotify } from '@tabler/icons-react'
import type { SavedRoutine } from '@/types/routine'
import QMarkLoader from '@/components/QMarkLoader'
import facts from '@/data/facts.json'
import { loadSchedule, nextOccurrence } from '@/lib/schedule'

function formatDate(date: Date) {
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}

function formatTime(date: Date) {
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

// ─── Step data ────────────────────────────────────────────────────────────────

const EMPHASIS_OPTIONS = [
  'Glutes & hamstrings',
  'Core & obliques',
  'Upper body',
  'Evenly distributed',
]

const ENERGY_OPTIONS = [
  {
    label: 'Slow build → big finish',
    description: 'Start measured, build momentum. Let the fire climb.',
  },
  {
    label: 'Sustained energy',
    description: 'Even burn, no peaks. Commit from first rep to last.',
  },
  {
    label: 'Peak and hold',
    description: 'Hit hard, hold longer. Make them feel every second.',
  },
]

const LEVEL_OPTIONS = [
  { label: 'Beginner-friendly', description: 'New faces in the room — approachable moves, extra setup time.' },
  { label: 'Mixed levels', description: 'The usual crowd — challenge them, keep it doable.' },
  { label: 'Advanced regulars', description: 'They know the machine — bring the hard stuff.' },
]

const VIBE_SUGGESTIONS = [
  'dark and driven',
  'feel-good flow',
  'saturday energy',
  'emotional build',
  'gritty and loud',
]

// ─── Component ────────────────────────────────────────────────────────────────

export default function BuildPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [selectedClasses, setSelectedClasses] = useState<string[]>([])
  const [selectedEmphasis, setSelectedEmphasis] = useState<string[]>([])
  const [selectedEnergy, setSelectedEnergy] = useState<string | null>(null)
  const [classLevel, setClassLevel] = useState('Mixed levels')
  const [vibeText, setVibeText] = useState('')
  const [moveNotes, setMoveNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentFactIndex, setCurrentFactIndex] = useState(() => Math.floor(Math.random() * facts.length))
  const [factVisible, setFactVisible] = useState(true)
  const [savedRoutines, setSavedRoutines] = useState<SavedRoutine[]>([])
  const [optionsOpenForSlot, setOptionsOpenForSlot] = useState<string | null>(null)
  const [schedule, setSchedule] = useState<{ day: number; hour: number; minute: number }[]>([])

  useEffect(() => {
    setSchedule(loadSchedule())
  }, [])

  // Dates computed once on the client — explicit locale prevents hydration mismatch
  const now = new Date()
  const classDates = schedule
    .map(({ day, hour, minute }) => nextOccurrence(day, hour, minute, now))
    .sort((a, b) => a.getTime() - b.getTime())

  // One fact per generation — picked when loading starts, held for the full wait
  useEffect(() => {
    if (!loading) return
    setCurrentFactIndex(Math.floor(Math.random() * facts.length))
    setFactVisible(true)
  }, [loading])

  useEffect(() => {
    const raw = localStorage.getItem('q_build_prefill')
    if (!raw) return
    localStorage.removeItem('q_build_prefill')
    try {
      const p = JSON.parse(raw)
      if (p.selectedClasses) setSelectedClasses(p.selectedClasses)
      if (p.selectedEmphasis) setSelectedEmphasis(p.selectedEmphasis)
      if (p.energyArc) setSelectedEnergy(p.energyArc)
      if (p.vibe) setVibeText(p.vibe)
      if (p.classLevel) setClassLevel(p.classLevel)
      if (p.moveNotes) setMoveNotes(p.moveNotes)
    } catch {}
  }, [])

  useEffect(() => {
    try {
      const stored = localStorage.getItem('q_routines')
      if (stored) setSavedRoutines(JSON.parse(stored))
    } catch {}
  }, [])

  function linkedRoutineForDate(date: Date): SavedRoutine | undefined {
    return savedRoutines.find(r =>
      r.selectedSlots?.some(
        s => s.day === date.getDay() && s.hour === date.getHours() && s.minute === date.getMinutes()
      )
    )
  }

  function handleSlotTap(id: string, linked: SavedRoutine | undefined) {
    if (linked) {
      if (!selectedClasses.includes(id)) setSelectedClasses(prev => [...prev, id])
      setOptionsOpenForSlot(prev => prev === id ? null : id)
    } else {
      toggleClass(id)
    }
  }

  function handleBuildNew(id: string) {
    if (!selectedClasses.includes(id)) setSelectedClasses(prev => [...prev, id])
    setOptionsOpenForSlot(null)
  }

  function toggleClass(id: string) {
    setSelectedClasses(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    )
  }

  const canAdvance =
    (step === 1 && selectedClasses.length > 0) ||
    (step === 2 && selectedEmphasis.length > 0) ||
    (step === 3 && selectedEnergy !== null) ||
    step === 4

  function toggleEmphasis(option: string) {
    setSelectedEmphasis(prev => {
      if (prev.includes(option)) return prev.filter(e => e !== option)
      if (prev.length >= 2) return prev
      return [...prev, option]
    })
  }

  async function handleNext() {
    if (step < 4) {
      setStep(s => s + 1)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/generate-routine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emphasis: selectedEmphasis.join(' + ') || 'Evenly distributed',
          energyArc: selectedEnergy,
          vibe: vibeText || 'No specific vibe',
          classLevel,
          moveNotes: moveNotes.trim() || null,
          selectedClasses,
        }),
      })

      if (!res.ok) throw new Error('API error')

      const routine = await res.json()
      const selectedSlots = classDates
        .map((date, i) => {
          if (!selectedClasses.includes(`slot-${i}`)) return null
          return {
            day: date.getDay(),
            hour: date.getHours(),
            minute: date.getMinutes(),
            slotLabel: `${date.toLocaleDateString('en-US', { weekday: 'long' })} ${formatTime(date)}`,
            date: date.toISOString(),
          }
        })
        .filter((x): x is NonNullable<typeof x> => x !== null)
      localStorage.setItem('q_routine', JSON.stringify({
        ...routine,
        selectedClasses,
        selectedSlots,
        energyArc: selectedEnergy,
        selectedEmphasis,
        vibe: vibeText,
        classLevel,
        moveNotes: moveNotes.trim() || null,
      }))
      router.push('/build/result')
    } catch {
      setError('Something went wrong. Try again.')
      setLoading(false)
    }
  }

  if (loading) {
    const fact = facts[currentFactIndex]
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100dvh-72px)] px-5 text-center gap-6">
        <QMarkLoader />
        <div
          className="flex flex-col gap-2"
          style={{ opacity: factVisible ? 1 : 0, transition: 'opacity 300ms ease' }}
        >
          <p className="text-xs text-stone tracking-widest uppercase">Did you know</p>
          <p className="text-sm text-ink leading-relaxed max-w-sm mx-auto">{fact.fact}</p>
        </div>
        <div className="flex flex-col gap-1.5 items-center">
          <p className="text-2xl font-extrabold text-ink">Building your class...</p>
          <p className="text-sm text-stone">This takes about 15–20 seconds.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-72px)] max-w-lg mx-auto w-full">

      {/* ── Progress header ── */}
      <div className="shrink-0 px-5 pt-10 pb-6">
        <div className="flex items-end justify-between mb-4">
          <h1
            className="font-extrabold text-ink"
            style={{ fontSize: '34px', lineHeight: 1, fontVariationSettings: "'opsz' 96" }}
          >
            Build
          </h1>
          <span className="text-xs font-semibold tracking-widest uppercase text-stone">
            Step {step} <span className="text-border">/</span> 4
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-border overflow-hidden relative">
          <div
            className="h-full rounded-full transition-[width] duration-300 ease-out relative"
            style={{ width: `${(step / 4) * 100}%`, backgroundColor: '#0D0D0F' }}
          >
            <span
              className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: '#AEC8F5', border: '2px solid #0D0D0F' }}
            />
          </div>
        </div>
      </div>

      {/* ── Step content (scrollable) ── */}
      <div className="flex-1 overflow-y-auto px-5 pb-4">

        {/* Step 1 — Class selection */}
        {step === 1 && (
          <div className="flex flex-col gap-3">
            <h2 className="text-xl font-bold text-ink mb-1">Which class are you building for?</h2>
            {classDates.length === 0 && (
              <p className="text-xs text-stone leading-relaxed -mt-1 mb-1">
                No teaching schedule saved yet — add it from{' '}
                <Link href="/home" className="font-semibold text-ink underline decoration-powder decoration-2 underline-offset-2">
                  Home
                </Link>{' '}
                and your classes will show up here.
              </p>
            )}
            {classDates.map((date, i) => {
              const id = `slot-${i}`
              const active = selectedClasses.includes(id)
              const linked = linkedRoutineForDate(date)
              const optionsOpen = optionsOpenForSlot === id
              return (
                <div key={id} className="flex flex-col gap-2">
                  <button
                    onClick={() => handleSlotTap(id, linked)}
                    className={`w-full text-left rounded-2xl px-5 py-4 transition-all shadow-card bg-white border-2 ${
                      active ? 'border-forest' : 'border-transparent'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-medium text-stone uppercase tracking-widest">
                          {formatDate(date)}
                        </p>
                        <p
                          className="font-extrabold text-ink mt-1 leading-none"
                          style={{ fontSize: '28px', fontVariationSettings: "'opsz' 96" }}
                        >
                          {formatTime(date)}
                        </p>
                      </div>
                      {active && (
                        <span
                          className="shrink-0 mt-0.5 w-6 h-6 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: '#AEC8F5' }}
                        >
                          <IconCheck size={13} stroke={3} color="#0D0D0F" />
                        </span>
                      )}
                    </div>
                    {linked && (
                      <p className="text-xs font-semibold mt-2 text-ink underline decoration-powder decoration-2 underline-offset-2">Routine ready</p>
                    )}
                  </button>

                  {optionsOpen && linked && (
                    <div className="bg-surface rounded-2xl px-4 py-3.5 flex flex-col gap-2.5 border border-border">
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-stone truncate flex-1">{linked.name}</p>
                        {linked.spotifyPlaylistUrl && (
                          <a
                            href={linked.spotifyPlaylistUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="Open playlist in Spotify"
                            className="shrink-0 flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold"
                            style={{ backgroundColor: '#1DB95420', color: '#1DB954' }}
                          >
                            <IconBrandSpotify size={12} stroke={2} />
                            Playlist
                          </a>
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        <Link
                          href={`/build/result/${linked.id}`}
                          className="w-full text-center text-sm font-semibold text-canvas bg-forest rounded-xl py-2.5 active:opacity-75 transition-opacity"
                        >
                          View existing
                        </Link>
                        <button
                          onClick={() => handleBuildNew(id)}
                          className="w-full text-sm font-semibold text-ink bg-canvas border border-border rounded-xl py-2.5 active:opacity-75 transition-opacity"
                        >
                          Build new
                        </button>
                        <Link
                          href={`/build/result/${linked.id}?duplicate=true`}
                          className="w-full text-center text-sm font-medium text-stone bg-canvas border border-border rounded-xl py-2.5 active:opacity-75 transition-opacity"
                        >
                          Duplicate &amp; edit
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
            <button
              onClick={() => toggleClass('none')}
              className={`w-full text-left rounded-2xl px-5 py-4 transition-all shadow-card bg-white border-2 ${
                selectedClasses.includes('none') ? 'border-forest' : 'border-transparent'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-base font-semibold text-ink">No specific class</p>
                  <p className="text-sm text-stone mt-0.5">Just building for practice</p>
                </div>
                {selectedClasses.includes('none') && (
                  <span
                    className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: '#AEC8F5' }}
                  >
                    <IconCheck size={13} stroke={3} color="#0D0D0F" />
                  </span>
                )}
              </div>
            </button>
          </div>
        )}

        {/* Step 2 — Emphasis */}
        {step === 2 && (
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="text-xl font-bold text-ink leading-snug">
                Where do you want your class to feel it most?
              </h2>
              <p className="text-sm text-stone mt-2">Choose up to 2.</p>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {EMPHASIS_OPTIONS.map(option => {
                const active = selectedEmphasis.includes(option)
                const dimmed = !active && selectedEmphasis.length >= 2
                return (
                  <button
                    key={option}
                    onClick={() => toggleEmphasis(option)}
                    disabled={dimmed}
                    className={`rounded-full px-5 py-3 text-sm font-bold border-2 transition-all ${
                      active
                        ? 'bg-forest text-white border-forest'
                        : dimmed
                        ? 'bg-white text-stone border-border opacity-35'
                        : 'bg-white text-ink border-border hover:border-forest'
                    }`}
                  >
                    {option}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Step 3 — Energy */}
        {step === 3 && (
          <div className="flex flex-col gap-3">
            <h2 className="text-xl font-bold text-ink mb-1">How should this class feel?</h2>
            {ENERGY_OPTIONS.map(({ label, description }) => {
              const active = selectedEnergy === label
              return (
                <button
                  key={label}
                  onClick={() => setSelectedEnergy(label)}
                  className={`w-full text-left rounded-2xl px-5 py-5 border-2 transition-all shadow-card ${
                    active ? 'border-forest bg-white' : 'border-transparent bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-base font-bold text-ink">{label}</p>
                      <p className="text-sm text-stone mt-1.5 leading-relaxed">{description}</p>
                    </div>
                    {active && (
                      <span
                        className="shrink-0 mt-0.5 w-6 h-6 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: '#AEC8F5' }}
                      >
                        <IconCheck size={13} stroke={3} color="#0D0D0F" />
                      </span>
                    )}
                  </div>
                </button>
              )
            })}

            {/* Who's in the room — tunes difficulty within the arc */}
            <div className="mt-4 flex flex-col gap-3">
              <p className="text-xs font-medium text-stone uppercase tracking-widest">
                Who&apos;s in the room?
              </p>
              <div className="flex flex-col gap-2">
                {LEVEL_OPTIONS.map(({ label, description }) => {
                  const active = classLevel === label
                  return (
                    <button
                      key={label}
                      onClick={() => setClassLevel(label)}
                      className={`w-full text-left rounded-2xl px-4 py-3 border-2 transition-all bg-white ${
                        active ? 'border-forest' : 'border-border'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1">
                          <p className="text-sm font-bold text-ink">{label}</p>
                          <p className="text-xs text-stone mt-0.5">{description}</p>
                        </div>
                        {active && (
                          <span
                            className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: '#AEC8F5' }}
                          >
                            <IconCheck size={11} stroke={3} color="#0D0D0F" />
                          </span>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Step 4 — Vibe */}
        {step === 4 && (
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="text-xl font-bold text-ink">Set the vibe</h2>
              <p className="text-sm text-stone mt-1.5">
                Describe the feeling. A word, a scene, a mood — anything goes.
              </p>
            </div>
            <div className="relative">
              <textarea
                value={vibeText}
                onChange={e => setVibeText(e.target.value)}
                placeholder="e.g. running through rain at night, fast and relentless"
                rows={4}
                className="w-full bg-surface rounded-2xl px-4 py-4 pr-12 text-sm text-ink placeholder:text-stone/60 resize-none outline-none border-2 border-border focus:border-forest transition-colors leading-relaxed"
              />
              <button
                type="button"
                aria-label="Voice input"
                className="absolute right-3 bottom-3 p-2 rounded-xl text-stone hover:text-moss transition-colors"
              >
                <IconMicrophone size={20} stroke={1.5} />
              </button>
            </div>
            <div className="flex flex-col gap-3">
              <p className="text-xs font-medium text-stone uppercase tracking-widest">
                Quick picks
              </p>
              <div className="flex flex-wrap gap-2">
                {VIBE_SUGGESTIONS.map(s => (
                  <button
                    key={s}
                    onClick={() =>
                      setVibeText(t => {
                        // Multi-select: toggle the pick in/out of a comma-separated list
                        const parts = t.split(',').map(p => p.trim()).filter(Boolean)
                        const next = parts.includes(s)
                          ? parts.filter(p => p !== s)
                          : [...parts, s]
                        return next.join(', ')
                      })
                    }
                    className={`rounded-full px-4 py-2 text-sm font-medium border-2 transition-all ${
                      vibeText.split(',').map(p => p.trim()).includes(s)
                        ? 'bg-forest text-white border-forest'
                        : 'bg-white text-ink border-border hover:border-forest'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Optional: moves to feature or skip — for when you know the room */}
            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium text-stone uppercase tracking-widest">
                Feature or skip anything? <span className="normal-case font-normal text-stone/70">(optional)</span>
              </p>
              <input
                value={moveNotes}
                onChange={e => setMoveNotes(e.target.value)}
                placeholder="e.g. feature Spider Lunge · skip Wheelbarrow, no overhead pressing"
                className="w-full bg-surface rounded-2xl px-4 py-3.5 text-sm text-ink placeholder:text-stone/60 outline-none border-2 border-border focus:border-forest transition-colors"
              />
            </div>
          </div>
        )}

      </div>

      {/* ── Navigation ── */}
      <div className="shrink-0 px-5 pt-4 pb-6 flex flex-col gap-2 border-t border-border bg-canvas">
        {error && (
          <p className="text-xs font-medium text-center" style={{ color: '#b45309' }}>
            {error}
          </p>
        )}
        <div className="flex gap-3">
          {step > 1 && (
            <button
              onClick={() => setStep(s => s - 1)}
              className="flex items-center gap-1 h-14 px-5 rounded-2xl bg-surface text-ink font-semibold border border-border transition-colors active:bg-border"
            >
              <IconChevronLeft size={18} stroke={2} />
              Back
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={!canAdvance}
            className="flex-1 h-14 rounded-2xl font-bold text-base transition-all active:opacity-80 disabled:bg-border disabled:text-stone bg-forest text-white"
          >
            {step === 4 ? 'Generate routine →' : 'Next'}
          </button>
        </div>
      </div>

    </div>
  )
}
