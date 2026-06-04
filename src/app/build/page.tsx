'use client'

import { useState } from 'react'
import { IconMicrophone, IconChevronLeft } from '@tabler/icons-react'

// ─── Schedule ────────────────────────────────────────────────────────────────

const SCHEDULE = [
  { day: 6, hour: 11, minute: 0 },
  { day: 6, hour: 11, minute: 50 },
  { day: 0, hour: 10, minute: 10 },
  { day: 0, hour: 11, minute: 0 },
]

function nextOccurrence(day: number, hour: number, minute: number, now: Date): Date {
  const currentDay = now.getDay()
  let daysUntil = (day - currentDay + 7) % 7
  if (daysUntil === 0) {
    const slot = new Date(now)
    slot.setHours(hour, minute, 0, 0)
    if (slot <= now) daysUntil = 7
  }
  const d = new Date(now)
  d.setDate(now.getDate() + daysUntil)
  d.setHours(hour, minute, 0, 0)
  d.setSeconds(0, 0)
  return d
}

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

const VIBE_SUGGESTIONS = [
  'dark and driven',
  'feel-good flow',
  'saturday energy',
  'emotional build',
  'gritty and loud',
]

// ─── Component ────────────────────────────────────────────────────────────────

export default function BuildPage() {
  const [step, setStep] = useState(1)
  const [selectedClasses, setSelectedClasses] = useState<string[]>([])
  const [selectedEmphasis, setSelectedEmphasis] = useState<string[]>([])
  const [selectedEnergy, setSelectedEnergy] = useState<string | null>(null)
  const [vibeText, setVibeText] = useState('')

  // Dates computed once on the client — explicit locale prevents hydration mismatch
  const now = new Date()
  const classDates = SCHEDULE
    .map(({ day, hour, minute }) => nextOccurrence(day, hour, minute, now))
    .sort((a, b) => a.getTime() - b.getTime())

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

  function handleNext() {
    if (step < 4) setStep(s => s + 1)
    // Step 4: Generate routine — API call wired up later
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-72px)]">

      {/* ── Progress header ── */}
      <div className="shrink-0 px-5 pt-10 pb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-extrabold text-ink">Build</h1>
          <span className="text-sm font-medium text-stone">Step {step} of 4</span>
        </div>
        <div className="h-1 rounded-full bg-border overflow-hidden">
          <div
            className="h-full rounded-full bg-forest transition-[width] duration-300 ease-out"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>
      </div>

      {/* ── Step content (scrollable) ── */}
      <div className="flex-1 overflow-y-auto px-5 pb-4">

        {/* Step 1 — Class selection */}
        {step === 1 && (
          <div className="flex flex-col gap-3">
            <h2 className="text-xl font-bold text-ink mb-1">What's this class for?</h2>
            {classDates.map((date, i) => {
              const id = `slot-${i}`
              const active = selectedClasses.includes(id)
              return (
                <button
                  key={id}
                  onClick={() => toggleClass(id)}
                  className={`w-full text-left rounded-2xl px-5 py-4 border-2 transition-colors ${
                    active
                      ? 'border-forest bg-forest/8'
                      : 'border-border bg-surface'
                  }`}
                >
                  <p className="text-xs font-medium text-stone uppercase tracking-widest">
                    {formatDate(date)}
                  </p>
                  <p className="text-2xl font-extrabold text-ink mt-1 leading-none">
                    {formatTime(date)}
                  </p>
                </button>
              )
            })}
            <button
              onClick={() => toggleClass('none')}
              className={`w-full text-left rounded-2xl px-5 py-4 border-2 transition-colors ${
                selectedClasses.includes('none')
                  ? 'border-forest bg-forest/8'
                  : 'border-border bg-surface'
              }`}
            >
              <p className="text-base font-semibold text-ink">No specific class</p>
              <p className="text-sm text-stone mt-0.5">Just building for practice</p>
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
                    className={`rounded-full px-5 py-3 text-sm font-semibold border-2 transition-all ${
                      active
                        ? 'bg-forest text-canvas border-forest'
                        : dimmed
                        ? 'bg-surface text-stone border-border opacity-35'
                        : 'bg-surface text-ink border-border'
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
                  className={`w-full text-left rounded-2xl px-5 py-5 border-2 transition-colors ${
                    active ? 'border-forest bg-surface' : 'border-border bg-surface'
                  }`}
                >
                  <p className="text-base font-bold text-ink">{label}</p>
                  <p className="text-sm text-stone mt-1.5 leading-relaxed">{description}</p>
                </button>
              )
            })}
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
                    onClick={() => setVibeText(s)}
                    className={`rounded-full px-4 py-2 text-sm font-medium border-2 transition-all ${
                      vibeText === s
                        ? 'bg-forest text-canvas border-forest'
                        : 'bg-surface text-ink border-border'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ── Navigation ── */}
      <div className="shrink-0 px-5 pt-4 pb-6 flex gap-3 border-t border-border bg-canvas">
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
          className={`flex-1 h-14 rounded-2xl font-semibold text-base transition-all active:opacity-80 disabled:opacity-35 ${
            step === 4 ? 'bg-forest text-canvas' : 'bg-forest text-canvas'
          }`}
        >
          {step === 4 ? 'Generate routine' : 'Next'}
        </button>
      </div>

    </div>
  )
}
