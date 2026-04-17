import Groq from 'groq-sdk'
import { NextRequest, NextResponse } from 'next/server'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export interface MnemonicResult {
  word: string
  mnemonic: string
}

export async function POST(req: NextRequest) {
  try {
    const { words }: { words: Array<{ word: string; meaning: string }> } = await req.json()

    const wordList = words.map((w) => `- ${w.word}: ${w.meaning}`).join('\n')

    const prompt = `Bạn là chuyên gia ghi nhớ từ vựng tiếng Anh cho người Việt Nam.
Tạo 1 mẹo nhớ hài hước và dễ nhớ cho mỗi từ dưới đây.

Từ cần nhớ:
${wordList}

Yêu cầu mẹo nhớ:
- Viết bằng tiếng Việt
- Dùng liên tưởng hình ảnh, câu chuyện ngắn, hoặc âm thanh gần giống của từ
- Hài hước, kỳ lạ, bất ngờ → càng kỳ lạ càng nhớ lâu
- Mỗi mẹo chỉ 1-2 câu ngắn gọn

Trả về ONLY JSON array, không giải thích thêm:
[
  { "word": "từ", "mnemonic": "Mẹo nhớ 1-2 câu" }
]`

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.85,
      response_format: { type: 'json_object' },
    })

    const raw = completion.choices[0].message.content ?? '[]'
    const parsed = JSON.parse(raw)
    const results: MnemonicResult[] = Array.isArray(parsed)
      ? parsed
      : (parsed.mnemonics ?? parsed.words ?? Object.values(parsed)[0])

    return NextResponse.json({ mnemonics: results })
  } catch (error) {
    console.error('generate-mnemonics error:', error)
    return NextResponse.json({ error: 'Failed to generate mnemonics' }, { status: 500 })
  }
}
