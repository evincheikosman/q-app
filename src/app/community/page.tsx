'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { IconMessageCircle, IconSend, IconUserPlus } from '@tabler/icons-react'
import { ScribbleArrow, PenNote, PEN } from '@/components/Scribble'
import BrandPhoto from '@/components/BrandPhoto'
import AddFriendSheet from '@/components/AddFriendSheet'
import { loadProfile } from '@/lib/profile'
import { isSocialConfigured } from '@/lib/supabaseClient'
import { ensureAccount, loadFriends, type Friend, type MyAccount } from '@/lib/social'

// ─── Sample feed (fictional instructors — the multi-studio vision) ────────────

interface FeedEntry {
  id: string
  name: string
  studio: string
  milestone: string
  big: boolean
  timestamp: string
  avatarColor: string
  seedHearts: number
  seedCheers: number
}

const FEED: FeedEntry[] = [
  {
    id: 'mara-300',
    name: 'Mara Velden',
    studio: 'Core40 Amsterdam',
    milestone: 'just hit 300 classes taught',
    big: true,
    timestamp: '2 days ago',
    avatarColor: '#0D0D0F',
    seedHearts: 12,
    seedCheers: 8,
  },
  {
    id: 'jonah-first',
    name: 'Jonah Reyes',
    studio: 'Core40 Los Angeles',
    milestone: 'taught their first class',
    big: true,
    timestamp: '4 days ago',
    avatarColor: '#AEC8F5',
    seedHearts: 21,
    seedCheers: 15,
  },
  {
    id: 'suki-fav',
    name: 'Suki Tanaka',
    studio: 'Core40 San Francisco',
    milestone: 'routine favorited 10 times by other instructors',
    big: false,
    timestamp: '5 days ago',
    avatarColor: '#8A8A8A',
    seedHearts: 7,
    seedCheers: 3,
  },
  {
    id: 'lena-cohort',
    name: 'Lena Drost',
    studio: 'Core40 Amsterdam',
    milestone: 'started a new instructor cohort',
    big: false,
    timestamp: '1 week ago',
    avatarColor: '#101012',
    seedHearts: 9,
    seedCheers: 6,
  },
  {
    id: 'caleb-streak',
    name: 'Caleb Monroe',
    studio: 'Core40 Los Angeles',
    milestone: 'hit a 50-class streak',
    big: true,
    timestamp: '1 week ago',
    avatarColor: '#0D0D0F',
    seedHearts: 14,
    seedCheers: 11,
  },
]

// ─── Local persistence ────────────────────────────────────────────────────────

interface UserPost {
  id: string
  text: string
  createdAt: number
}
interface Comment {
  text: string
  createdAt: number
}
type Reactions = Record<string, { heart?: boolean; cheer?: boolean }>
type Comments = Record<string, Comment[]>

const DEFAULT_ME = { name: 'You', studio: 'Instructor' }

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('')
}

