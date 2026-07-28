/**
 * Real multi-user pieces — accounts, friend connections, and DMs — backed by
 * Supabase (see src/lib/supabaseClient.ts and supabase/schema.sql).
 *
 * Everything here is a no-op returning null/empty when Supabase isn't
 * configured (getSupabase() returns null), so the app degrades cleanly on a
 * device that hasn't been set up with a backend yet — same pattern as the
 * rest of Q's optional integrations (Spotify, Anthropic).
 *
 * Identity: anonymous Supabase auth. No email/password — the first time Q
 * opens on a device it signs in anonymously (a real auth.users row, no
 * signup friction) and creates a matching profiles row. Two people become
 * "friends" by one of them typing the other's invite_code.
 */

import { getSupabase } from '@/lib/supabaseClient'
import type { Profile } from '@/lib/profile'

export interface Friend {
  id: string
  name: string
  studio: string | null
  photoDataUrl: string | null
}

export interface MyAccount extends Friend {
  inviteCode: string
}

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function randomCode(): string {
  let out = ''
  for (let i = 0; i < 6; i++) out += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]
  return out
}

/** Ensures an anonymous session + profiles row exist, synced from local Profile. Returns null if unconfigured or on error. */
export async function ensureAccount(local: Profile | null): Promise<MyAccount | null> {
  const supabase = getSupabase()
  if (!supabase) return null

  let { data: sessionData } = await supabase.auth.getSession()
  let userId = sessionData.session?.user?.id

  if (!userId) {
    const { data, error } = await supabase.auth.signInAnonymously()
    if (error || !data.user) return null
    userId = data.user.id
  }

  const { data: existing } = await supabase
    .from('profiles')
    .select('id, name, studio, photo_data_url, invite_code')
    .eq('id', userId)
    .maybeSingle()

  const name = local?.name?.trim() || existing?.name || 'Instructor'
  const studio = local?.studio?.trim() || existing?.studio || null
  const photoDataUrl = local?.photoDataUrl ?? existing?.photo_data_url ?? null

  if (!existing) {
    // New account — mint a unique invite code, retrying on collision
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = randomCode()
      const { error } = await supabase
        .from('profiles')
        .insert({ id: userId, name, studio, photo_data_url: photoDataUrl, invite_code: code })
      if (!error) return { id: userId, name, studio, photoDataUrl, inviteCode: code }
      // unique_violation on invite_code — try again with a new code
      if (error.code !== '23505') return null
    }
    return null
  }

  // Keep the profile row in sync with whatever's saved locally
  if (existing.name !== name || existing.studio !== studio || existing.photo_data_url !== photoDataUrl) {
    await supabase
      .from('profiles')
      .update({ name, studio, photo_data_url: photoDataUrl, updated_at: new Date().toISOString() })
      .eq('id', userId)
  }

  return { id: userId, name, studio, photoDataUrl, inviteCode: existing.invite_code }
}

export type AddFriendResult = 'connected' | 'already-friends' | 'not-found' | 'self' | 'unavailable'

export async function addFriendByCode(code: string): Promise<AddFriendResult> {
  const supabase = getSupabase()
  if (!supabase) return 'unavailable'

  const { data: sessionData } = await supabase.auth.getSession()
  const myId = sessionData.session?.user?.id
  if (!myId) return 'unavailable'

  const { data: theirs } = await supabase
    .from('profiles')
    .select('id')
    .eq('invite_code', code.trim().toUpperCase())
    .maybeSingle()

  if (!theirs) return 'not-found'
  if (theirs.id === myId) return 'self'

  // Canonical ordering so (a,b) and (b,a) never both exist
  const [user_a, user_b] = [myId, theirs.id].sort()
  const { error } = await supabase.from('connections').insert({ user_a, user_b })
  if (error) return error.code === '23505' ? 'already-friends' : 'unavailable'
  return 'connected'
}

export async function loadFriends(): Promise<Friend[]> {
  const supabase = getSupabase()
  if (!supabase) return []

  const { data: sessionData } = await supabase.auth.getSession()
  const myId = sessionData.session?.user?.id
  if (!myId) return []

  const { data: connections } = await supabase
    .from('connections')
    .select('user_a, user_b')
    .or(`user_a.eq.${myId},user_b.eq.${myId}`)

  const friendIds = (connections ?? []).map(c => (c.user_a === myId ? c.user_b : c.user_a))
  if (friendIds.length === 0) return []

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, name, studio, photo_data_url')
    .in('id', friendIds)

  return (profiles ?? []).map(p => ({
    id: p.id,
    name: p.name,
    studio: p.studio,
    photoDataUrl: p.photo_data_url,
  }))
}

export interface SocialMessage {
  id: string
  senderId: string
  recipientId: string
  text: string | null
  routineShare: unknown
  playlistShare: unknown
  createdAt: string
}

export async function loadThread(friendId: string): Promise<SocialMessage[]> {
  const supabase = getSupabase()
  if (!supabase) return []
  const { data: sessionData } = await supabase.auth.getSession()
  const myId = sessionData.session?.user?.id
  if (!myId) return []

  const { data } = await supabase
    .from('messages')
    .select('id, sender_id, recipient_id, text, routine_share, playlist_share, created_at')
    .or(
      `and(sender_id.eq.${myId},recipient_id.eq.${friendId}),and(sender_id.eq.${friendId},recipient_id.eq.${myId})`
    )
    .order('created_at', { ascending: true })

  return (data ?? []).map(m => ({
    id: m.id,
    senderId: m.sender_id,
    recipientId: m.recipient_id,
    text: m.text,
    routineShare: m.routine_share,
    playlistShare: m.playlist_share,
    createdAt: m.created_at,
  }))
}

export async function sendDirectMessage(
  friendId: string,
  payload: { text?: string; routineShare?: unknown; playlistShare?: unknown }
): Promise<boolean> {
  const supabase = getSupabase()
  if (!supabase) return false
  const { data: sessionData } = await supabase.auth.getSession()
  const myId = sessionData.session?.user?.id
  if (!myId) return false

  const { error } = await supabase.from('messages').insert({
    sender_id: myId,
    recipient_id: friendId,
    text: payload.text ?? null,
    routine_share: payload.routineShare ?? null,
    playlist_share: payload.playlistShare ?? null,
  })
  return !error
}

/** Live subscription to new messages involving me. Returns an unsubscribe fn. */
export function subscribeToMessages(onInsert: (m: SocialMessage) => void): () => void {
  const supabase = getSupabase()
  if (!supabase) return () => {}

  const channel = supabase
    .channel('messages-inserts')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages' },
      payload => {
        const m = payload.new as {
          id: string
          sender_id: string
          recipient_id: string
          text: string | null
          routine_share: unknown
          playlist_share: unknown
          created_at: string
        }
        onInsert({
          id: m.id,
          senderId: m.sender_id,
          recipientId: m.recipient_id,
          text: m.text,
          routineShare: m.routine_share,
          playlistShare: m.playlist_share,
          createdAt: m.created_at,
        })
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}

export async function getMyId(): Promise<string | null> {
  const supabase = getSupabase()
  if (!supabase) return null
  const { data } = await supabase.auth.getSession()
  return data.session?.user?.id ?? null
}
