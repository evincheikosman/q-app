'use client'

import { useState, useRef } from 'react'
import { anatomyGlossary } from '@/lib/anatomy'

// Sort terms longest-first so "transverse abdominis" matches before "abdominis"
const TERMS = Object.keys(anatomyGlossary).sort((a, b) => b.length - a.length)
const PATTERN = new RegExp(
  `(${TERMS.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`,
  'gi'
)

type Segment = { type: 'text'; content: string } | { type: 'term'; content: string }

function parse(text: string): Segment[] {
  const segments: Segment[] = []
  let last = 0
  let match: RegExpExecArray | null
  const re = new RegExp(PATTERN.source, PATTERN.flags)
  while ((match = re.exec(text)) !== null) {
    if (match.index > last) segments.push({ type: 'text', content: text.slice(last, match.index) })
    segments.push({ type: 'term', content: match[0] })
    last = match.index + match[0].length
  }
  if (last < text.length) segments.push({ type: 'text', content: text.slice(last) })
  return segments
}

function Term({ word }: { word: string }) {
  const [open, setOpen] = useState(false)
  const key = TERMS.find(t => t.toLowerCase() === word.toLowerCase()) ?? ''
  const def = anatomyGlossary[key] ?? ''
  const ref = useRef<HTMLSpanElement>(null)

  return (
    <span className="relative inline" ref={ref}>
      <span
        className="cursor-help"
        style={{
          textDecoration: 'underline dotted',
          textDecorationColor: 'var(--color-forest, #3d6b4f)',
          textUnderlineOffset: '2px',
        }}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onClick={() => setOpen(o => !o)}
      >
        {word}
      </span>
      {open && def && (
        <span
          className="absolute z-50 bottom-full left-1/2 mb-2 block w-48 rounded-xl border border-border bg-canvas px-3 py-2 text-xs leading-relaxed text-ink shadow-md"
          style={{ transform: 'translateX(-50%)', pointerEvents: 'none' }}
        >
          {def}
        </span>
      )}
    </span>
  )
}

export default function AnatomyTooltip({ text }: { text: string }) {
  const segments = parse(text)
  return (
    <>
      {segments.map((seg, i) =>
        seg.type === 'term'
          ? <Term key={i} word={seg.content} />
          : <span key={i}>{seg.content}</span>
      )}
    </>
  )
}
