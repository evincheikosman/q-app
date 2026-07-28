/**
 * The instructor's own teaching schedule — days + times they actually teach.
 *
 * Nothing is hardcoded here. On a fresh install there IS no schedule; Home
 * shows a plain "add your schedule" prompt instead of guessing. Once slots
 * are saved, Home/Build compute "next class" from them and everything
 * (routine linking, reflections) follows from what the instructor entered.
 */

export interface ClassSlot {
  day: number // 0 = Sunday ... 6 = Saturday
  hour: number
  minute: number
}

const KEY = 'q_schedule'

export const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
]

export function loadSchedule(): ClassSlot[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveSchedule(slots: ClassSlot[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(slots))
  } catch {}
}

export function hasSchedule(): boolean {
  return loadSchedule().length > 0
}

/** Next upcoming occurrence of a weekly slot, relative to `now`. */
export function nextOccurrence(day: number, hour: number, minute: number, now: Date): Date {
  const currentDay = now.getDay()
  let daysUntil = (day - currentDay + 7) % 7
  if (daysUntil === 0) {
    const slot = new Date(now)
    slot.setHours(hour, minute, 0, 0)
    if (slot <= now) daysUntil = 7
  }
  const date = new Date(now)
  date.setDate(now.getDate() + daysUntil)
  date.setHours(hour, minute, 0, 0)
  date.setSeconds(0, 0)
  return date
}
