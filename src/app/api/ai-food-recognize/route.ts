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
    system: `あなたは子ども向け食事の栄養管理アプリ用の食品認識AIです。
画像に写った食事を認識し、必ずJSONのみを返します。

【絶対に守るルール】
1. foods 配列を空にしない。何が写っていても必ず1件以上返す。
2. 「わからない」「不明」で終わらせない。見た目・食材・調理法から推定して料理名をつける。
3. すべての数値フィールドは null や "不明" にしない。必ず数値を推定して返す。
4. JSONのみ返答する。説明文・マークダウンは一切不要。`,
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
            text: `この画像に写っている食事を全て認識してJSON形式で返してください。

【STEP 1: 食材・調理法・盛り付けを観察する】
- 色・形・テクスチャ・ソース・付け合わせから食材を特定する
- 調理法（炒める・煮る・揚げる・蒸す・生など）を見た目から推定する
- 料理名がわからなくても「○○の○○炒め」「○○の○○煮」など見た目から命名する
  例：鶏肉と野菜が入った茶色い炒め物 →「鶏肉と野菜の醤油炒め」
  例：白い器に入った緑色のスープ →「枝豆のポタージュ（推定）」

【STEP 2: 器・皿・鍋ごとに1品として切り分ける】
- 茶碗・どんぶり・皿・小鉢・コップ・フライパン・鍋など容器単位で1品
- 例：ごはん茶碗＝1品、味噌汁椀＝1品、おかずの皿＝1品（まとめない）
- 1つの皿に複数の食品が乗っている場合は1品として合算してよい

【STEP 3: 栄養素を推定する】
- 子ども向け1人前（3〜12歳）の量を基準にする
- 日本食品標準成分表を参考に、見た目の量・食材から推定する
- 不確かでも必ず数値を入れる（0.0は「測定不可」ではなく「ほぼ含まない」場合のみ使う）

【STEP 4: 認識できない・画像が不明瞭な場合】
- 完全に真っ暗・真っ白な画像でも「食事（推定）」として返す
- 部分的しか見えない場合でも見えている食品だけでも返す
- foods:[] は絶対禁止

以下のJSON形式のみで返答してください:
{
  "foods": [
    {
      "foodName": "料理名（日本語・具体的に命名）",
      "calories": カロリー(kcal・整数),
      "protein": たんぱく質(g・小数第1位),
      "carbs": 炭水化物(g・小数第1位),
      "fat": 脂質(g・小数第1位),
      "portion": "目安量（例: 1杯・約150g）",
      "vitamin_c": ビタミンC(mg・整数),
      "calcium": カルシウム(mg・整数),
      "iron": 鉄(mg・小数第1位),
      "vitamin_d": ビタミンD(μg・小数第1位)
    }
  ]
}`,
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
