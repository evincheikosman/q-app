import Anthropic from '@anthropic-ai/sdk'
import { getServerSession } from "next-auth"
import { authOptions } from "../auth/[...nextauth]/route"

const client = new Anthropic()

interface Block {
  name: string
  moves?: Array<{ name: string }>
}

interface SongSuggestion {
  block: string
  songTitle: string
  artist: string
  rationale: string
}

interface PlaylistItem extends SongSuggestion {
  trackUri?: string
  trackName?: string
  artistName?: string
  albumArt?: string
  previewUrl?: string | null
  spotifyUrl?: string
  searchError?: string
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    const accessToken = session?.accessToken

    if (!accessToken) {
      return Response.json(
        { error: "No Spotify session found — please sign in." },
        { status: 401 }
      )
    }

    const { blocks, energyArc, emphasis, vibe, artistAnchors } =
      await request.json()

    const isLegsBlock = (name: string) =>
      /leg/i.test(name)

    const blockList = (blocks as Block[])
      .map((b) => {
        const moves = b.moves?.map((m) => m.name).join(', ')
        const label = moves ? `${b.name} (${moves})` : b.name
        return isLegsBlock(b.name) ? `${label} [2 SONGS: one for light moves, one for heavy moves]` : label
      })
      .join('\n')

    const prompt = `You are a music curator for Lagree fitness classes. Generate approximately 15 songs targeting 45-50 minutes of total playlist duration.

CLASS CONTEXT:
- Energy arc: ${energyArc}
- Emphasis: ${emphasis}
- Vibe: ${vibe}
- Artist anchors (artists/genres the instructor likes): ${artistAnchors || 'none specified'}

ROUTINE BLOCKS:
${blockList}

SONG COUNT RULES:
- Legs blocks get 3 songs each: one for the light moves phase, one for the transition, one for the heavy moves phase
- Core opener gets 2 songs
- Each oblique block gets 1-2 songs
- Arms gets 2 songs
- Core closer gets 2 songs
- Target ~15 songs total averaging ~3.5 minutes each = ~47 minutes of music

MUSIC RULES:
- Match energy to each block: core opener = building tension, light legs = momentum, heavy legs = peak intensity, obliques = focused burn, arms = sustained effort, core closer = finishing strong
- Shape the playlist arc to match the energy arc — songs should build, peak, or sustain accordingly
- Only suggest real songs that exist on Spotify — no invented titles or artists

TEMPO RULES (critical — this is a moving class):
- Working band is roughly 115–135 BPM. Never go below ~100 BPM anywhere in the set, and avoid anything frantic above ~145.
- The opener can sit at the low end of the band (~115) and the peak blocks at the high end (~128–135), but the floor never drops out — no ballads, no ambient interludes, no half-time comedowns mid-class.
- The closer can ease off slightly, but it should still drive — "finishing strong," not "cooling down."

FLOW RULES (curate like a DJ set, not a list of good songs):
- Sequence matters as much as selection. Each song should hand off to the next: adjacent songs should be within ~10 BPM of each other and share energy, mood, or sonic texture. No tempo cliffs, no genre whiplash.
- Think in one continuous mix: build → peak → sustain → strong finish, mapped to the block order above. If two adjacent picks wouldn't blend on a dance floor, swap one.
- Prefer songs with steady, driving rhythms and minimal dead air — avoid tracks with long quiet intros, extended breakdowns, or false endings that stall the room.

ARTIST MIX RULES (this is a DJ set inspired by the anchors — NOT an artist deep-dive):
- The anchors set the sonic world; the set explores that world. HARD LIMIT: no more than 2–3 songs per artist in the whole set, and that includes the anchor artists themselves.
- The majority of the set should be OTHER artists from the anchor's orbit — same scene, era, or sound; the artists Spotify would put on that anchor's radio. This is deliberately a discovery experience: the instructor should hear their taste reflected back AND find songs and artists they don't already know.
- Example: anchor = Deftones → a couple of Deftones tracks placed where they hit hardest, surrounded by the likes of Loathe, Glassjaw, Team Sleep, Hum, Smashing Pumpkins' heavier side — one coherent world, many voices. Never 15 Deftones songs.
- One anchor still means a full, varied set built AROUND that artist. Multiple anchors: blend their worlds and find artists that bridge them.
- Cohesion still matters — stay inside the world the anchors define; don't scatter across unrelated genres for variety's sake. Adjacent, never random.
- If no anchors are given, pick ONE coherent lane that fits the vibe and apply the same rules: many artists, one world.

For legs blocks with 3 songs, use suffixes: "Right legs — light", "Right legs — build", and "Right legs — heavy" (adjust phrasing to match the actual block name).

Respond with a JSON array only. No markdown, no extra text.
[{"block":"Block name","songTitle":"Title","artist":"Artist Name","rationale":"One sentence why this fits"}]`

    const aiResponse = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw =
      aiResponse.content[0].type === 'text'
        ? aiResponse.content[0].text.trim()
        : '[]'
    const cleaned = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
    const suggestions: SongSuggestion[] = JSON.parse(cleaned)

    const results = await Promise.all(
      suggestions.map(async (suggestion, index): Promise<PlaylistItem> => {
        try {
          const q = encodeURIComponent(
            `${suggestion.songTitle} ${suggestion.artist}`
          )
          const res = await fetch(
            `https://api.spotify.com/v1/search?q=${q}&type=track&limit=1`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
          )

          if (!res.ok) {
            const errBody = await res.text()
            console.error(`[Spotify] search ${res.status} for "${suggestion.songTitle}" by ${suggestion.artist}:`, errBody)
            return { ...suggestion, searchError: `Spotify ${res.status}: ${errBody}` }
          }

          const data = await res.json()

          if (index === 0) {
            console.log('[Spotify] Full response for first search call:', JSON.stringify(data, null, 2))
          }

          const track = data.tracks.items[0]
          if (!track) {
            console.warn(`[Spotify] 0 results for "${suggestion.songTitle}" by ${suggestion.artist}`)
            return { ...suggestion, searchError: `No Spotify match for "${suggestion.songTitle}" by ${suggestion.artist}` }
          }

          const albumArt = (data.tracks.items[0].album.images[0].url ?? null) as string | null
          console.log(`Spotify match: "${track.name}" | albumArt: ${albumArt ?? 'none'}`)

          return {
            ...suggestion,
            trackUri: data.tracks.items[0].uri as string,
            trackName: track.name as string,
            artistName: track.artists?.[0]?.name as string,
            albumArt: albumArt ?? undefined,
            previewUrl: (data.tracks.items[0].preview_url ?? null) as string | null,
            spotifyUrl: data.tracks.items[0].external_urls.spotify as string,
          }
        } catch (err) {
          return { ...suggestion, searchError: String(err) }
        }
      })
    )

    const trackUris = results
      .map((r) => r.trackUri)
      .filter((uri): uri is string => uri != null)

    if (trackUris.length === 0) {
      return Response.json({ error: "No Spotify tracks matched" }, { status: 404 })
    }

    return Response.json({ results, trackUris })
  } catch (err) {
    console.error('generate-playlist error:', err)
    return Response.json({ error: 'Failed to generate playlist' }, { status: 500 })
  }
}
