'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { IconPencil } from '@tabler/icons-react'
import BrandPhoto from '@/components/BrandPhoto'
import { PenNote } from '@/components/Scribble'
import ScheduleSheet from '@/components/ScheduleSheet'
import facts from '@/data/facts.json'
import type { SavedRoutine } from '@/types/routine'
import { seedDemoData, isFirstRun, markIntroSeen, startDemoAsEvin, isDemoMode, exitDemo } from '@/lib/demo'
import { saveProfile, loadProfile } from '@/lib/profile'
import { loadSchedule, nextOccurrence, type ClassSlot } from '@/lib/schedule'

// ─── First-run intro — three beats, then in. Never shows again. ──────────────

const INTRO_SLIDES = [
  {
    k: 'BUILD',
    title: 'Your class, on cue.',
    body: 'Q builds 32-minute Lagree routines — spring loads, cues, the works — and pairs each one with a playlist mapped to your energy arc.',
  },
  {
    k: 'TEACH',
    title: 'Then teach it.',
    body: 'Teach Mode puts the current move, spring, and countdown on one glanceable black screen. Auto-advances while you coach.',
  },
  {
    k: 'REFLECT',
    title: 'Q pays attention.',
    body: 'Every routine, reflection, and playlist feeds Your Cue — your teaching identity, reflected back with receipts.',
  },
]

type IntroPhase = 'slides' | 'profile' | 'cta'

