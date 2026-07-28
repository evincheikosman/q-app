/**
 * Supabase browser client — the one piece of shared backend Q has. Everything
 * else in the app is localStorage-only by design; this is scoped tightly to
 * the multi-user pieces that genuinely require a shared source of truth:
 * real accounts, friend connections, and real-time DMs between real people.
 *
 * Guarded: if NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY aren't
 * set, `getSupabase()` returns null and every caller in src/lib/social.ts
 * no-ops instead of throwing — so the rest of the app keeps working exactly
 * as before on a device that hasn't been configured with a backend yet.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let client: SupabaseClient | null | undefined

export function getSupabase(): SupabaseClient | null {
  if (client !== undefined) return client

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    client = null
    return client
  }

  client = createClient(url, key, {
    auth: { persistSession: true, autoRefreshToken: true },
  })
  return client
}

export function isSocialConfigured(): boolean {
  return !!getSupabase()
}
