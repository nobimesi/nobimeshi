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
  const { foodName } = body

  if (!foodName?.trim()) {
    return NextResponse.json({ error: 'foodName は必須です' }, { status: 400 })
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    messages: [
      {
        role: 'user',
        content: `「${foodName.trim()}」の一般的な1人前の栄養素を推定して、以下のJSON形式のみで返してください。
{
  "foodName": "料理名（日本語・目安量付き）",
  "calories": カロリー(kcal・整数),
  "protein": たんぱく質(g・小数第1位),
  "carbs": 炭水化物(g・小数第1位),
  "fat": 脂質(g・小数第1位),
  "portion": "目安量（例: 1皿・200g）",
  "vitamin_a": ビタミンA(μg・整数・不明なら0),
  "vitamin_d": ビタミンD(μg・小数第1位・不明なら0),
  "vitamin_e": ビタミンE(mg・小数第1位・不明なら0),
  "vitamin_c": ビタミンC(mg・整数・不明なら0),
  "vitamin_b1": ビタミンB1(mg・小数第2位・不明なら0),
  "vitamin_b2": ビタミンB2(mg・小数第2位・不明なら0),
  "folate": 葉酸(μg・整数・不明なら0),
  "calcium": カルシウム(mg・整数・不明なら0),
  "iron": 鉄(mg・小数第1位・不明なら0),
  "zinc": 亜鉛(mg・小数第1位・不明なら0),
  "potassium": カリウム(mg・整数・不明なら0),
  "magnesium": マグネシウム(mg・整数・不明なら0),
  "sodium": ナトリウム(mg・整数・不明なら0)
}
食品として認識できない場合は全フィールドをnullにしてください。JSONのみ返してください。`,
      },
    ],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('JSON not found')
    const result = JSON.parse(jsonMatch[0])
    if (result.calories === null) {
      return NextResponse.json({ error: '食品として認識できませんでした' }, { status: 422 })
    }
    return NextResponse.json({ result })
  } catch {
    console.error('[POST /api/food-nutrition] parse error:', text)
    return NextResponse.json({ error: 'AIの応答を解析できませんでした' }, { status: 500 })
  }
}
