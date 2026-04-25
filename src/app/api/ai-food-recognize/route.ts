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

【認識ルール — 必ず守ること】
- 皿・器・小鉢・コップ・トレーなど容器ごとに1品として分けて認識すること（例: ごはん茶碗・味噌汁椀・おかずの皿はそれぞれ別エントリ）
- 主食（ごはん・パン・麺）、汁物（味噌汁・スープ）、メイン（肉・魚・卵料理）、副菜・小鉢・漬物・サラダ・デザートも全て含めること
- 画像が暗い・ぼやけている・一部しか見えない場合でも、見えている範囲で最大限推定して認識すること（"分からない" ではなく推定値を返す）
- 1品ずつ分けて認識し、重複しないようにすること
- 各食品は一般的な子ども向け1人前の量と栄養素を推定すること
- foods 配列は必ず1件以上返すこと（どうしても不明な場合は "食事（推定）" として大まかな値を返す）

以下のJSON形式のみで返答してください（他のテキストは不要）:
{
  "foods": [
    {
      "foodName": "食品名（日本語・具体的に）",
      "calories": カロリー(kcal・整数),
      "protein": たんぱく質(g・小数第1位),
      "carbs": 炭水化物(g・小数第1位),
      "fat": 脂質(g・小数第1位),
      "portion": "目安量（例: 1杯・150g, 1個・50g）",
      "vitamin_c": ビタミンC(mg・整数・推定できなければ0),
      "calcium": カルシウム(mg・整数・推定できなければ0),
      "iron": 鉄(mg・小数第1位・推定できなければ0),
      "vitamin_d": ビタミンD(μg・小数第1位・推定できなければ0)
    }
  ]
}
JSONのみ返答してください。`,
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
