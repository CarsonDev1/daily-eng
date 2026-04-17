import Groq from 'groq-sdk'
import { NextRequest, NextResponse } from 'next/server'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

const FREE_CHAT_SYSTEM = `You are Jake, a warm and funny 28-year-old from New York City. You're having a casual coffee chat with a Vietnamese friend who's learning English.

Personality: laid-back, curious, uses natural contractions and everyday idioms, genuinely interested in the other person.

Rules:
1. Keep replies short and natural (2-4 sentences max)
2. Always end with a follow-up question to keep the conversation alive
3. If the user makes a grammar or vocabulary error, correct ONLY the most important one using the coaching field — do NOT cram multiple corrections in one turn
4. Coaching tone must be warm and encouraging, never patronising:
   "Sounds great! Just a small tweak — instead of '[their phrase]', a native speaker would say '[better version]'. [One-line reason why.]"
5. If their English is already natural and correct, set coaching to null — no need to invent corrections
6. Never break character or mention that you are an AI

Return ONLY valid JSON (no markdown):
{
  "response": "Your casual in-character reply ending with a question",
  "coaching": "Friendly one-sentence correction, or null"
}`

function getRoleplaySystem(role: string, context: string) {
  return `You are playing the role of ${role}. Context: ${context}.

Rules:
1. Respond IN CHARACTER with natural, idiomatic English (2-4 sentences)
2. Use contractions and filler words a real native speaker would use
3. If the user's phrasing is unnatural or has a clear error, add a coaching note — correct ONLY the most important thing
4. Coaching format: "💡 Instead of '[their phrase]', try: '[more natural version]' — [brief reason]"
5. If they handle it fluently, give a brief in-character acknowledgement and advance the scenario naturally
6. Never break character to explain you are an AI

Return ONLY valid JSON (no markdown):
{
  "response": "Your in-character response",
  "coaching": "One coaching tip, or null if their English was natural"
}`
}

export async function POST(req: NextRequest) {
  try {
    const {
      history,
      userMessage,
      mode,
      role,
      context,
    }: {
      history: Array<{ role: 'user' | 'assistant'; content: string }>
      userMessage: string
      mode: 'chat' | 'roleplay'
      role?: string
      context?: string
    } = await req.json()

    const systemPrompt =
      mode === 'roleplay' && role && context
        ? getRoleplaySystem(role, context)
        : FREE_CHAT_SYSTEM

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        ...history,
        { role: 'user', content: userMessage },
      ],
      temperature: 0.82,
      response_format: { type: 'json_object' },
      max_tokens: 512,
    })

    const raw = completion.choices[0].message.content ?? '{}'
    const parsed = JSON.parse(raw)

    return NextResponse.json({
      response: parsed.response ?? "Sorry, I didn't quite catch that — could you say that again?",
      coaching: parsed.coaching ?? null,
    })
  } catch (error) {
    console.error('conversation error:', error)
    return NextResponse.json({ error: 'Conversation failed' }, { status: 500 })
  }
}
