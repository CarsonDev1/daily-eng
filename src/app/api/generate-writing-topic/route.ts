import Groq from 'groq-sdk'
import { NextRequest, NextResponse } from 'next/server'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const { vocabulary_words } = await req.json()

    const wordList = vocabulary_words?.length > 0
      ? vocabulary_words.join(', ')
      : 'various topics'

    const prompt = `Bạn là giáo viên luyện viết tiếng Anh cho người Việt Nam trình độ B1-B2.

Từ vựng hôm nay: ${wordList}

Tạo một chủ đề viết để người học có thể sử dụng tự nhiên một số từ trên.
- Chủ đề phải cá nhân, gần gũi (về cuộc sống, ý kiến, kỷ niệm)
- Người học chỉ cần viết 5-8 câu
- Không quá học thuật

Trả về JSON với đúng 2 field, KHÔNG giải thích thêm:
{
  "topic": "Tiêu đề ngắn tối đa 5 từ tiếng Anh",
  "prompt": "Câu hướng dẫn viết bằng tiếng Anh (2-3 câu)"
}`

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
      response_format: { type: 'json_object' },
    })

    const raw = completion.choices[0].message.content ?? ''
    const result = JSON.parse(raw)

    return NextResponse.json(result)
  } catch (error) {
    console.error('generate-writing-topic error:', error)
    return NextResponse.json({ error: 'Failed to generate topic' }, { status: 500 })
  }
}
