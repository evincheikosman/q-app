'use client'

/**
 * NotesStack — the instructor's own sticky notes on Your Cue.
 * Tap the stack to flip through; add a note typed on the phone but rendered
 * in the marker's handwriting. POWDER: paper-white cards, hairline border.
 * Q reads each note and doodles something fitting on it automatically.
 * Persisted in localStorage under `q_notes`.
 */

import React, { useEffect, useRef, useState } from 'react'
import { IconPlus, IconX, IconTrash, IconHighlight } from '@tabler/icons-react'
import {
  ScribbleSweat,
  ScribbleMusicNotes,
  ScribbleBottle,
  ScribbleHeart,
  ScribbleSpring,
  ScribbleStar,
  ScribbleCat,
} from '@/components/Scribble'
import { useUndoToast } from '@/components/Toast'

interface QNote {
  id: number
  text: string
  color: string
  createdAt: number
  /** Highlighter swipe behind the text — in the card's highlighter color */
  highlighted?: boolean
}

/** Marker-highlighted span — swipe behind the text, wraps cleanly across lines */
function HighlightSpan({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span
      style={{
        backgroundColor: color,
        boxDecorationBreak: 'clone',
        WebkitBoxDecorationBreak: 'clone',
        padding: '1px 6px 3px',
      }}
    >
      {children}
    </span>
  )
}

/** Renders note text, swiping the highlighter behind ==marked== words.
 *  `wholeNote` highlights everything (the legacy whole-note toggle). */
function NoteText({
  text,
  color,
  wholeNote,
}: {
  text: string
  color: string
  wholeNote?: boolean
}) {
  if (wholeNote) return <HighlightSpan color={color}>{text.replace(/==/g, '')}</HighlightSpan>
  const parts = text.split(/==([^=]+)==/g)
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <HighlightSpan key={i} color={color}>
            {part}
          </HighlightSpan>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        )
      )}
    </>
  )
}

/** POWDER sticky palette — three cards, each with its own text + highlighter:
 *  white  → ink text,   powder highlighter
 *  powder → black text, white highlighter
 *  black  → white text, powder highlighter                                   */
const NOTE_STYLES: Record<
  string,
  { bg: string; text: string; highlight: string; textOnHighlight: string; border?: string }
> = {
  '#FFFFFF': { bg: '#FFFFFF', text: '#101012', highlight: '#AEC8F5', textOnHighlight: '#101012', border: '1px solid #E8E8E6' },
  '#AEC8F5': { bg: '#AEC8F5', text: '#0D0D0F', highlight: '#FFFFFF', textOnHighlight: '#0D0D0F' },
  '#0D0D0F': { bg: '#0D0D0F', text: '#FFFFFF', highlight: '#AEC8F5', textOnHighlight: '#0D0D0F' },
}
const COLORS = Object.keys(NOTE_STYLES)
const DEFAULT_CARD = '#FFFFFF'

/** Old pastel notes in localStorage fall back to the white card */
function noteStyle(color: string) {
  return NOTE_STYLES[color] ?? NOTE_STYLES[DEFAULT_CARD]
}

/** Q's automatic doodle — reads the note, picks a fitting drawing.
 *  Drawn in the card's marker color so it reads on any sticky. */
function autoDoodle(text: string, color: string) {
  const t = text.toLowerCase()
  if (/(hard|brutal|killer|dying|sore|tough)/.test(t)) return <ScribbleSweat width={26} color={color} />
  if (/(music|song|playlist|track|artist|beat)/.test(t)) return <ScribbleMusicNotes width={28} color={color} />
  if (/(water|hydrate|drink)/.test(t)) return <ScribbleBottle width={20} color={color} />
  if (/(love|heart|fav|best)/.test(t)) return <ScribbleHeart width={26} color={color} />
  if (/(spring|load|heavy|tension)/.test(t)) return <ScribbleSpring width={54} color={color} />
  if (/(cat|meow)/.test(t)) return <ScribbleCat width={30} color={color} />
  if (t.includes('!')) return <ScribbleStar width={22} color={color} />
  return null
}

