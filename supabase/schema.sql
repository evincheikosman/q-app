-- Q — multi-user schema (profiles, friend connections, direct messages)
-- Run this once in your Supabase project's SQL editor: Project → SQL Editor → New query → paste → Run.
--
-- Design notes:
--   * Auth is anonymous (Supabase "anonymous sign-ins") — no email/password
--     required to test with friends. Enable it in: Authentication → Providers
--     → Anonymous Sign-Ins → toggle on. Each device gets its own auth.users
--     row automatically the first time it opens Q.
--   * profiles.invite_code is how two people connect — short, shareable,
--     case-insensitive. Whoever enters someone else's code creates a
--     connections row; friends() reads it in both directions.
--   * Row Level Security is on for everything — a device can only read/write
--     its own profile, read profiles of people it's connected to, and
--     read/write messages where it's the sender or recipient.

create extension if not exists pgcrypto;

-- ─── tables (created first, so policies below can reference each other) ───

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default 'Instructor',
  studio text,
  photo_data_url text,
  invite_code text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists connections (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references profiles(id) on delete cascade,
  user_b uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint no_self_connection check (user_a <> user_b),
  constraint unique_pair unique (user_a, user_b)
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references profiles(id) on delete cascade,
  recipient_id uuid not null references profiles(id) on delete cascade,
  text text,
  routine_share jsonb,
  playlist_share jsonb,
  created_at timestamptz not null default now()
);

-- ─── row level security ────────────────────────────────────────────────────

alter table profiles enable row level security;
alter table connections enable row level security;
alter table messages enable row level security;

create policy "read own profile" on profiles
  for select using (auth.uid() = id);

create policy "read connected profiles" on profiles
  for select using (
    exists (
      select 1 from connections
      where (user_a = auth.uid() and user_b = profiles.id)
         or (user_b = auth.uid() and user_a = profiles.id)
    )
  );

create policy "insert own profile" on profiles
  for insert with check (auth.uid() = id);

create policy "update own profile" on profiles
  for update using (auth.uid() = id);

create policy "read my connections" on connections
  for select using (auth.uid() = user_a or auth.uid() = user_b);

create policy "create connection as either side" on connections
  for insert with check (auth.uid() = user_a or auth.uid() = user_b);

create policy "read my messages" on messages
  for select using (auth.uid() = sender_id or auth.uid() = recipient_id);

create policy "send messages as myself" on messages
  for insert with check (auth.uid() = sender_id);

-- Realtime: let clients subscribe to new rows in messages
alter publication supabase_realtime add table messages;

-- ─── invite code generator ─────────────────────────────────────────────────
-- 6 uppercase alphanumeric characters, checked for uniqueness client-side
-- before insert (see src/lib/social.ts) — this function just makes a
-- reasonably-random candidate.

create or replace function generate_invite_code() returns text as $$
declare
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- no O/0/I/1 ambiguity
  result text := '';
  i int;
begin
  for i in 1..6 loop
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  end loop;
  return result;
end;
$$ language plpgsql;

-- ─── invite code lookup (bypasses RLS on purpose) ──────────────────────────
-- "read connected profiles" only allows seeing profiles you're ALREADY
-- connected to — which makes finding someone by their code impossible,
-- since you're not connected yet. This SECURITY DEFINER function returns
-- just the matching id for an exact code, without opening up general
-- browsing of the profiles table.

create or replace function find_profile_by_invite_code(code text)
returns uuid
language sql
security definer
set search_path = public
as $$
  select id from profiles where invite_code = upper(code) limit 1;
$$;

grant execute on function find_profile_by_invite_code(text) to authenticated;