function IntroOverlay({ onDone, onDemo }: { onDone: (seed: boolean) => void; onDemo: () => void }) {
  const [slide, setSlide] = useState(0)
  const [phase, setPhase] = useState<IntroPhase>('slides')
  const [name, setName] = useState('')
  const [studio, setStudio] = useState('')
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null)
  const s = INTRO_SLIDES[slide]
  const lastSlide = slide === INTRO_SLIDES.length - 1

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setPhotoDataUrl(reader.result as string)
    reader.readAsDataURL(file)
  }

  function continueFromProfile() {
    saveProfile({ name: name.trim() || 'Instructor', studio: studio.trim(), photoDataUrl })
    setPhase('cta')
  }

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden" style={{ backgroundColor: '#0D0D0F', zIndex: 60 }}>
      {phase === 'slides' && (
        <>
          <div className="flex-1 min-h-0 overflow-y-auto flex flex-col items-start justify-center px-8 gap-4 max-w-lg mx-auto w-full relative">
            <span
              aria-hidden
              className="absolute font-extrabold pointer-events-none select-none"
              style={{ right: '-40px', top: '10%', fontSize: '220px', lineHeight: 1, color: '#AEC8F5', opacity: 0.14, fontVariationSettings: "'opsz' 96" }}
            >
              Q
            </span>
            <p className="text-[10px] font-bold tracking-[3px] uppercase relative" style={{ color: '#AEC8F5' }}>
              {s.k}
            </p>
            <p
              className="text-white font-extrabold relative"
              style={{ fontSize: '40px', lineHeight: 1.02, letterSpacing: '-0.5px', fontVariationSettings: "'opsz' 96" }}
            >
              {s.title}
            </p>
            <p className="text-sm leading-relaxed relative max-w-[300px]" style={{ color: 'rgba(255,255,255,0.6)' }}>
              {s.body}
            </p>
          </div>

          <div className="px-8 pb-12 max-w-lg mx-auto w-full flex flex-col gap-4">
            <div className="flex gap-1.5">
              {INTRO_SLIDES.map((_, i) => (
                <span
                  key={i}
                  className="h-1 rounded-full transition-all"
                  style={{
                    width: i === slide ? '20px' : '8px',
                    backgroundColor: i === slide ? '#AEC8F5' : 'rgba(255,255,255,0.25)',
                  }}
                />
              ))}
            </div>
            <button
              onClick={() => (lastSlide ? setPhase('profile') : setSlide(v => v + 1))}
              className="w-full text-center font-bold text-base rounded-2xl py-3.5"
              style={{ backgroundColor: '#AEC8F5', color: '#0D0D0F' }}
            >
              Next
            </button>
            <button
              onClick={onDemo}
              className="w-full text-center font-semibold text-xs py-1"
              style={{ color: 'rgba(255,255,255,0.55)' }}
            >
              Just exploring? See a demo instructor →
            </button>
          </div>
        </>
      )}

      {phase === 'profile' && (
        <>
          <div className="flex-1 min-h-0 overflow-y-auto flex flex-col items-start justify-center px-8 gap-5 max-w-lg mx-auto w-full relative">
            <span
              aria-hidden
              className="absolute font-extrabold pointer-events-none select-none"
              style={{ right: '-40px', top: '6%', fontSize: '220px', lineHeight: 1, color: '#AEC8F5', opacity: 0.14, fontVariationSettings: "'opsz' 96" }}
            >
              Q
            </span>
            <div className="relative">
              <p className="text-[10px] font-bold tracking-[3px] uppercase" style={{ color: '#AEC8F5' }}>
                Who&apos;s teaching?
              </p>
              <p
                className="text-white font-extrabold mt-2"
                style={{ fontSize: '32px', lineHeight: 1.05, letterSpacing: '-0.5px', fontVariationSettings: "'opsz' 96" }}
              >
                Make it yours.
              </p>
              <p className="text-sm leading-relaxed mt-2 max-w-[300px]" style={{ color: 'rgba(255,255,255,0.6)' }}>
                Your name and photo show up on Your Cue — the poster Q builds from your own teaching data.
              </p>
            </div>

            <div className="w-full flex flex-col gap-3 relative">
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your name"
                autoFocus
                className="w-full text-base rounded-2xl px-4 py-3.5 bg-white/10 border-2 border-white/15 text-white placeholder:text-white/40 outline-none focus:border-[#AEC8F5] transition-colors"
              />
              <input
                value={studio}
                onChange={e => setStudio(e.target.value)}
                placeholder="Studio (optional) — e.g. Core40 SF"
                className="w-full text-base rounded-2xl px-4 py-3.5 bg-white/10 border-2 border-white/15 text-white placeholder:text-white/40 outline-none focus:border-[#AEC8F5] transition-colors"
              />
              <label className="w-full flex items-center gap-3 rounded-2xl px-4 py-3.5 bg-white/10 border-2 border-white/15 cursor-pointer">
                {photoDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photoDataUrl} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
                ) : (
                  <span className="w-9 h-9 rounded-full bg-white/15 shrink-0" />
                )}
                <span className="text-sm font-semibold text-white/70">
                  {photoDataUrl ? 'Change photo (optional)' : 'Add a photo (optional)'}
                </span>
                <input type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
              </label>
            </div>
          </div>

          <div className="px-8 pb-12 max-w-lg mx-auto w-full flex flex-col gap-2.5">
            <button
              onClick={continueFromProfile}
              className="w-full text-center font-bold text-base rounded-2xl py-3.5"
              style={{ backgroundColor: '#AEC8F5', color: '#0D0D0F' }}
            >
              Continue
            </button>
          </div>
        </>
      )}

      {phase === 'cta' && (
        <div className="flex-1 min-h-0 overflow-y-auto flex flex-col items-start justify-center px-8 gap-4 max-w-lg mx-auto w-full relative">
          <span
            aria-hidden
            className="absolute font-extrabold pointer-events-none select-none"
            style={{ right: '-40px', top: '10%', fontSize: '220px', lineHeight: 1, color: '#AEC8F5', opacity: 0.14, fontVariationSettings: "'opsz' 96" }}
          >
            Q
          </span>
          <p className="text-[10px] font-bold tracking-[3px] uppercase relative" style={{ color: '#AEC8F5' }}>
            READY
          </p>
          <p
            className="text-white font-extrabold relative"
            style={{ fontSize: '40px', lineHeight: 1.02, letterSpacing: '-0.5px', fontVariationSettings: "'opsz' 96" }}
          >
            One more thing.
          </p>
          <p className="text-sm leading-relaxed relative max-w-[300px]" style={{ color: 'rgba(255,255,255,0.6)' }}>
            Want to see Q fully lived-in, or start with a completely empty library?
          </p>

          <div className="w-full flex flex-col gap-2.5 mt-4 relative">
            <button
              onClick={() => onDone(true)}
              className="w-full text-center font-bold text-base rounded-2xl py-3.5"
              style={{ backgroundColor: '#AEC8F5', color: '#0D0D0F' }}
            >
              Try Q with sample data
            </button>
            <button
              onClick={() => onDone(false)}
              className="w-full text-center font-semibold text-sm py-2"
              style={{ color: 'rgba(255,255,255,0.6)' }}
            >
              Start fresh
            </button>
            <button
              onClick={onDemo}
              className="w-full text-center font-semibold text-sm py-2"
              style={{ color: '#AEC8F5' }}
            >
              See a demo instructor (Evîn) →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Schedule ─────────────────────────────────────────────────────────────────
// Schedule itself now lives in src/lib/schedule.ts — no hardcoded days/times
// here. It's whatever the instructor entered via ScheduleSheet, or nothing.

function formatDate(date: Date) {
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}

function formatTime(date: Date) {
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

// ─── Reflection loop ──────────────────────────────────────────────────────────
// After a class happens, Q quietly asks how it landed. One tap. Feeds Your Cue.

type ReflectionValue = 'fire' | 'rework' | 'down'

const REFLECTION_OPTIONS: {
  value: ReflectionValue
  emoji: string
  label: string
  short: string
}[] = [
  { value: 'fire', emoji: '🔥', label: 'It landed — keep it', short: 'keep it' },
  { value: 'rework', emoji: '❤️‍🩹', label: 'Good bones — needs a rework', short: 'rework' },
  { value: 'down', emoji: '👎', label: 'Not it — retire this one', short: 'retire' },
]

/** The most recent class that already happened (each slot's next occurrence − 7 days) */
function lastClass(schedule: ClassSlot[], now: Date): Date | null {
  const past = schedule
    .map(({ day, hour, minute }) => {
      const next = nextOccurrence(day, hour, minute, now)
      return new Date(next.getTime() - 7 * 24 * 60 * 60 * 1000)
    })
    .filter(d => d <= now)
    .sort((a, b) => b.getTime() - a.getTime())
  return past[0] ?? null
}

function reflectionKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}-${d.getHours()}:${d.getMinutes()}`
}

/** Direction C — the reflection rides the black hero card, below a hairline. */
function ReflectionStrip({ classDate }: { classDate: Date }) {
  const key = reflectionKey(classDate)
  const [answered, setAnswered] = useState<ReflectionValue | null | 'loading'>('loading')

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('q_reflections') ?? '{}')
      setAnswered(stored[key] ?? null)
    } catch {
      setAnswered(null)
    }
  }, [key])

  function answer(value: ReflectionValue) {
    try {
      const stored = JSON.parse(localStorage.getItem('q_reflections') ?? '{}')
      stored[key] = value
      localStorage.setItem('q_reflections', JSON.stringify(stored))
    } catch {}
    setAnswered(value)
  }

  if (answered === 'loading') return null

  const label = classDate.toLocaleDateString('en-US', { weekday: 'long' })
  const time = formatTime(classDate)

  return (
    <>
      <div className="mt-4 h-px relative" style={{ backgroundColor: 'rgba(255,255,255,0.14)' }} />
      {answered ? (
        <div className="mt-3.5 flex items-center gap-3 relative">
          <span className="text-xl" aria-hidden>
            {REFLECTION_OPTIONS.find(o => o.value === answered)?.emoji}
          </span>
          <PenNote color="#AEC8F5" size={14} rotate="-2deg">
            noted. it all feeds your cue.
          </PenNote>
        </div>
      ) : (
        <div className="mt-3.5 flex items-center justify-between gap-3 relative">
          <p className="text-xs leading-snug max-w-[130px]" style={{ color: 'rgba(255,255,255,0.7)' }}>
            How&apos;d <span className="font-bold text-white">{label} {time}</span> land?
          </p>
          <div className="flex items-start gap-2">
            {REFLECTION_OPTIONS.map(o => (
              <button
                key={o.value}
                onClick={() => answer(o.value)}
                title={o.label}
                aria-label={o.label}
                className="flex flex-col items-center gap-1.5 active:scale-95 transition-transform"
              >
                <span
                  className="w-[46px] h-[46px] rounded-full flex items-center justify-center text-[21px] transition-colors hover:bg-white/20"
                  style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                  aria-hidden
                >
                  {o.emoji}
                </span>
                <span className="text-[9px] font-semibold leading-none" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  {o.short}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  )
}

function greeting(hour: number) {
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function formatSavedAt(ts: number) {
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ─── Shared section label with divider ────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="pb-2 flex items-center gap-2" style={{ borderBottom: '1px solid #E9E9E4' }}>
      <span className="w-1.5 h-1.5 rounded-full bg-powder shrink-0" />
      <h2 className="text-xs font-semibold tracking-widest uppercase text-stone">{children}</h2>
    </div>
  )
}

// ─── Linked indicator ─────────────────────────────────────────────────────────

function LinkedDot({ white = false }: { white?: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: '#1DB954' }} />
      <span className={`text-xs font-semibold ${white ? 'text-white' : 'text-ink'}`}>Ready ✓</span>
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function HomePage() {
  const [routines, setRoutines] = useState<SavedRoutine[]>([])
  const [showIntro, setShowIntro] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [schedule, setSchedule] = useState<ClassSlot[]>([])
  const [editingSchedule, setEditingSchedule] = useState(false)
  const [demo, setDemo] = useState(false)
  const now = new Date()
  const hour = now.getHours()

  useEffect(() => {
    if (isFirstRun()) setShowIntro(true)
    setDemo(isDemoMode())
    const profile = loadProfile()
    if (profile?.name) setFirstName(profile.name.split(' ')[0])
    setSchedule(loadSchedule())
    try {
      const stored = localStorage.getItem('q_routines')
      if (stored) {
        const parsed: SavedRoutine[] = JSON.parse(stored)
        setRoutines(parsed.sort((a, b) => b.savedAt - a.savedAt))
      }
    } catch {}
  }, [])

  function finishIntro(seed: boolean) {
    markIntroSeen()
    const profile = loadProfile()
    if (profile?.name) setFirstName(profile.name.split(' ')[0])
    if (seed) {
      seedDemoData()
      setSchedule(loadSchedule())
      try {
        const stored = localStorage.getItem('q_routines')
        if (stored) {
          const parsed: SavedRoutine[] = JSON.parse(stored)
          setRoutines(parsed.sort((a, b) => b.savedAt - a.savedAt))
        }
      } catch {}
    }
    setShowIntro(false)
  }

  function enterDemo() {
    startDemoAsEvin()
    const profile = loadProfile()
    if (profile?.name) setFirstName(profile.name.split(' ')[0])
    setSchedule(loadSchedule())
    try {
      const stored = localStorage.getItem('q_routines')
      if (stored) {
        const parsed: SavedRoutine[] = JSON.parse(stored)
        setRoutines(parsed.sort((a, b) => b.savedAt - a.savedAt))
      }
    } catch {}
    setDemo(true)
    setShowIntro(false)
  }

  const hasSchedule = schedule.length > 0
  const upcoming = schedule
    .map(({ day, hour, minute }) => nextOccurrence(day, hour, minute, now))
    .sort((a, b) => a.getTime() - b.getTime())

  const [nextClass, ...rest] = upcoming
  const sevenDaysOut = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const moreThisWeek = rest.filter(d => d <= sevenDaysOut).length

  function linkedRoutine(date: Date): SavedRoutine | undefined {
    return routines.find(r =>
      r.selectedSlots?.some(
        s => s.day === date.getDay() && s.hour === date.getHours() && s.minute === date.getMinutes()
      )
    )
  }

  const nextLinked = nextClass ? linkedRoutine(nextClass) : undefined
  // Linked = a routine exists for this slot. A Spotify playlist is a bonus, not the bar.
  const isLinked = !!nextLinked

  const albumArts: string[] = (() => {
    if (!nextLinked) return []
    const seen = new Set<string>()
    const arts: string[] = []
    for (const t of nextLinked.playlistTracks ?? []) {
      if (t.albumArt && !seen.has(t.albumArt)) {
        seen.add(t.albumArt)
        arts.push(t.albumArt)
        if (arts.length === 5) break
      }
    }
    return arts
  })()

  const recentRoutines = routines.slice(0, 5)

  // Split "11:00 AM" so the meridiem can take the butter accent
  const timeStr = nextClass ? formatTime(nextClass) : ''
  const [timeDigits, meridiem] = [timeStr.replace(/\s?[AP]M$/i, ''), timeStr.match(/[AP]M$/i)?.[0] ?? '']

  // Daily fact — powder left-rule + marker title
  const dayOfYear = Math.floor((Date.now() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000)
  const todayFact = facts[dayOfYear % facts.length]

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .routine-scroll::-webkit-scrollbar { display: none; }
        .routine-scroll { scrollbar-width: none; }
      `}</style>

      {showIntro && <IntroOverlay onDone={finishIntro} onDemo={enterDemo} />}

      <div className="px-5 pt-14 pb-8 flex flex-col gap-8 max-w-lg mx-auto w-full relative">

        {demo && (
          <div className="flex items-center justify-between gap-3 rounded-2xl px-4 py-3 -mb-4" style={{ backgroundColor: 'rgba(174,200,245,0.14)', border: '1px solid rgba(174,200,245,0.3)' }}>
            <span className="text-xs font-semibold text-ink/80">You&apos;re viewing a demo instructor.</span>
            <button
              onClick={() => { exitDemo(); window.location.reload() }}
              className="text-xs font-bold rounded-xl px-3 py-1.5 shrink-0"
              style={{ backgroundColor: '#0D0D0F', color: '#fff' }}
            >
              Start your own
            </button>
          </div>
        )}


        {/* ── Greeting ── */}
        <div style={{ animation: 'fadeUp 400ms ease-out both' }}>
          <p className="text-sm font-medium text-stone tracking-wide uppercase mb-1">
            {now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
          <h1
            className="font-extrabold text-ink"
            style={{ fontSize: '40px', lineHeight: 1.05, fontVariationSettings: "'opsz' 96" }}
          >
            {firstName ? (
              <>{greeting(hour)},<br />{firstName}.</>
            ) : (
              <>{greeting(hour)}!</>
            )}
          </h1>
        </div>

        {editingSchedule && (
          <ScheduleSheet
            initial={schedule}
            onClose={() => setEditingSchedule(false)}
            onSaved={setSchedule}
          />
        )}

        {/* ── Next class hero card ── */}
        <section
          className="flex flex-col gap-3"
          style={{ animation: 'fadeUp 400ms ease-out 80ms both' }}
        >
          <div
            className="rounded-3xl p-6 flex flex-col gap-4 relative overflow-hidden"
            style={{ backgroundColor: '#0D0D0F' }}
          >
            {/* The Q mark — big, low-opacity, bleeding off the corner */}
            <span
              aria-hidden
              className="absolute font-extrabold pointer-events-none select-none"
              style={{
                right: '-28px',
                top: '-34px',
                fontSize: '170px',
                lineHeight: 1,
                color: '#AEC8F5',
                opacity: 0.22,
                fontVariationSettings: "'opsz' 96",
              }}
            >
              Q
            </span>

            {hasSchedule ? (
              <>
                <div className="flex items-center justify-between relative">
                  <p className="text-[10px] font-bold tracking-[3px] uppercase" style={{ color: '#AEC8F5' }}>
                    Next Class
                  </p>
                  <button
                    onClick={() => setEditingSchedule(true)}
                    className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-white/50 hover:text-white transition-colors"
                  >
                    <IconPencil size={11} stroke={2} />
                    Edit
                  </button>
                </div>

                <div className="flex items-start justify-between gap-3 relative">
                  <div>
                    <p className="text-xs font-medium tracking-widest uppercase text-white/60">
                      {nextClass && formatDate(nextClass)}
                    </p>
                    <p
                      className="text-white leading-none mt-1"
                      style={{ fontSize: '72px', fontWeight: 800, fontVariationSettings: "'opsz' 96", letterSpacing: '-2px' }}
                    >
                      {timeDigits}<span style={{ color: '#AEC8F5' }}>{meridiem}</span>
                    </p>
                    {moreThisWeek > 0 && (
                      <p className="text-xs mt-1.5 text-white/60">
                        + {moreThisWeek} more this week
                      </p>
                    )}
                  </div>
                  {isLinked && nextLinked && (
                    <Link href={`/build/result/${nextLinked.id}`} className="mt-1">
                      <LinkedDot white />
                    </Link>
                  )}
                </div>

                {albumArts.length > 0 && (
                  <div className="flex items-center relative">
                    {albumArts.map((url, i) => (
                      <img
                        key={url}
                        src={url}
                        alt=""
                        className={`w-8 h-8 rounded-full object-cover border-2 border-white${i > 0 ? ' -ml-2' : ''}`}
                      />
                    ))}
                  </div>
                )}

                <Link
                  href={isLinked ? '/library' : '/build'}
                  className="w-full text-center font-bold text-base rounded-2xl py-3.5 block active:opacity-80 transition-all relative hover:brightness-105"
                  style={{ backgroundColor: '#AEC8F5', color: '#0D0D0F' }}
                >
                  {isLinked ? 'Review your routine →' : 'Build routine'}
                </Link>

                {/* ── Reflection — last class, asked right on the anchor card.
                     Only asked once there's at least one routine that predates the
                     class — Q shouldn't ask how a class landed if it wasn't built in Q. ── */}
                {(() => {
                  const last = lastClass(schedule, now)
                  const taughtWithQ = last && routines.some(r => r.savedAt <= last.getTime())
                  return last && taughtWithQ ? <ReflectionStrip classDate={last} /> : null
                })()}
              </>
            ) : (
              <>
                <p className="text-[10px] font-bold tracking-[3px] uppercase relative" style={{ color: '#AEC8F5' }}>
                  Next Class
                </p>
                <div className="relative">
                  <p className="text-white font-extrabold" style={{ fontSize: '26px', lineHeight: 1.15, fontVariationSettings: "'opsz' 96" }}>
                    Help me help you.
                  </p>
                  <p className="text-sm mt-2 leading-relaxed max-w-[280px]" style={{ color: 'rgba(255,255,255,0.6)' }}>
                    I don&apos;t know your schedule yet — add the days and times you teach and I&apos;ll keep this card pointed at your next class.
                  </p>
                </div>
                <button
                  onClick={() => setEditingSchedule(true)}
                  className="w-full text-center font-bold text-base rounded-2xl py-3.5 block active:opacity-80 transition-all relative hover:brightness-105"
                  style={{ backgroundColor: '#AEC8F5', color: '#0D0D0F' }}
                >
                  Add my schedule
                </button>
              </>
            )}
          </div>
        </section>

        {/* ── Photo moment: the vibe, in one frame ── */}
        <section style={{ animation: 'fadeUp 400ms ease-out 120ms both' }}>
          <BrandPhoto
            src="/photos/tray-bw.jpg"
            alt="Grip sock balancing a coffee tray"
            height={300}
            position="50% 42%"
            caption="Pre-class ritual"
            headline="Grip socks on. Matcha secured."
          />
        </section>

        {/* ── Today's Cue — daily fact, powder left-rule + marker title ── */}
        <div
          className="-mt-2 -mb-2"
          style={{
            animation: 'fadeUp 400ms ease-out 140ms both',
            borderLeft: '4px solid #AEC8F5',
            padding: '2px 0 4px 16px',
          }}
        >
          <PenNote size={16} rotate="-1.5deg" style={{ display: 'inline-block' }}>
            today&apos;s cue — {todayFact.category}
          </PenNote>
          <p style={{ fontSize: '13.5px', lineHeight: 1.55, color: '#101012', marginTop: '6px' }}>
            {todayFact.fact}
          </p>
        </div>

        {/* ── Recent routines (horizontal scroll) ── */}
        <section
          className="flex flex-col gap-3"
          style={{ animation: 'fadeUp 400ms ease-out 160ms both' }}
        >
          <SectionLabel>Recent routines</SectionLabel>
          {recentRoutines.length === 0 ? (
            <div className="bg-white border border-border rounded-3xl px-5 py-8 flex flex-col items-center text-center gap-2 shadow-card">
              <p className="text-base font-bold text-ink">Your first routine is waiting.</p>
              <p className="text-sm text-stone">Every great class starts with a plan.</p>
              <Link
                href="/build"
                className="text-sm font-bold mt-2 text-ink underline decoration-powder decoration-2 underline-offset-4"
              >
                Build it now →
              </Link>
            </div>
          ) : (
            <div
              className="routine-scroll flex overflow-x-auto gap-3 -mx-4 px-4 pb-1"
              style={{ scrollSnapType: 'x mandatory' }}
            >
              {recentRoutines.map(r => (
                <Link
                  key={r.id}
                  href={`/build/result/${r.id}`}
                  className="flex-shrink-0 bg-white rounded-xl p-4 flex flex-col active:opacity-75 transition-opacity shadow-card"
                  style={{ minWidth: '220px', scrollSnapAlign: 'start' }}
                >
                  <p className="text-sm font-semibold text-ink truncate">{r.name}</p>
                  <p className="text-xs text-stone mt-0.5">
                    {formatSavedAt(r.savedAt)}&nbsp;&middot;&nbsp;{r.tldr.focus}
                  </p>
                  {r.spotifyPlaylistUrl && (
                    <a
                      href={r.spotifyPlaylistUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="inline-flex items-center gap-1 mt-1.5"
                      style={{ color: '#1DB954' }}
                    >
                      <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: '#1DB954' }} />
                      <span className="text-xs font-medium">
                        {r.playlistTracks ? `${r.playlistTracks.length} tracks` : 'Playlist'}
                      </span>
                    </a>
                  )}
                </Link>
              ))}
            </div>
          )}
        </section>

      </div>
    </>
  )
}