function fmtDate(ts: number) {
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function NotesStack() {
  const [notes, setNotes] = useState<QNote[]>([])
  const [index, setIndex] = useState(0)
  const [composing, setComposing] = useState(false)
  const [draft, setDraft] = useState('')
  const [draftColor, setDraftColor] = useState<string>(DEFAULT_CARD)
  const [draftHighlight, setDraftHighlight] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const { toast, show: showToast } = useUndoToast()

  /** Highlighter tap: selection → highlight just those words (==markers==);
   *  no selection → toggle the whole note. */
  function applyHighlighter() {
    const ta = textareaRef.current
    const start = ta?.selectionStart ?? 0
    const end = ta?.selectionEnd ?? 0
    if (ta && end > start) {
      const sel = draft.slice(start, end)
      // If the selection is already wrapped, unwrap it instead
      const before = draft.slice(0, start)
      const after = draft.slice(end)
      if (before.endsWith('==') && after.startsWith('==')) {
        setDraft(before.slice(0, -2) + sel + after.slice(2))
      } else {
        setDraft(before + '==' + sel + '==' + after)
      }
      requestAnimationFrame(() => ta.focus())
    } else {
      setDraftHighlight(h => !h)
    }
  }

  const draftHasMarks = /==[^=]+==/.test(draft)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('q_notes')
      if (stored) setNotes(JSON.parse(stored))
    } catch {}
    setLoaded(true)
  }, [])

  function persist(next: QNote[]) {
    setNotes(next)
    localStorage.setItem('q_notes', JSON.stringify(next))
  }

  function addNote() {
    const text = draft.trim()
    if (!text) return
    const next = [
      { id: Date.now(), text, color: draftColor, createdAt: Date.now(), highlighted: draftHighlight },
      ...notes,
    ]
    persist(next)
    setDraft('')
    setDraftHighlight(false)
    setComposing(false)
    setIndex(0)
  }

  function deleteNote(id: number) {
    const prev = notes
    const next = notes.filter(n => n.id !== id)
    persist(next)
    setIndex(i => Math.min(i, Math.max(0, next.length - 1)))
    showToast('Note deleted', () => {
      persist(prev)
      setIndex(0)
    })
  }

  const current = notes[index]

  return (
    <div className="flex flex-col gap-3">
      {toast}
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold tracking-widest uppercase text-stone">Notes to self</p>
        <div className="flex items-center gap-2">
          {notes.length > 1 && (
            <span className="text-xs text-stone">
              {index + 1} / {notes.length}
            </span>
          )}
          <button
            onClick={() => setComposing(c => !c)}
            aria-label={composing ? 'Cancel' : 'New note'}
            className="w-7 h-7 rounded-full flex items-center justify-center border-2 border-forest text-forest active:opacity-70 transition-opacity"
          >
            {composing ? <IconX size={14} stroke={2.5} /> : <IconPlus size={14} stroke={2.5} />}
          </button>
        </div>
      </div>

      {/* Compose */}
      {composing && (
        <div
          className="rounded-sm px-4 pt-3 pb-4 flex flex-col gap-3"
          style={{
            backgroundColor: draftColor,
            border: noteStyle(draftColor).border,
            transform: 'rotate(-1deg)',
            boxShadow: '0 6px 16px rgba(16,16,18,0.12)',
          }}
        >
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            placeholder="note to self…"
            rows={3}
            autoFocus
            maxLength={160}
            className="font-pen w-full bg-transparent outline-none resize-none placeholder:opacity-40"
            style={{ fontSize: '17px', lineHeight: 1.45, color: noteStyle(draftColor).text }}
          />
          {/* Live preview once the highlighter has touched anything */}
          {(draftHasMarks || draftHighlight) && draft.trim() && (
            <p
              className="font-pen"
              style={{
                fontSize: '17px',
                lineHeight: 1.65,
                color: draftHighlight
                  ? noteStyle(draftColor).textOnHighlight
                  : noteStyle(draftColor).text,
              }}
            >
              <NoteText
                text={draft}
                color={noteStyle(draftColor).highlight}
                wholeNote={draftHighlight}
              />
            </p>
          )}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setDraftColor(c)}
                  aria-label="Note color"
                  className="w-6 h-6 rounded-full border-2 transition-transform"
                  style={{
                    backgroundColor: c,
                    borderColor: draftColor === c ? noteStyle(c).highlight : 'rgba(16,16,18,0.2)',
                    transform: draftColor === c ? 'scale(1.15)' : 'none',
                  }}
                />
              ))}
              {/* The highlighter — select words first to swipe just those; tap with
                  nothing selected to highlight the whole note */}
              <button
                onClick={applyHighlighter}
                aria-label="Highlighter — select words to highlight them, or tap to highlight everything"
                aria-pressed={draftHighlight || draftHasMarks}
                className="ml-1 w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all"
                style={{
                  backgroundColor:
                    draftHighlight || draftHasMarks ? noteStyle(draftColor).highlight : 'transparent',
                  borderColor:
                    draftHighlight || draftHasMarks
                      ? noteStyle(draftColor).highlight
                      : 'rgba(16,16,18,0.2)',
                  color:
                    draftHighlight || draftHasMarks
                      ? noteStyle(draftColor).textOnHighlight
                      : noteStyle(draftColor).text,
                }}
              >
                <IconHighlight size={15} stroke={2} />
              </button>
              <span
                className="text-[10px] leading-tight max-w-[110px]"
                style={{ color: noteStyle(draftColor).text, opacity: 0.55 }}
              >
                select words, then tap to highlight
              </span>
            </div>
            <button
              onClick={addNote}
              className="text-sm font-bold rounded-full px-4 py-1.5 active:opacity-80"
              style={{
                backgroundColor: noteStyle(draftColor).text,
                color: noteStyle(draftColor).bg,
              }}
            >
              Stick it
            </button>
          </div>
        </div>
      )}

      {/* The stack */}
      {loaded && notes.length === 0 && !composing ? (
        <button
          onClick={() => setComposing(true)}
          className="rounded-sm px-5 py-6 text-left"
          style={{
            backgroundColor: DEFAULT_CARD,
            border: noteStyle(DEFAULT_CARD).border,
            transform: 'rotate(-1.5deg)',
            boxShadow: '0 6px 16px rgba(16,16,18,0.08)',
          }}
        >
          <span className="font-pen" style={{ fontSize: '16px', lineHeight: 1.45, color: '#101012' }}>
            nothing here yet — tap to leave yourself a note…
          </span>
        </button>
      ) : current ? (
        <div className="relative" style={{ paddingBottom: notes.length > 1 ? '10px' : 0 }}>
          {/* peeking edges of the notes behind */}
          {notes.length > 2 && (
            <div
              className="absolute inset-x-4 bottom-0 h-10 rounded-sm"
              style={{
                backgroundColor: noteStyle(notes[(index + 2) % notes.length].color).bg,
                border: noteStyle(notes[(index + 2) % notes.length].color).border,
                transform: 'rotate(1.6deg)',
                boxShadow: '0 3px 8px rgba(16,16,18,0.07)',
              }}
            />
          )}
          {notes.length > 1 && (
            <div
              className="absolute inset-x-2 bottom-1 h-10 rounded-sm"
              style={{
                backgroundColor: noteStyle(notes[(index + 1) % notes.length].color).bg,
                border: noteStyle(notes[(index + 1) % notes.length].color).border,
                transform: 'rotate(-1.2deg)',
                boxShadow: '0 3px 10px rgba(16,16,18,0.08)',
              }}
            />
          )}
          {/* top note — tap to flip through */}
          <button
            onClick={() => setIndex(i => (i + 1) % notes.length)}
            className="relative w-full text-left rounded-sm px-5 pt-4 pb-3"
            style={{
              backgroundColor: noteStyle(current.color).bg,
              border: noteStyle(current.color).border,
              transform: 'rotate(-0.8deg)',
              boxShadow: '0 6px 16px rgba(16,16,18,0.09)',
            }}
          >
            <p
              className="font-pen whitespace-pre-wrap break-words"
              style={{
                fontSize: '17px',
                lineHeight: current.highlighted || /==[^=]+==/.test(current.text) ? 1.65 : 1.45,
                color: current.highlighted
                  ? noteStyle(current.color).textOnHighlight
                  : noteStyle(current.color).text,
              }}
            >
              <NoteText
                text={current.text}
                color={noteStyle(current.color).highlight}
                wholeNote={current.highlighted}
              />
            </p>
            <div className="flex items-end justify-between mt-3">
              <span
                className="text-[10px] font-semibold uppercase tracking-widest"
                style={{ color: noteStyle(current.color).highlight }}
              >
                {fmtDate(current.createdAt)}
              </span>
              <span className="flex items-center gap-2">
                <span style={{ opacity: 0.85, color: noteStyle(current.color).text }}>
                  {autoDoodle(current.text, noteStyle(current.color).text)}
                </span>
                <span
                  role="button"
                  tabIndex={0}
                  aria-label="Delete note"
                  onClick={e => {
                    e.stopPropagation()
                    deleteNote(current.id)
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') deleteNote(current.id)
                  }}
                  className="transition-opacity opacity-30 hover:opacity-60"
                  style={{ color: noteStyle(current.color).text }}
                >
                  <IconTrash size={14} stroke={2} />
                </span>
              </span>
            </div>
          </button>
        </div>
      ) : null}
    </div>
  )
}
