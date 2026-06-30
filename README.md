# Q — Your class, on cue.

An AI-powered routine and playlist builder for Lagree fitness instructors.

---

## Why I built this

I'm a Lagree instructor, and before every class I was doing the same tedious work: manually sequencing 40 minutes of exercises — spring loads, platform facing, timing, cues — and separately building a playlist that actually matched the energy arc. It happens before you even walk in the door, and it adds up. Q automates both so I can spend that time on the parts of teaching that actually require a human.

The core intelligence — routine generation and playlist mapping — is powered by the Anthropic Claude API.

---

## What it does

**Routine builder** — Describe your class (focus areas, energy arc, difficulty, vibe) and Q generates a complete 40-minute Lagree routine: ordered exercises, spring loads, platform facing, timing, instructor cues, a class opener, and a TLDR summary.

**Playlist builder** — Enter an artist anchor and Q builds a Spotify playlist mapped to the energy arc of your routine — opener through core closer.

**Library** — All saved routines in one place, each with its linked Spotify playlist accessible in one tap.

**Your Cue** — Insights from your teaching history: top artists, music patterns, class composition trends.

---

## Tech stack

- **Next.js 14** (App Router) + TypeScript
- **Tailwind CSS**
- **Anthropic Claude API** — routine and playlist generation
- **Spotify Web API** + NextAuth.js — OAuth, playlist creation
- **localStorage** — routine persistence (no database required for MVP)

---

## Getting started

### Prerequisites

- Node.js v18+
- A Spotify Developer app ([developer.spotify.com](https://developer.spotify.com))
- An Anthropic API key ([console.anthropic.com](https://console.anthropic.com))

### Setup

```bash
git clone https://github.com/evincheikosman/q-app.git
cd q-app
npm install
```

Create a `.env.local` file in the root:

```
ANTHROPIC_API_KEY=your_key_here
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
NEXTAUTH_URL=http://localhost:3001
NEXTAUTH_SECRET=your_nextauth_secret
```

In your Spotify Developer dashboard, add `http://localhost:3001/api/auth/callback/spotify` as a Redirect URI.

```bash
npm run dev -- --port 3001
```

Open [http://localhost:3001](http://localhost:3001) and sign in with Spotify.

---

## Project structure

```
src/app/
  home/          # Dashboard — next class, recent routines
  build/         # 4-step routine builder flow
    result/      # Generated routine, playlist generation, save
  library/       # Saved routines browser
  your-cue/      # Instructor insights and music analytics
  api/
    auth/        # Spotify OAuth via NextAuth
    generate-routine/   # Claude routine generation
    generate-playlist/  # Claude + Spotify playlist builder
    save-playlist/      # Creates playlist in Spotify account
```

---

## Status

V1 core flow complete — routine generation and Spotify playlist building are both working end-to-end. Analytics (Your Cue) and account pages are still in progress. Deploying to Vercel once complete.

---

*Built by Evîn Cheikosman*
