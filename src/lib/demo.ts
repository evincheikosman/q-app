/**
 * Demo seeding — realistic sample data so Q never demos with blank states.
 * One tap on first run fills Library, Your Cue, and Notes with believable
 * Lagree content. Clearly Evîn-flavored; safe to delete piece by piece.
 */

import type { SavedRoutine } from '@/types/routine'
import { saveSchedule, hasSchedule } from '@/lib/schedule'
import { saveProfile } from '@/lib/profile'

const WEEK = 7 * 24 * 60 * 60 * 1000

/** Next occurrence of a weekly slot — keeps demo routines linked to real upcoming classes */
function nextSlot(day: number, hour: number, minute: number, label: string) {
  const now = new Date()
  let daysUntil = (day - now.getDay() + 7) % 7
  const candidate = new Date(now)
  candidate.setDate(now.getDate() + daysUntil)
  candidate.setHours(hour, minute, 0, 0)
  if (candidate <= now) candidate.setDate(candidate.getDate() + 7)
  return { day, hour, minute, slotLabel: label, date: candidate.toISOString() }
}

function routineOne(now: number): SavedRoutine {
  return {
    id: now - WEEK,
    name: 'Saturday 11:00 AM — dark & driven',
    savedAt: now - WEEK,
    selectedClasses: ['slot-0'],
    selectedSlots: [nextSlot(6, 11, 0, 'Saturday 11:00 AM')],
    energyArc: 'Slow build → big finish',
    selectedEmphasis: ['Glutes & hamstrings'],
    vibe: 'dark and driven',
    favorited: true,
    classOpener:
      "Today we build slow and finish loud. Trust the tempo — the shake means it's working.",
    tldr: {
      focus: 'glutes, hamstrings, core',
      whereTheyWillFeelIt: 'Posterior chain first — glutes and hamstrings — with deep core to open and close.',
      note: 'Heavy leg block runs long. Cue breathing before the spring change.',
    },
    totalMinutes: 32,
    blocks: [
      {
        name: 'Core opener',
        spring: '1 yellow',
        moves: [
          { name: 'Plank to Pike', duration: 1, bilateral: true, cue: 'Slow up, slower down.', },
          { name: 'Bear', duration: 1, bilateral: true, cue: 'Knees hover, spine long.' },
          { name: 'Super Crunch', duration: 2, bilateral: true, cue: 'Ribs to hips, no momentum.' },
        ],
      },
      {
        name: 'Heavy legs — side A',
        spring: '1 red + 1 yellow',
        moves: [
          { name: 'Spider Lunge', duration: 2, bilateral: false, cue: 'Back heel heavy, front knee tracks.' },
          { name: 'Deadlift', duration: 2, bilateral: false, cue: 'Hinge, don’t bow.' },
          { name: "Runner's Lunge", duration: 2, bilateral: false, cue: 'Drive through the mid-foot.' },
          { name: 'Curtsy Lunge', duration: 2, bilateral: false, cue: 'Cross back, stay low.' },
        ],
      },
      {
        name: 'Obliques — side A',
        spring: '1 yellow',
        moves: [
          { name: 'Mermaid Twist', duration: 1, bilateral: false, cue: 'Reach long before you rotate.' },
          { name: 'Side Plank', duration: 2, bilateral: false, cue: 'Stack, then lift the waist.' },
        ],
      },
      {
        name: 'Heavy legs — side B',
        spring: '1 red + 1 yellow',
        moves: [
          { name: 'Spider Lunge', duration: 2, bilateral: false, cue: 'Same story, other side.' },
          { name: 'Single Leg Deadlift', duration: 2, bilateral: false, cue: 'Square the hips.' },
          { name: 'Leg Sweep', duration: 2, bilateral: false, cue: 'Sweep, don’t swing.' },
          { name: 'Donkey Kicks', duration: 2, bilateral: false, cue: 'Heel to the ceiling, hips square.' },
        ],
      },
      {
        name: 'Obliques — side B',
        spring: '1 yellow',
        moves: [
          { name: 'Mermaid Twist', duration: 1, bilateral: false, cue: 'Long spine, low shoulders.' },
          { name: 'Twisted Wheelbarrow', duration: 1, bilateral: false, cue: 'Hips quiet, torso turns.' },
        ],
      },
      {
        name: 'Arms',
        spring: '1 blue',
        moves: [
          { name: 'Serve the Platter', duration: 1, bilateral: true, cue: 'Elbows soft, tempo strict.' },
          { name: 'Tricep Extension', duration: 1, bilateral: true, cue: 'Pin the elbows.' },
          { name: 'Seated Row', duration: 1, bilateral: true, cue: 'Pull from the back, not the hands.' },
          { name: 'Shoulder Press', duration: 1, bilateral: true, cue: 'Ribs down as you press.' },
        ],
      },
      {
        name: 'Core closer',
        spring: '1 yellow',
        moves: [
          { name: 'Wheelbarrow', duration: 1, bilateral: true, cue: 'Everything you have left.' },
          { name: 'Forearm Plank', duration: 2, bilateral: true, cue: 'Hold. Breathe. Done.' },
        ],
      },
    ],
    spotifyPlaylistUrl: null,
    playlistTracks: [
      { track: 'Enjoy the Silence', artist: 'Depeche Mode', block: 'Core opener' },
      { track: 'Personal Jesus', artist: 'Depeche Mode', block: 'Heavy legs — side A' },
      { track: 'Von dutch', artist: 'Charli XCX', block: 'Heavy legs — side A' },
      { track: 'Club classics', artist: 'Charli XCX', block: 'Heavy legs — side B' },
      { track: 'Disorder', artist: 'Joy Division', block: 'Obliques — side A' },
      { track: 'Abracadabra', artist: 'Lady Gaga', block: 'Arms' },
      { track: 'Bloody Mary', artist: 'Lady Gaga', block: 'Core closer' },
    ],
  }
}

