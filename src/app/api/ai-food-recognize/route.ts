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
  const { imageBase64, mediaType, correction } = body

  if (!imageBase64 || !mediaType) {
    return NextResponse.json({ error: 'imageBase64 と mediaType は必須です' }, { status: 400 })
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const userText = correction
    ? `以下の修正指示に従って、食事の認識結果を修正してください。

【修正指示】
${correction}

【修正のルール】
- 修正指示に記載された内容を反映する
- 修正指示にない食品はそのまま維持する
- 数値は修正指示の内容から再計算する
- 修正後もJSON形式のみで返答する

JSON形式のみで返答:
{
  "foods": [
    {
      "foodName": "料理名",
      "calories": カロリー(kcal・整数),
      "protein": たんぱく質(g・小数第1位),
      "carbs": 炭水化物(g・小数第1位),
      "fat": 脂質(g・小数第1位),
      "portion": "目安量",
      "vitamin_c": ビタミンC(mg・整数),
      "calcium": カルシウム(mg・整数),
      "iron": 鉄(mg・小数第1位),
      "vitamin_d": ビタミンD(μg・小数第1位)
    }
  ]
}`
    : `画像に写っている食事を認識してJSON形式で返してください。

【STEP 1: 食材・調理状態を正確に観察する】
- 実際に見える食材・色・形・テクスチャ・調理状態のみを認識する
- 見えていない食材（チーズ・バター・隠し味など）は絶対に料理名に含めない
- 見えている食材から自然な日本語の料理名をつける
  例：茶色い肉片＋オレンジ色の果肉が見える →「鶏肉の柑橘ソテー」
  例：白いご飯が茶碗に盛られている →「白ごはん」
- 全く何も識別できない場合も「食事（推定）」として必ず1件返す

【STEP 2: 品目の分け方はAIが判断する】
- 基本は容器・皿単位で1品とする
- 以下の場合はAIが適切に判断する：
  ・カレー＋ライス、ハンバーグ＋付け合わせなど主食と主菜が明確に分かれていれば別々に分ける
  ・複数の独立した料理が1つのお盆や皿に乗っている → それぞれ別品目として認識する
  ・丼もの・混ぜご飯・チャーハンなど一体化した料理 → 1品としてまとめる
- 判断基準：「食べるときに分けて食べるか」「栄養素が大きく異なるか」で判断する

【STEP 3: 画像から実際の量を推定する】
- 年齢・体格の固定基準は使わない。画像に写っている実際の量を推定する。
- 推定の手順：
  ① 器・皿のサイズを一般的な食器と比較して推定する
     （ご飯茶碗=直径12cm/普通盛180g/大盛250g、どんぶり=直径15cm/約350g、
      取り皿=直径18cm、小鉢=直径10cm、フライパン=直径26cm）
  ② 食材の高さ・密度・盛り付け状態から体積を推定する
  ③ 食材ごとの調理後重量・比重から実際のグラム数を算出する
  ④ 日本食品標準成分表の100g当たり栄養価 × 推定グラム数 で栄養素を計算する
- portionには「大盛・約250g」「普通盛・約180g」など見た目の特徴を反映する

【STEP 4: 画像が不明瞭・認識困難な場合】
- 部分的にしか見えない場合も、見えている部分から最善の推定をして返す
- 全く何も識別できない場合も「食事（推定）」として必ず1件返す
- foods:[] は絶対禁止

JSON形式のみで返答:
{
  "foods": [
    {
      "foodName": "料理名（画像に写っているものから正確に命名・日本語）",
      "calories": カロリー(kcal・整数),
      "protein": たんぱく質(g・小数第1位),
      "carbs": 炭水化物(g・小数第1位),
      "fat": 脂質(g・小数第1位),
      "portion": "目安量（例: 大盛・約250g）",
      "vitamin_c": ビタミンC(mg・整数),
      "calcium": カルシウム(mg・整数),
      "iron": 鉄(mg・小数第1位),
      "vitamin_d": ビタミンD(μg・小数第1位)
    }
  ]
}`

  const message = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 2048,
    system: `あなたは食事画像から食品を正確に認識する栄養管理AIです。
画像に実際に写っている食品を認識し、JSONのみを返します。

【絶対に守るルール】
1. 画像に写っていない食材は絶対に追加しない。見えるものだけを報告する。
2. 数値フィールドは必ず数値を入れる（null・"不明"禁止）。
3. JSONのみ返答する。説明文・マークダウン不要。
4. foods:[] は絶対禁止。必ず1件以上返す。`,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mediaType, data: imageBase64 },
          },
          { type: 'text', text: userText },
        ],
      },
    ],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('JSON not found')
    const result = JSON.parse(jsonMatch[0])
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
