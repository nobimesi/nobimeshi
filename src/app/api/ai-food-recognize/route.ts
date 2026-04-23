import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Anthropic from '@anthropic-ai/sdk'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { imageBase64, mediaType } = body

  if (!imageBase64 || !mediaType) {
    return NextResponse.json({ error: 'imageBase64 と mediaType は必須です' }, { status: 400 })
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const message = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mediaType, data: imageBase64 },
          },
          {
            type: 'text',
            text: `この画像に写っている食べ物を認識して、以下のJSON形式で返答してください。複数の食べ物がある場合は主なものを1つ答えてください。
{
  "foodName": "食品名（日本語）",
  "calories": カロリー(kcal・数値),
  "protein": たんぱく質(g・数値),
  "carbs": 炭水化物(g・数値),
  "fat": 脂質(g・数値),
  "portion": "目安量（例: 1杯、1個）"
}
食品が認識できない場合は全フィールドをnullにしてください。JSONのみ返答してください。`,
          },
        ],
      },
    ],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('JSON not found')
    const result = JSON.parse(jsonMatch[0])
    return NextResponse.json({ result })
  } catch {
    console.error('[POST /api/ai-food-recognize] parse error:', text)
    return NextResponse.json({ error: 'AIの応答を解析できませんでした' }, { status: 500 })
  }
}
