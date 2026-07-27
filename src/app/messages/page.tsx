'use client'

/**
 * Messages — instructor DMs, Instagram-style. Conversation list → thread view.
 * Shared routines render as mini POWDER share cards inside the thread.
 * Local-only for now (sample instructors); real-time comes with a backend.
 */

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { IconChevronLeft, IconSend, IconPin, IconPinFilled } from '@tabler/icons-react'
import {
  INSTRUCTORS,
  initials,
  loadThreads,
  sendMessage,
  byEngagement,
  markThreadRead,
  threadUnread,
  loadPinned,
  togglePin,
  type Threads,
  type Message,
} from '@/lib/instructors'

function timeAgo(ts: number) {
  const mins = Math.floor((Date.now() - ts) / 60000)
  if (mins < 1) return 'now'
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  return `${Math.floor(hours / 24)}d`
}

function Avatar({ color, name, size = 44 }: { color: string; name: string; size?: number }) {
  return (
    <div
      className="rounded-full flex items-center justify-center shrink-0"
      style={{ width: size, height: size, backgroundColor: color }}
    >
      <span
        className="font-bold"
        style={{ fontSize: size * 0.28, color: color === '#AEC8F5' ? '#0D0D0F' : '#FFFFFF' }}
      >
        {initials(name)}
      </span>
    </div>
  )
}

