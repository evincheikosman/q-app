/**
 * The instructor directory — the same fictional Core40 instructors who appear
 * in the Community feed. One source of truth for Messages, sharing, and feed.
 */

export interface Instructor {
  id: string
  name: string
  studio: string
  avatarColor: string
}

export const INSTRUCTORS: Instructor[] = [
  { id: 'mara', name: 'Mara Velden', studio: 'Core40 Amsterdam', avatarColor: '#0D0D0F' },
  { id: 'jonah', name: 'Jonah Reyes', studio: 'Core40 Los Angeles', avatarColor: '#AEC8F5' },
  { id: 'suki', name: 'Suki Tanaka', studio: 'Core40 San Francisco', avatarColor: '#8A8A8A' },
  { id: 'lena', name: 'Lena Drost', studio: 'Core40 Amsterdam', avatarColor: '#101012' },
  { id: 'caleb', name: 'Caleb Monroe', studio: 'Core40 Los Angeles', avatarColor: '#0D0D0F' },
]

export function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('')
}

// ─── Message storage ──────────────────────────────────────────────────────────

export interface RoutineShare {
  routineId: number
  name: string
  focus: string
  minutes: number
}

export interface PlaylistShare {
  routineId: number
  name: string
  trackCount: number
  artists: string // e.g. "Depeche Mode, Charli XCX & more"
  spotifyUrl?: string | null
}

export interface Message {
  from: 'me' | 'them'
  text?: string
  routine?: RoutineShare
  playlist?: PlaylistShare
  ts: number
}

export type Threads = Record<string, Message[]>

const KEY = 'q_messages'

/** Seeded so the demo never opens onto an empty inbox */
const SEED: Threads = {
  mara: [
    { from: 'them', text: 'Your glutes & hamstrings block from last week — my Amsterdam ladies are still complaining. In the good way.', ts: Date.now() - 2 * 86400000 },
    { from: 'me', text: 'That’s the only way I want them complaining 😌', ts: Date.now() - 2 * 86400000 + 3600000 },
  ],
  suki: [
    { from: 'them', text: 'Saw your routine got favorited again. Teach me your ways.', ts: Date.now() - 5 * 86400000 },
  ],
}

export function loadThreads(): Threads {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return { ...SEED }
}

export function saveThreads(threads: Threads) {
  localStorage.setItem(KEY, JSON.stringify(threads))
}

export function sendMessage(instructorId: string, message: Message): Threads {
  const threads = loadThreads()
  const next = { ...threads, [instructorId]: [...(threads[instructorId] ?? []), message] }
  saveThreads(next)
  window.dispatchEvent(new Event('q-messages-changed'))
  return next
}

// ─── Pinned threads (iMessage-style — big avatars above the inbox) ───────────

const PIN_KEY = 'q_messages_pinned'
const MAX_PINS = 4

export function loadPinned(): string[] {
  try {
    return JSON.parse(localStorage.getItem(PIN_KEY) ?? '[]')
  } catch {
    return []
  }
}

/** Toggle a pin. Returns the new list; caps at MAX_PINS (oldest pin drops). */
export function togglePin(instructorId: string): string[] {
  let pinned = loadPinned()
  if (pinned.includes(instructorId)) {
    pinned = pinned.filter(id => id !== instructorId)
  } else {
    pinned = [...pinned, instructorId].slice(-MAX_PINS)
  }
  localStorage.setItem(PIN_KEY, JSON.stringify(pinned))
  window.dispatchEvent(new Event('q-messages-changed'))
  return pinned
}

// ─── Read tracking (for the nav unread badge) ─────────────────────────────────

const READ_KEY = 'q_messages_read'

/** Per-thread: how many messages had been seen when the thread was last opened */
export function loadRead(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(READ_KEY) ?? '{}')
  } catch {
    return {}
  }
}

export function markThreadRead(instructorId: string, seenCount: number) {
  const read = loadRead()
  read[instructorId] = seenCount
  localStorage.setItem(READ_KEY, JSON.stringify(read))
  window.dispatchEvent(new Event('q-messages-changed'))
}

/** Unread = incoming messages past the last-seen point, across all threads */
export function totalUnread(): number {
  const threads = loadThreads()
  const read = loadRead()
  let n = 0
  for (const [id, msgs] of Object.entries(threads)) {
    n += msgs.slice(read[id] ?? 0).filter(m => m.from === 'them').length
  }
  return n
}

/** Unread for one thread */
export function threadUnread(instructorId: string, threads: Threads): number {
  const read = loadRead()
  return (threads[instructorId] ?? []).slice(read[instructorId] ?? 0).filter(m => m.from === 'them').length
}

/** Most-engaged instructors first: thread length, then directory order */
export function byEngagement(threads: Threads): Instructor[] {
  return [...INSTRUCTORS].sort(
    (a, b) => (threads[b.id]?.length ?? 0) - (threads[a.id]?.length ?? 0)
  )
}