function timeAgo(ts: number) {
  const mins = Math.floor((Date.now() - ts) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

export default function CommunityPage() {
  const [posts, setPosts] = useState<UserPost[]>([])
  const [reactions, setReactions] = useState<Reactions>({})
  const [comments, setComments] = useState<Comments>({})
  const [draft, setDraft] = useState('')
  const [composing, setComposing] = useState(false)
  const [commentOpenFor, setCommentOpenFor] = useState<string | null>(null)
  const [commentDraft, setCommentDraft] = useState('')
  const [ME, setME] = useState(DEFAULT_ME)
  const [myAccount, setMyAccount] = useState<MyAccount | null>(null)
  const [friends, setFriends] = useState<Friend[]>([])
  const [addingFriend, setAddingFriend] = useState(false)
  const [justConnected, setJustConnected] = useState<Friend | null>(null)
  const socialConfigured = isSocialConfigured()

  useEffect(() => {
    setPosts(load('q_community_posts', [] as UserPost[]))
    setReactions(load('q_community_reactions', {} as Reactions))
    setComments(load('q_community_comments', {} as Comments))
    const profile = loadProfile()
    if (profile?.name) setME({ name: profile.name, studio: profile.studio || 'Instructor' })

    if (socialConfigured) {
      ensureAccount(profile).then(account => {
        setMyAccount(account)
        if (account) loadFriends().then(setFriends)
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function refreshFriends() {
    loadFriends().then(next => {
      const added = next.find(f => !friends.some(existing => existing.id === f.id))
      setFriends(next)
      if (added) {
        setJustConnected(added)
        setTimeout(() => setJustConnected(null), 6000)
      }
    })
  }

  function persistPosts(next: UserPost[]) {
    setPosts(next)
    localStorage.setItem('q_community_posts', JSON.stringify(next))
  }
  function persistReactions(next: Reactions) {
    setReactions(next)
    localStorage.setItem('q_community_reactions', JSON.stringify(next))
  }
  function persistComments(next: Comments) {
    setComments(next)
    localStorage.setItem('q_community_comments', JSON.stringify(next))
  }

  function addPost() {
    const text = draft.trim()
    if (!text) return
    persistPosts([{ id: `me-${Date.now()}`, text, createdAt: Date.now() }, ...posts])
    setDraft('')
    setComposing(false)
  }

  function toggleReaction(postId: string, kind: 'heart' | 'cheer') {
    const mine = reactions[postId] ?? {}
    persistReactions({ ...reactions, [postId]: { ...mine, [kind]: !mine[kind] } })
  }

  function addComment(postId: string) {
    const text = commentDraft.trim()
    if (!text) return
    const list = comments[postId] ?? []
    persistComments({ ...comments, [postId]: [...list, { text, createdAt: Date.now() }] })
    setCommentDraft('')
  }

  function PostCard({
    id,
    name,
    studio,
    body,
    timestamp,
    avatarColor,
    seedHearts = 0,
    seedCheers = 0,
    isMine = false,
  }: {
    id: string
    name: string
    studio: string
    body: string
    timestamp: string
    avatarColor: string
    seedHearts?: number
    seedCheers?: number
    isMine?: boolean
  }) {
    const mine = reactions[id] ?? {}
    const hearts = seedHearts + (mine.heart ? 1 : 0)
    const cheers = seedCheers + (mine.cheer ? 1 : 0)
    const postComments = comments[id] ?? []
    const commentsOpen = commentOpenFor === id

    return (
      <div className="bg-white rounded-2xl px-5 py-4 flex flex-col gap-3 shadow-card relative">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 mt-0.5"
            style={{ backgroundColor: avatarColor }}
          >
            <span
              className="text-xs font-bold"
              style={{ color: avatarColor === '#AEC8F5' ? '#0D0D0F' : '#FFFFFF' }}
            >
              {initials(name)}
            </span>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-ink leading-snug flex items-center gap-1.5">
              {name}
              {isMine && (
                <span
                  className="text-[9px] font-bold uppercase tracking-wide rounded-full px-1.5 py-0.5"
                  style={{ backgroundColor: '#AEC8F5', color: '#0D0D0F' }}
                >
                  me
                </span>
              )}
            </p>
            <p className="text-sm text-ink leading-snug mt-0.5">{body}</p>
            <p className="text-xs text-stone mt-1.5">
              {studio} · {timestamp}
            </p>
          </div>
        </div>

        {/* Reactions */}
        <div className="flex items-center gap-2 pl-14">
          <button
            onClick={() => toggleReaction(id, 'heart')}
            aria-pressed={!!mine.heart}
            className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold border transition-all active:scale-95"
            style={{
              backgroundColor: mine.heart ? '#AEC8F5' : 'transparent',
              borderColor: mine.heart ? '#AEC8F5' : '#E8E8E6',
              color: mine.heart ? '#0D0D0F' : '#8A8A8A',
            }}
          >
            <span aria-hidden>🩵</span>
            {hearts}
          </button>
          <button
            onClick={() => toggleReaction(id, 'cheer')}
            aria-pressed={!!mine.cheer}
            className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold border transition-all active:scale-95"
            style={{
              backgroundColor: mine.cheer ? '#AEC8F5' : 'transparent',
              borderColor: mine.cheer ? '#AEC8F5' : '#E8E8E6',
              color: mine.cheer ? '#0D0D0F' : '#8A8A8A',
            }}
          >
            <span aria-hidden>🎉</span>
            {cheers}
          </button>
          <button
            onClick={() => {
              setCommentOpenFor(commentsOpen ? null : id)
              setCommentDraft('')
            }}
            aria-label="Comments"
            className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold border border-border text-stone hover:text-ink transition-colors"
          >
            <IconMessageCircle size={13} stroke={2} />
            {postComments.length > 0 ? postComments.length : ''}
          </button>
        </div>

        {/* Comments */}
        {(commentsOpen || postComments.length > 0) && (
          <div className="pl-14 flex flex-col gap-2">
            {postComments.map((c, i) => (
              <div key={i} className="flex items-start gap-2">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                  style={{ backgroundColor: '#0D0D0F' }}
                >
                  <span className="text-[8px] font-bold" style={{ color: '#AEC8F5' }}>
                    {initials(ME.name)}
                  </span>
                </div>
                <div className="flex-1 min-w-0 bg-surface rounded-xl px-3 py-2 border border-border">
                  <p className="text-xs text-ink leading-snug">{c.text}</p>
                  <p className="text-[10px] text-stone mt-0.5">{timeAgo(c.createdAt)}</p>
                </div>
              </div>
            ))}
            {commentsOpen && (
              <div className="flex items-center gap-1.5">
                <input
                  value={commentDraft}
                  onChange={e => setCommentDraft(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') addComment(id)
                  }}
                  placeholder="Say something nice…"
                  autoFocus
                  className="flex-1 min-w-0 text-xs rounded-full px-3 py-2 bg-surface border border-border text-ink placeholder:text-stone/60 outline-none focus:border-powder transition-colors"
                />
                <button
                  onClick={() => addComment(id)}
                  disabled={!commentDraft.trim()}
                  aria-label="Post comment"
                  className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center disabled:opacity-30 transition-opacity"
                  style={{ backgroundColor: '#0D0D0F', color: '#AEC8F5' }}
                >
                  <IconSend size={13} stroke={2} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="px-5 pt-12 pb-10 flex flex-col gap-6 max-w-lg mx-auto w-full relative">

      {/* Header — with a margin note, like the pen got excited */}
      <div className="flex flex-col gap-3">
        <div className="flex items-end gap-3">
          <h1
            className="font-extrabold text-ink"
            style={{ fontSize: '34px', lineHeight: 1, fontVariationSettings: "'opsz' 96" }}
          >
            Community
          </h1>
          <span className="flex items-center gap-0.5 -mb-1">
            <ScribbleArrow color={PEN.violet} width={30} style={{ transform: 'scaleX(-1) rotate(-70deg)' }} />
            <PenNote size={15} rotate="-5deg" style={{ marginBottom: '10px' }}>
              my people!
            </PenNote>
          </span>
        </div>
        {ME.name !== DEFAULT_ME.name && (
          <p className="text-sm text-stone">
            Welcome to {ME.studio && ME.studio !== DEFAULT_ME.studio ? ME.studio : 'the community'}, {ME.name.split(' ')[0]}.
          </p>
        )}
      </div>

      {/* ── Your friends — real people, real connections (only once a backend is configured) ── */}
      {socialConfigured && (
        <section className="flex flex-col gap-3">
          {justConnected && (
            <div
              className="rounded-2xl px-4 py-3.5 flex items-center gap-3"
              style={{ backgroundColor: '#0D0D0F' }}
            >
              {justConnected.photoDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={justConnected.photoDataUrl} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
              ) : (
                <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: '#AEC8F5' }}>
                  <span className="text-xs font-bold" style={{ color: '#0D0D0F' }}>{initials(justConnected.name)}</span>
                </div>
              )}
              <p className="text-sm font-semibold text-white">
                Welcome, {justConnected.name.split(' ')[0]}, to {justConnected.studio || ME.studio || 'the community'}! 🎉
              </p>
            </div>
          )}
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold tracking-widest uppercase text-stone">Your friends</h2>
            <button
              onClick={() => setAddingFriend(true)}
              className="flex items-center gap-1.5 text-xs font-bold text-stone hover:text-ink transition-colors rounded-full px-3 py-1.5 border border-border"
            >
              <IconUserPlus size={13} stroke={2} />
              Add
            </button>
          </div>

          {friends.length === 0 ? (
            <div className="bg-white border border-border rounded-2xl px-5 py-6 flex flex-col items-center text-center gap-1 shadow-card">
              <p className="text-sm font-bold text-ink">No friends connected yet.</p>
              <p className="text-xs text-stone max-w-[240px]">
                Add someone with their invite code and they&apos;ll show up here — say hi, share a routine, or send a playlist.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {friends.map(f => (
                <Link
                  key={f.id}
                  href={`/messages?to=${f.id}`}
                  className="bg-white rounded-2xl px-4 py-3.5 flex items-center gap-3.5 shadow-card active:opacity-80 transition-opacity"
                >
                  {f.photoDataUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={f.photoDataUrl} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: '#0D0D0F' }}>
                      <span className="text-xs font-bold" style={{ color: '#AEC8F5' }}>{initials(f.name)}</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-ink truncate">{f.name}</p>
                    <p className="text-xs text-stone truncate mt-0.5">{f.studio || 'Instructor'}</p>
                  </div>
                  <span className="shrink-0 text-xs font-semibold text-stone">Say hi →</span>
                </Link>
              ))}
            </div>
          )}
        </section>
      )}

      {addingFriend && (
        <AddFriendSheet
          myAccount={myAccount}
          onClose={() => setAddingFriend(false)}
          onConnected={refreshFriends}
        />
      )}

      {/* Studio photo banner */}
      <BrandPhoto
        src="/photos/space-bw.jpg"
        alt="Sunlit reformer studio"
        height={150}
        position="50% 55%"
        caption="One method, many rooms"
      />

      {/* Share good news — the composer */}
      {composing ? (
        <div className="bg-white rounded-2xl px-5 py-4 flex flex-col gap-3 shadow-card border border-border">
          <div className="flex items-start gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
              style={{ backgroundColor: '#0D0D0F' }}
            >
              <span className="text-xs font-bold" style={{ color: '#AEC8F5' }}>
                {initials(ME.name)}
              </span>
            </div>
            <textarea
              value={draft}
              onChange={e => setDraft(e.target.value)}
              placeholder="Share some good news — a milestone, a win, a full class…"
              rows={3}
              autoFocus
              maxLength={280}
              className="flex-1 min-w-0 text-sm rounded-xl px-3 py-2.5 bg-surface border border-border text-ink placeholder:text-stone/60 outline-none resize-none focus:border-powder transition-colors leading-relaxed"
            />
          </div>
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => { setComposing(false); setDraft('') }}
              className="text-xs font-semibold text-stone hover:text-ink px-3 py-2 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={addPost}
              disabled={!draft.trim()}
              className="text-xs font-bold rounded-full px-4 py-2 disabled:opacity-30 transition-opacity"
              style={{ backgroundColor: '#0D0D0F', color: '#AEC8F5' }}
            >
              Post it
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setComposing(true)}
          className="bg-white rounded-2xl px-5 py-3.5 flex items-center gap-3 shadow-card border border-border text-left"
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: '#0D0D0F' }}
          >
            <span className="text-[10px] font-bold" style={{ color: '#AEC8F5' }}>
              {initials(ME.name)}
            </span>
          </div>
          <span className="text-sm text-stone">Share some good news…</span>
        </button>
      )}

      <span
        className="self-start text-xs font-semibold rounded-full px-3 py-1.5 leading-none"
        style={{ backgroundColor: '#0D0D0F', color: '#AEC8F5' }}
      >
        Preview — what Community looks like with other instructors
      </span>

      {/* Feed — my posts first, then the sample instructors */}
      <div className="flex flex-col gap-3">
        {posts.map(p => (
          <PostCard
            key={p.id}
            id={p.id}
            name={ME.name}
            studio={ME.studio}
            body={p.text}
            timestamp={timeAgo(p.createdAt)}
            avatarColor="#0D0D0F"
            isMine
          />
        ))}
        {FEED.map(entry => (
          <PostCard
            key={entry.id}
            id={entry.id}
            name={entry.name}
            studio={entry.studio}
            body={`${entry.milestone}.`}
            timestamp={entry.timestamp}
            avatarColor={entry.avatarColor}
            seedHearts={entry.seedHearts}
            seedCheers={entry.seedCheers}
          />
        ))}
      </div>

    </div>
  )
}
