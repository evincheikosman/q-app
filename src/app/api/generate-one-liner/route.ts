import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

const SYSTEM_PROMPT = `You are Q, the voice of an app for Lagree fitness instructors. Write ONE witty one-liner that captures this specific instructor's teaching identity, based on their real data.

THE ONE-LINER:
- Appears in handwritten marker on the instructor's identity poster, under their name.
- Register: punchy, witty, a little audacious. Chelsea Handler / Paige DeSorbo energy — observational, self-aware, never mean.
- It should fuse their MUSIC TASTE with their TRAINING SIGNATURE in one line.
- Examples of the register (do NOT reuse these):
  "black lipstick and Depeche Mode vibes"
  "girly pop, but your hamstrings will beg for mercy"
  "dark, driven, and here to make your hamstrings beg for mercy"

HARD RULES:
- ONE line. Max 12 words. Lowercase (except proper nouns like artist names).
- No emoji, no quotation marks, no exclamation marks, no hashtags.
- Must be grounded in the data given — reference their actual musical mood and their actual body-part/arc tendencies. Never generic ("fitness queen", "no pain no gain").
- Never cutesy, never girlboss-clichéd, never mean about clients — the burn is a promise, not an insult.
- It must read like something a cool friend would write about them, not ad copy.

Respond with ONLY the one-liner text. Nothing else.`

export async function POST(request: Request) {
  try {
    const { topArtists, topEmphasis, topArc, vibes, totalRoutines, distinctMoves } =
      await request.json()

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 100,
      system: [{ type: 'text', text: SYSTEM_PROMPT }],
      messages: [
        {
          role: 'user',
          content: `Instructor data:
- Artists most on repeat in their class playlists: ${topArtists?.length ? topArtists.join(', ') : 'unknown'}
- Body-part emphasis they keep coming back to: ${topEmphasis ?? 'unknown'}
- Energy arc they favor: ${topArc ?? 'unknown'}
- Vibe prompts they've written for their classes: ${vibes?.length ? vibes.join(' | ') : 'unknown'}
- Routines built: ${totalRoutines ?? 0}, distinct moves used: ${distinctMoves ?? 0}

Write their one-liner.`,
        },
      ],
    })

    const raw = response.content[0].type === 'text' ? response.content[0].text.trim() : ''
    // strip any stray wrapping quotes the model might add
    const oneLiner = raw.replace(/^["'"']|["'"']$/g, '').trim()

    if (!oneLiner) throw new Error('empty')
    return Response.json({ oneLiner })
  } catch {
    return Response.json({ error: 'Could not generate a one-liner.' }, { status: 500 })
  }
}