export default function MessagesPage() {
  const [threads, setThreads] = useState<Threads>({})
  const [openId, setOpenId] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [loaded, setLoaded] = useState(false)
  const [pinned, setPinned] = useState<string[]>([])
  const bottomRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    setThreads(loadThreads())
    setPinned(loadPinned())
    setLoaded(true)
    // deep link: /messages?to=mara (used by "Shared with…" toasts)
    const to = new URLSearchParams(window.location.search).get('to')
    if (to && INSTRUCTORS.some(i => i.id === to)) setOpenId(to)
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [openId, threads])

  // Opening a thread marks it read (clears the nav badge for those messages)
  useEffect(() => {
    if (openId) markThreadRead(openId, (threads[openId] ?? []).length)
  }, [openId, threads])

  function send() {
    if (!openId || !draft.trim()) return
    setThreads(sendMessage(openId, { from: 'me', text: draft.trim(), ts: Date.now() }))
    setDraft('')
  }

  if (!loaded) return null

  const open = INSTRUCTORS.find(i => i.id === openId)

  // ── Thread view ──
  if (open) {
    const msgs = threads[open.id] ?? []
    return (
      <div className="flex flex-col max-w-lg mx-auto w-full" style={{ height: 'calc(100dvh - 72px)' }}>
        {/* header */}
        <div className="flex items-center gap-3 px-4 pt-8 pb-3 border-b border-border">
          <button onClick={() => setOpenId(null)} aria-label="Back to messages" className="p-1 -ml-1 text-stone hover:text-ink transition-colors">
            <IconChevronLeft size={20} stroke={2} />
          </button>
          <Avatar color={open.avatarColor} name={open.name} size={36} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-ink leading-tight truncate">{open.name}</p>
            <p className="text-xs text-stone truncate">{open.studio}</p>
          </div>
          <button
            onClick={() => setPinned(togglePin(open.id))}
            aria-label={pinned.includes(open.id) ? 'Unpin conversation' : 'Pin conversation'}
            title={pinned.includes(open.id) ? 'Unpin' : 'Pin to top'}
            className="shrink-0 p-2 transition-colors"
            style={{ color: pinned.includes(open.id) ? '#0D0D0F' : '#8A8A8A' }}
          >
            {pinned.includes(open.id) ? <IconPinFilled size={18} /> : <IconPin size={18} stroke={1.8} />}
          </button>
        </div>

        {/* messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-2.5">
          {msgs.map((m, i) => (
            <MessageBubble key={i} message={m} />
          ))}
          <div ref={bottomRef} />
        </div>

        {/* composer */}
        <div className="px-4 pb-4 pt-2 flex items-center gap-2 border-t border-border">
          <input
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') send() }}
            placeholder={`Message ${open.name.split(' ')[0]}…`}
            className="flex-1 min-w-0 text-sm rounded-full px-4 py-2.5 bg-surface border border-border text-ink placeholder:text-stone/60 outline-none focus:border-powder transition-colors"
          />
          <button
            onClick={send}
            disabled={!draft.trim()}
            aria-label="Send"
            className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-30 transition-opacity"
            style={{ backgroundColor: '#0D0D0F', color: '#AEC8F5' }}
          >
            <IconSend size={16} stroke={2} />
          </button>
        </div>
      </div>
    )
  }

  // ── Conversation list ──
  const pinnedInstructors = pinned
    .map(id => INSTRUCTORS.find(i => i.id === id))
    .filter((i): i is NonNullable<typeof i> => !!i)
  const ordered = byEngagement(threads).filter(i => !pinned.includes(i.id))
  return (
    <div className="px-5 pt-12 pb-10 flex flex-col gap-6 max-w-lg mx-auto w-full">
      <div className="flex items-center justify-between">
        <h1 className="font-extrabold text-ink" style={{ fontSize: '34px', lineHeight: 1, fontVariationSettings: "'opsz' 96" }}>
          Messages
        </h1>
        <Link href="/community" className="text-xs font-medium text-stone hover:text-ink transition-colors">
          ← Community
        </Link>
      </div>

      {/* Pinned — iMessage-style big avatars */}
      {pinnedInstructors.length > 0 && (
        <div className="flex items-start gap-5 px-1">
          {pinnedInstructors.map(inst => {
            const unread = threadUnread(inst.id, threads)
            return (
              <button
                key={inst.id}
                onClick={() => setOpenId(inst.id)}
                className="flex flex-col items-center gap-1.5 active:opacity-80 transition-opacity"
              >
                <span className="relative">
                  <Avatar color={inst.avatarColor} name={inst.name} size={64} />
                  {unread > 0 && (
                    <span
                      className="absolute flex items-center justify-center rounded-full font-extrabold"
                      style={{
                        top: '-2px',
                        right: '-4px',
                        minWidth: '18px',
                        height: '18px',
                        padding: '0 5px',
                        fontSize: '10px',
                        backgroundColor: '#AEC8F5',
                        color: '#0D0D0F',
                        border: '2px solid #FFFFFF',
                      }}
                    >
                      {unread}
                    </span>
                  )}
                </span>
                <span className="text-[11px] font-semibold text-ink leading-none">
                  {inst.name.split(' ')[0]}
                </span>
              </button>
            )
          })}
        </div>
      )}

      <div className="flex flex-col gap-2">
        {ordered.map(inst => {
          const msgs = threads[inst.id] ?? []
          const last = msgs[msgs.length - 1]
          const unread = threadUnread(inst.id, threads)
          return (
            <button
              key={inst.id}
              onClick={() => setOpenId(inst.id)}
              className="bg-white rounded-2xl px-4 py-3.5 flex items-center gap-3.5 shadow-card text-left active:opacity-80 transition-opacity"
            >
              <Avatar color={inst.avatarColor} name={inst.name} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-ink truncate">{inst.name}</p>
                <p className="text-xs text-stone truncate mt-0.5">
                  {last
                    ? last.routine
                      ? `${last.from === 'me' ? 'You shared' : 'Shared'} a routine${last.playlist ? ' + playlist' : ''} — ${last.routine.name}`
                      : last.playlist
                        ? `${last.from === 'me' ? 'You shared' : 'Shared'} a playlist — ${last.playlist.name}`
                        : `${last.from === 'me' ? 'You: ' : ''}${last.text}`
                    : inst.studio}
                </p>
              </div>
              <span className="shrink-0 flex flex-col items-end gap-1">
                {last && <span className="text-[10px] text-stone">{timeAgo(last.ts)}</span>}
                {unread > 0 && (
                  <span
                    className="flex items-center justify-center rounded-full font-extrabold"
                    style={{
                      minWidth: '18px',
                      height: '18px',
                      padding: '0 5px',
                      fontSize: '10px',
                      backgroundColor: '#AEC8F5',
                      color: '#0D0D0F',
                    }}
                  >
                    {unread}
                  </span>
                )}
              </span>
            </button>
          )
        })}
      </div>

      <p className="text-xs text-stone text-center">
        Preview — sample instructors. Real DMs arrive with multi-user Q.
      </p>
    </div>
  )
}

