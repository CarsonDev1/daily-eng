import Groq from 'groq-sdk'
import { NextRequest, NextResponse } from 'next/server'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export interface GeneratedWord {
  word: string
  meaning: string
  example_sentence: string
}

export async function POST(req: NextRequest) {
  try {
    const { topic, week_number, existing_words } = await req.json()

    const existingList =
      existing_words?.length > 0
        ? `\nTránh các từ người dùng đã học: ${existing_words.join(', ')}.`
        : ''

    const prompt = `Bạn là giáo viên tiếng Anh. Hãy tạo đúng 10 từ vựng tiếng Anh cho người học Việt Nam trình độ trung cấp (B1-B2).

Chủ đề hôm nay: "${topic || 'Daily Life'}" — Tuần ${week_number}
${existingList}

Yêu cầu:
- Chọn từ thực dụng, phù hợp chủ đề
- Nghĩa bằng tiếng Việt, ngắn gọn
- Câu ví dụ tiếng Anh tự nhiên, đơn giản
- Mix danh từ, động từ, tính từ, trạng từ

Trả về JSON array đúng định dạng, KHÔNG giải thích thêm, KHÔNG markdown:
[
  {
    "word": "example",
    "meaning": "ví dụ, minh họa",
    "example_sentence": "This is a good example of how to use the word correctly."
  }
]`

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    })

    const raw = completion.choices[0].message.content ?? ''

    // Model trả về JSON object bọc ngoài — lấy array trong đó
    const parsed = JSON.parse(raw)
    const words: GeneratedWord[] = Array.isArray(parsed)
      ? parsed
      : (parsed.words ?? parsed.vocabulary ?? Object.values(parsed)[0])

    return NextResponse.json({ words: words.slice(0, 10) })
  } catch (error) {
    console.error('generate-vocabulary error:', error)
    return NextResponse.json({ error: 'Failed to generate vocabulary' }, { status: 500 })
  }
}
