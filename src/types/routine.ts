export interface Move {
  name: string
  duration: number
  bilateral: boolean
  cue: string
  springChange?: string
}

export interface Block {
  name: string
  spring: string
  moves: Move[]
}

export interface Tldr {
  focus: string
  whereTheyWillFeelIt: string
  note: string
}

export interface SlotDetail {
  day: number       // 0=Sun…6=Sat
  hour: number
  minute: number
  slotLabel: string // e.g. "Saturday 11:00 AM"
  date: string      // ISO string of the upcoming occurrence when saved
}

export interface SavedRoutine {
  id: number
  name: string
  savedAt: number
  selectedClasses: string[]
  selectedSlots: SlotDetail[]
  energyArc: string | null
  selectedEmphasis: string[]
  vibe: string
  favorited?: boolean
  classOpener: string
  tldr: Tldr
  totalMinutes: number
  blocks: Block[]
  classLevel?: string | null
  moveNotes?: string | null
  builtToOrder?: string[]
  spotifyPlaylistUrl?: string | null
  playlistTracks?: Array<{ track: string; artist: string; block: string; albumArt?: string | null }>
}