function MessageBubble({ message }: { message: Message }) {
  const mine = message.from === 'me'

  // Playlist-only share — powder card, links to Spotify (or the routine as fallback)
  if (message.playlist && !message.routine) {
    const p = message.playlist
    const href = p.spotifyUrl ?? `/build/result/${p.routineId}`
    const external = !!p.spotifyUrl
    return (
      <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
        <a
          href={href}
          {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          className="rounded-2xl p-4 max-w-[260px] relative overflow-hidden block"
          style={{ backgroundColor: '#AEC8F5' }}
        >
          <span
            aria-hidden
            className="absolute font-extrabold pointer-events-none select-none"
            style={{ right: '-18px', top: '-20px', fontSize: '90px', lineHeight: 1, color: '#0D0D0F', opacity: 0.12, fontVariationSettings: "'opsz' 96" }}
          >
            Q
          </span>
          <p className="text-[9px] font-bold tracking-[2.5px] uppercase relative" style={{ color: '#0D0D0F' }}>
            ♪ Playlist
          </p>
          <p className="font-extrabold text-base leading-tight mt-1 relative" style={{ color: '#0D0D0F', fontVariationSettings: "'opsz' 96" }}>
            {p.name}
          </p>
          <p className="text-xs mt-1 relative" style={{ color: 'rgba(13,13,15,0.6)' }}>
            {p.trackCount} tracks · {p.artists}
          </p>
        </a>
      </div>
    )
  }

  // Shared routine — a mini POWDER share card
  if (message.routine) {
    return (
      <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
        <Link
          href={`/build/result/${message.routine.routineId}`}
          className="rounded-2xl p-4 max-w-[260px] relative overflow-hidden block"
          style={{ backgroundColor: '#0D0D0F' }}
        >
          <span
            aria-hidden
            className="absolute font-extrabold pointer-events-none select-none"
            style={{ right: '-18px', top: '-20px', fontSize: '90px', lineHeight: 1, color: '#AEC8F5', opacity: 0.2, fontVariationSettings: "'opsz' 96" }}
          >
            Q
          </span>
          <p className="text-[9px] font-bold tracking-[2.5px] uppercase relative" style={{ color: '#AEC8F5' }}>
            {message.playlist ? 'Routine + playlist' : 'Routine'}
          </p>
          <p className="text-white font-extrabold text-base leading-tight mt-1 relative" style={{ fontVariationSettings: "'opsz' 96" }}>
            {message.routine.name}
          </p>
          <p className="text-xs mt-1 relative" style={{ color: 'rgba(255,255,255,0.55)' }}>
            {message.routine.focus} · {message.routine.minutes} min
          </p>
          {message.playlist && (
            <p className="text-xs mt-1.5 relative font-semibold" style={{ color: '#AEC8F5' }}>
              ♪ {message.playlist.trackCount} tracks · {message.playlist.artists}
            </p>
          )}
        </Link>
      </div>
    )
  }

  return (
    <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
      <p
        className="text-sm leading-relaxed rounded-2xl px-3.5 py-2.5 max-w-[280px]"
        style={
          mine
            ? { backgroundColor: '#0D0D0F', color: '#FFFFFF' }
            : { backgroundColor: '#AEC8F5', color: '#0D0D0F' }
        }
      >
        {message.text}
      </p>
    </div>
  )
}
