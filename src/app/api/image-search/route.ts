import { NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  const word = req.nextUrl.searchParams.get('q') ?? ''
  if (!word) return new Response(null, { status: 400 })

  // Stable seed: same word → same image every time
  const seed = word.toLowerCase().split('').reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 999983, 7)

  // Action-scene prompt — show the concept through actions/people, zero text in image
  const prompt = [
    `a vivid real-world action scene that visually represents the concept of "${word}"`,
    `show people or objects actively doing or experiencing this concept`,
    `dynamic composition, photorealistic or colorful digital art style`,
    `bright saturated colors, cinematic lighting, detailed and expressive`,
    `absolutely no text, no letters, no words, no subtitles, no watermarks anywhere in the image`,
  ].join(', ')

  const pollinationsUrl =
    `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}` +
    `?width=400&height=225&model=turbo&nologo=true&seed=${seed}`

  try {
    const res = await fetch(pollinationsUrl, {
      next: { revalidate: 86400 }, // cache 24h per word — only generates once
    })
    if (!res.ok) throw new Error(`Pollinations ${res.status}`)

    const blob = await res.blob()
    return new Response(blob, {
      headers: {
        'Content-Type': res.headers.get('Content-Type') ?? 'image/jpeg',
        'Cache-Control': 'no-store',
      },
    })
  } catch (e) {
    console.error('[image-search]', e)
    return new Response(null, { status: 404 })
  }
}
