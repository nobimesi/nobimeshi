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
    max_tokens: 2048,
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
            text: `この画像に写っている食べ物を全て認識してください。

【認識ルール】
- 皿・器・小鉢・コップに入っている全ての食品を漏れなく列挙すること
- ごはん・パン・麺など主食、味噌汁・スープなど汁物、卵料理・肉料理・魚料理などメイン、サラダ・副菜・漬物など小鉢も全て含めること
- 画像で確実に見える食品のみをリストアップすること（見えない・推測で存在しない食品は絶対に追加しないこと）
- 一品ずつ分けて認識し、重複しないようにすること
- 各食品の一般的な1人前の量と栄養素を推定すること

以下のJSON形式のみで返答してください（他のテキストは不要）:
{
  "foods": [
    {
      "foodName": "食品名（日本語）",
      "calories": カロリー(kcal・整数),
      "protein": たんぱく質(g・小数第1位),
      "carbs": 炭水化物(g・小数第1位),
      "fat": 脂質(g・小数第1位),
      "portion": "目安量（例: 1杯, 80g, 1個）",
      "vitamin_c": ビタミンC(mg・整数・不明なら0),
      "calcium": カルシウム(mg・整数・不明なら0),
      "iron": 鉄(mg・小数第1位・不明なら0),
      "vitamin_d": ビタミンD(μg・小数第1位・不明なら0)
    }
  ]
}
食品が全く認識できない場合は "foods": [] にしてください。JSONのみ返答してください。`,
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
    // 後方互換: foods配列の先頭を result としても返す（/meal/new の AiTab 用）
    const first = result.foods?.[0] ?? null
    return NextResponse.json({
      result: first ? { ...first, foodName: first.foodName } : null,
      foods: result.foods ?? [],
    })
  } catch {
    console.error('[POST /api/ai-food-recognize] parse error:', text)
    return NextResponse.json({ error: 'AIの応答を解析できませんでした' }, { status: 500 })
  }
}
