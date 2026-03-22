import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

export async function POST(req: NextRequest) {
  try {
    const { term, definition, studentAnswer } = await req.json()

    if (!term || !definition || !studentAnswer) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      system: `You are a music theory teacher grading a student's explanation of a music term.
Be encouraging and concise. The student doesn't need to be word-perfect — paraphrasing, analogies, and expressing the concept in their own words is perfectly acceptable.

Respond in this exact JSON format with no other text or markdown:
{"correct": true or false, "feedback": "Your brief encouraging feedback in 1-2 sentences."}`,
      messages: [
        {
          role: 'user',
          content: `Term: "${term}"
Official definition: "${definition}"
Student's explanation: "${studentAnswer}"

Is the student's explanation correct or substantially correct?`,
        },
      ],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    const result = JSON.parse(text.trim())
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Explain route error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
