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
  const { ingredients, childName, age, gender, activity, allergies, height, weight } = body

  if (!ingredients?.length) {
    return NextResponse.json({ error: '食材を1つ以上入力してください' }, { status: 400 })
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const childInfo = [
    childName ? `名前: ${childName}` : '',
    age != null ? `年齢: ${age}歳` : '',
    gender ? `性別: ${gender}` : '',
    activity ? `運動習慣: ${activity}` : '',
    height ? `身長: ${height}cm` : '',
    weight ? `体重: ${weight}kg` : '',
  ].filter(Boolean).join('\n')

  const prompt = `子供向けの栄養バランスの良いレシピを3つ提案してください。

【使用する食材（必ず最低1つ以上を使ったレシピにすること）】
${ingredients.join('・')}

【対象の子供】
${childInfo || '情報なし'}

【アレルギー（これらの食材は絶対にレシピに使わないこと）】
${allergies?.length > 0 ? allergies.join('・') : 'なし'}

【重視する栄養素（子供の成長のため優先的に含めること）】
1. カルシウム・ビタミンD → 骨の成長・身長を伸ばすために最重要
2. 鉄分 → 成長期の造血・脳の発達・貧血予防
3. ビタミンC → 免疫力・鉄分の吸収促進
4. たんぱく質 → 筋肉・臓器の成長

子供が喜んで食べられる味付けで、手軽に作れるレシピを提案してください。

以下のJSON形式のみで返してください（他のテキストは不要）:
{
  "recipes": [
    {
      "name": "レシピ名",
      "cookTime": "調理時間（例: 20分）",
      "description": "レシピの説明と栄養ポイント（2〜3文）",
      "ingredients": ["食材1（分量）", "食材2（分量）"],
      "steps": ["手順1", "手順2", "手順3"],
      "nutrients": [
        {"label": "栄養素名", "value": "豊富/充分/適量"}
      ],
      "growthPoint": "この料理が子供の成長に良い理由（1文）"
    }
  ]
}`

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('JSON not found')
    const result = JSON.parse(jsonMatch[0])
    return NextResponse.json(result)
  } catch {
    console.error('[POST /api/recipe-suggest] parse error:', text)
    return NextResponse.json({ error: 'AIの応答を解析できませんでした' }, { status: 500 })
  }
}
