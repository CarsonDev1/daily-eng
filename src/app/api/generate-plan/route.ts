import Groq from 'groq-sdk'
import { NextRequest, NextResponse } from 'next/server'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export interface WeeklyPlan {
  week: number
  topic: string
  phrases: Array<{ phrase: string; meaning_vi: string; example: string }>
  vocabulary: {
    work:   Array<{ word: string; meaning_vi: string; example: string }>
    social: Array<{ word: string; meaning_vi: string; example: string }>
    travel: Array<{ word: string; meaning_vi: string; example: string }>
  }
  grammar: Array<{ point: string; explanation_vi: string; examples: string[] }>
  speaking: { scenario_vi: string; script: string; tips_vi: string[] }
  test: Array<{ question: string; options: string[]; correct_index: number; explanation_vi: string }>
}

export async function POST(req: NextRequest) {
  try {
    const { week, topic } = await req.json()

    const prompt = `You are an expert English coach for Vietnamese learners at B1-B2 level.
Generate a 7-day English learning plan for Week ${week}, topic: "${topic}".

Return ONLY a valid JSON object with this exact structure (no markdown, no extra text):
{
  "week": ${week},
  "topic": "${topic}",
  "phrases": [
    { "phrase": "...", "meaning_vi": "nghĩa tiếng Việt ngắn gọn", "example": "A natural example sentence." }
  ],
  "vocabulary": {
    "work": [
      { "word": "...", "meaning_vi": "...", "example": "..." }
    ],
    "social": [
      { "word": "...", "meaning_vi": "...", "example": "..." }
    ],
    "travel": [
      { "word": "...", "meaning_vi": "...", "example": "..." }
    ]
  },
  "grammar": [
    {
      "point": "Grammar point name",
      "explanation_vi": "Giải thích bằng tiếng Việt, đơn giản và dễ hiểu (2-3 câu).",
      "examples": ["Example sentence 1.", "Example sentence 2.", "Example sentence 3."]
    }
  ],
  "speaking": {
    "scenario_vi": "Mô tả tình huống luyện nói bằng tiếng Việt (2-3 câu).",
    "script": "Full English practice script, ~200 words, written as a natural monologue or dialogue.",
    "tips_vi": ["Mẹo phát âm hoặc ngữ điệu 1", "Mẹo 2", "Mẹo 3"]
  },
  "test": [
    {
      "question": "Test question in English?",
      "options": ["A. option", "B. option", "C. option", "D. option"],
      "correct_index": 0,
      "explanation_vi": "Giải thích tại sao đáp án này đúng bằng tiếng Việt."
    }
  ]
}

Requirements:
- phrases: exactly 20 items, focused on daily communication
- vocabulary.work: exactly 5 words; vocabulary.social: exactly 5 words; vocabulary.travel: exactly 5 words
- grammar: exactly 5 points relevant to the topic, each with exactly 3 examples
- speaking: natural, conversational, ~200 word script
- test: exactly 5 multiple-choice questions testing phrases and grammar from the plan
- All Vietnamese text must be in proper Vietnamese (use diacritics)`

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.6,
      response_format: { type: 'json_object' },
      max_tokens: 4096,
    })

    const raw = completion.choices[0].message.content ?? '{}'
    const plan = JSON.parse(raw) as WeeklyPlan

    return NextResponse.json(plan)
  } catch (error) {
    console.error('generate-plan error:', error)
    return NextResponse.json({ error: 'Failed to generate plan' }, { status: 500 })
  }
}
