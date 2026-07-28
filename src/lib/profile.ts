/**
 * The local instructor profile — name, studio, optional photo.
 *
 * Q is a single-device, localStorage-only app: every visitor gets their own
 * private browser storage, so nothing about Evîn's routines/notes/messages
 * is ever visible to anyone else who opens the deployed URL. The one thing
 * that WAS hardcoded — the "Evîn" name, headshot, and credential line on
 * Your Cue, Home, and Community — is fixed by this profile, captured once
 * during first-run and reused everywhere a name/photo appears.
 */

export interface Profile {
  name: string
  studio: string
  photoDataUrl: string | null
}

const KEY = 'q_profile'

export function loadProfile(): Profile | null {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Profile) : null
  } catch {
    return null
  }
}

export function saveProfile(p: Profile) {
  try {
    localStorage.setItem(KEY, JSON.stringify(p))
  } catch {}
}

export function hasProfile(): boolean {
  try {
    return !!localStorage.getItem(KEY)
  } catch {
    return false
  }
}
