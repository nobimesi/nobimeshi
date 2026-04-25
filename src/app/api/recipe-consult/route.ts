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
  const {
    plannedMenu,
    childName, age, gender, activity, allergies,
    todayCalories, todayProtein, todayCarbs, todayFat,
    todayFoods,
    targetCalories,
  } = body

  if (!plannedMenu?.trim()) {
    return NextResponse.json({ error: 'メニューを入力してください' }, { status: 400 })
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const childInfo = [
    childName ? `名前: ${childName}` : '',
    age != null ? `年齢: ${age}歳` : '',
    gender ? `性別: ${gender}` : '',
    activity ? `運動習慣: ${activity}` : '',
    targetCalories ? `目標カロリー: ${targetCalories}kcal/日` : '',
  ].filter(Boolean).join('\n')

  const todaySummary = todayFoods?.length > 0
    ? `今日すでに食べた食品: ${todayFoods.join('、')}\n合計摂取量: ${Math.round(todayCalories ?? 0)}kcal / たんぱく質${Math.round(todayProtein ?? 0)}g / 炭水化物${Math.round(todayCarbs ?? 0)}g / 脂質${Math.round(todayFat ?? 0)}g`
    : '今日の食事記録: なし（初めての食事）'

  const prompt = `子供の今日の栄養状況を分析して、これから食べる予定のメニューへのアドバイスをしてください。

【対象の子供】
${childInfo || '情報なし'}

【アレルギー（使わないこと）】
${allergies?.length > 0 ? allergies.join('・') : 'なし'}

【今日これまでの食事記録】
${todaySummary}

【これから食べる予定のメニュー】
${plannedMenu.trim()}

【分析してほしいこと】
1. 今日の記録済み食事 + 予定メニューの合算栄養を推定する
2. 年齢・性別の目標値と比較して不足している栄養素を特定する
3. 子供の成長（特に身長・骨・免疫力）の観点から優先順位をつけてアドバイスする
4. 不足を補う具体的な食材・一品を提案する（予定メニューに追加しやすいもの）

以下のJSON形式のみで返してください（他のテキストは不要）:
{
  "summary": "今日の栄養状況の全体評価（2〜3文・ポジティブな表現で）",
  "estimatedTotal": {
    "calories": 合計推定カロリー(整数),
    "protein": 合計たんぱく質(g・整数),
    "carbs": 合計炭水化物(g・整数),
    "fat": 合計脂質(g・整数)
  },
  "suggestions": [
    {
      "nutrient": "栄養素名",
      "status": "不足/やや不足/良好",
      "advice": "アドバイス（1文）",
      "ingredient": "おすすめ食材・追加方法（1〜2文）"
    }
  ],
  "growthAdvice": "子供の成長・健康に特化した総合アドバイス（2文）"
}`

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('JSON not found')
    const result = JSON.parse(jsonMatch[0])
    return NextResponse.json(result)
  } catch {
    console.error('[POST /api/recipe-consult] parse error:', text)
    return NextResponse.json({ error: 'AIの応答を解析できませんでした' }, { status: 500 })
  }
}