function routineTwo(now: number): SavedRoutine {
  return {
    id: now - 2 * 86400000,
    name: 'Sunday 10:10 AM — feel-good flow',
    savedAt: now - 2 * 86400000,
    selectedClasses: ['slot-2'],
    selectedSlots: [nextSlot(0, 10, 10, 'Sunday 10:10 AM')],
    energyArc: 'Sustained energy',
    selectedEmphasis: ['Core & obliques'],
    vibe: 'feel-good flow, saturday energy',
    favorited: false,
    classOpener: 'Even burn today — no peaks, no coasting. Find the pace you can hold.',
    tldr: {
      focus: 'core, obliques, light legs',
      whereTheyWillFeelIt: 'Center of the body all class — deep core with oblique rotation.',
      note: 'Keep transitions tight; the flow is the point.',
    },
    totalMinutes: 32,
    blocks: [
      {
        name: 'Core opener',
        spring: '1 yellow',
        moves: [
          { name: 'Catfish', duration: 1, bilateral: true, cue: 'Curl in, reach long.' },
          { name: 'Reverse Bear', duration: 1, bilateral: true, cue: 'Press the carriage away.' },
          { name: 'Spoon', duration: 2, bilateral: true, cue: 'Scoop the low belly.' },
        ],
      },
      {
        name: 'Light legs — side A',
        spring: '1 yellow',
        moves: [
          { name: 'Elevator Lunge', duration: 2, bilateral: false, cue: 'Three floors down, three up.' },
          { name: 'Hamstring Curls', duration: 2, bilateral: false, cue: 'Heels heavy.' },
          { name: 'Light Squats', duration: 2, bilateral: false, cue: 'Sit back, chest proud.' },
          { name: 'Side Lunge', duration: 2, bilateral: false, cue: 'Push the floor away.' },
        ],
      },
      {
        name: 'Obliques — side A',
        spring: '1 yellow',
        moves: [
          { name: 'French Twist', duration: 1, bilateral: false, cue: 'Rotate from the ribs.' },
          { name: 'Kneeling Side Crunch', duration: 2, bilateral: false, cue: 'Short range, deep burn.' },
        ],
      },
      {
        name: 'Light legs — side B',
        spring: '1 yellow',
        moves: [
          { name: 'Elevator Lunge', duration: 2, bilateral: false, cue: 'Match side A’s tempo.' },
          { name: 'Well Lunge', duration: 2, bilateral: false, cue: 'Depth over speed.' },
          { name: 'Single Leg Squat', duration: 2, bilateral: false, cue: 'Slow negatives.' },
          { name: 'Skater', duration: 2, bilateral: false, cue: 'Glide out, control in.' },
        ],
      },
      {
        name: 'Obliques — side B',
        spring: '1 yellow',
        moves: [
          { name: 'French Twist', duration: 1, bilateral: false, cue: 'Same reach, other side.' },
          { name: 'Soul Train', duration: 1, bilateral: false, cue: 'Glide, don’t jerk.' },
        ],
      },
      {
        name: 'Arms',
        spring: '1 blue',
        moves: [
          { name: 'Hug a Tree', duration: 1, bilateral: true, cue: 'Wide arms, proud chest.' },
          { name: 'Lateral Raise', duration: 1, bilateral: true, cue: 'Lead with the elbows.' },
          { name: 'Kneeling Bicep Curl', duration: 1, bilateral: true, cue: 'No swinging.' },
          { name: 'Chest Opener', duration: 1, bilateral: true, cue: 'Open slow, resist back.' },
        ],
      },
      {
        name: 'Core closer',
        spring: '1 yellow',
        moves: [
          { name: 'Teaser', duration: 1, bilateral: true, cue: 'Balance, then breathe.' },
          { name: 'Plank', duration: 2, bilateral: true, cue: 'Finish tall from the inside.' },
        ],
      },
    ],
    spotifyPlaylistUrl: null,
    playlistTracks: [
      { track: '360', artist: 'Charli XCX', block: 'Core opener' },
      { track: 'Espresso', artist: 'Sabrina Carpenter', block: 'Light legs — side A' },
      { track: 'Juno', artist: 'Sabrina Carpenter', block: 'Light legs — side B' },
      { track: 'Housework', artist: 'Jade', block: 'Obliques — side A' },
      { track: 'Abracadabra', artist: 'Lady Gaga', block: 'Arms' },
      { track: 'Talk talk', artist: 'Charli XCX', block: 'Core closer' },
    ],
  }
}

