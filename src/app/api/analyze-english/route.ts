import Groq from 'groq-sdk'
import { NextRequest, NextResponse } from 'next/server'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export interface AnalysisResult {
  viet_hoa_score: number
  error_types: string[]
  versions: {
    casual: string
    professional: string
    formal: string
  }
  native_thinking: string
}

export async function POST(req: NextRequest) {
  try {
    const { sentence } = await req.json()

    const prompt = `You are an expert English language coach for Vietnamese learners.
Analyze this English sentence written by a Vietnamese learner: "${sentence}"

Return a JSON object with this exact structure:
{
  "viet_hoa_score": <number 1-10, where 1=sounds perfectly native, 10=sounds extremely Vietnamese/unnatural>,
  "error_types": [<array of applicable categories from: "word order", "literal translation", "collocation", "articles", "register", "grammar", "tense">],
  "versions": {
    "casual": "<natural everyday English version a friend would say>",
    "professional": "<clear professional English version for workplace>",
    "formal": "<polished formal English version for writing>"
  },
  "native_thinking": "<Explain in Vietnamese (100-150 words) how a native English speaker THINKS about this concept — describe their mental model and why they phrase it differently. Do NOT just translate word-for-word.>"
}

Return ONLY the JSON object, no markdown code blocks, no extra explanation.`

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.4,
      response_format: { type: 'json_object' },
    })

    const raw = completion.choices[0].message.content ?? ''
    const result = JSON.parse(raw) as AnalysisResult

    return NextResponse.json(result)
  } catch (error) {
    console.error('analyze-english error:', error)
    return NextResponse.json({ error: 'Failed to analyze sentence' }, { status: 500 })
  }
}