interface DemoNote {
  id: number
  text: string
  color: string
  createdAt: number
  highlighted?: boolean
}

function isEmpty(key: string): boolean {
  try {
    const raw = localStorage.getItem(key)
    return !raw || JSON.parse(raw).length === 0
  } catch {
    return true
  }
}

/** Non-destructive: only fills stores that are actually empty */
export function seedDemoData() {
  const now = Date.now()

  if (isEmpty('q_routines')) {
    const routines: SavedRoutine[] = [routineTwo(now), routineOne(now)]
    localStorage.setItem('q_routines', JSON.stringify(routines))
  }

  // The two demo routines are linked to Sat 11:00 / Sun 10:10 — seed a matching
  // demo schedule so "Next class" has something to show. Non-destructive: never
  // overwrites a schedule the instructor already entered themselves.
  if (!hasSchedule()) {
    saveSchedule([
      { day: 6, hour: 11, minute: 0 },
      { day: 0, hour: 10, minute: 10 },
    ])
  }

  const notes: DemoNote[] = [
    {
      id: now - 3 * 86400000,
      text: 'the ==slow build arc== hit different on saturday. keep it.',
      color: '#0D0D0F',
      createdAt: now - 3 * 86400000,
    },
    {
      id: now - 86400000,
      text: 'less arms, more hamstrings. they can take it!',
      color: '#AEC8F5',
      createdAt: now - 86400000,
    },
  ]
  if (isEmpty('q_notes')) {
    localStorage.setItem('q_notes', JSON.stringify(notes))
  }

  localStorage.setItem('q_demo_seeded', '1')
}

export function isFirstRun(): boolean {
  try {
    return !localStorage.getItem('q_intro_seen')
  } catch {
    return false
  }
}

export function markIntroSeen() {
  localStorage.setItem('q_intro_seen', '1')
}


// ─── One-tap demo instructor ─────────────────────────────────────────────────
// Lands a first-time visitor (a recruiter, say) in a fully lived-in app AS Evîn —
// her identity + seeded routines/notes/schedule — instead of a blank setup screen.
// Everything stays localStorage-only, so this never touches a real user's data,
// and a real user can always leave the demo and start their own (see exitDemo).

export const EVIN_DEMO_PROFILE = {
  name: 'Evîn',
  studio: '',
  photoDataUrl: '/evin-demo.jpg',
}

export function startDemoAsEvin() {
  saveProfile(EVIN_DEMO_PROFILE)
  seedDemoData()
  markIntroSeen()
  try { localStorage.setItem('q_demo_mode', '1') } catch {}
}

export function isDemoMode(): boolean {
  try { return localStorage.getItem('q_demo_mode') === '1' } catch { return false }
}

/** Leave the demo and wipe the seeded identity/content so a real user starts clean. */
export function exitDemo() {
  try {
    ;['q_profile', 'q_routines', 'q_notes', 'q_schedule', 'q_demo_seeded', 'q_demo_mode', 'q_intro_seen']
      .forEach(k => localStorage.removeItem(k))
  } catch {}
}
