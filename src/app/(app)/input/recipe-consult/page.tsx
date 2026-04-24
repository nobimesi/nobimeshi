'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Loader2, ChefHat, AlertCircle } from 'lucide-react'
import Link from 'next/link'

interface Child {
  id: string
  name: string
  avatar: string
  birth_date: string
  gender: string | null
  activity_level: string | null
}

interface Restriction {
  id: string
  food_name: string
  restriction_type: string
}

interface AdviceResult {
  summary: string
  suggestions: { nutrient: string; advice: string; ingredient: string }[]
}

function getAge(birthDate: string) {
  const birth = new Date(birthDate)
  const now = new Date()
  let age = now.getFullYear() - birth.getFullYear()
  const m = now.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--
  return age
}

export default function RecipeConsultPage() {
  const [children, setChildren] = useState<Child[]>([])
  const [childIndex, setChildIndex] = useState(0)
  const [allergies, setAllergies] = useState<string[]>([])
  const [recipe, setRecipe] = useState('')
  const [loading, setLoading] = useState(false)
  const [advice, setAdvice] = useState<AdviceResult | null>(null)

  // 子供一覧を取得
  useEffect(() => {
    fetch('/api/children')
      .then(r => r.json())
      .then(d => setChildren(d.children ?? []))
      .catch(console.error)
  }, [])

  // 子供が変わったらアレルギー情報を取得
  useEffect(() => {
    const child = children[childIndex]
    if (!child) return
    setAllergies([])
    fetch(`/api/food-restrictions?childId=${child.id}`)
      .then(r => r.json())
      .then((d: { restrictions?: Restriction[] }) => {
        const items = (d.restrictions ?? [])
          .filter(r => r.restriction_type === 'allergy')
          .map(r => r.food_name)
        setAllergies(items)
      })
      .catch(console.error)
  }, [children, childIndex])

  const child = children[childIndex]

  const handleConsult = async () => {
    if (!recipe.trim()) return
    setLoading(true)

    // アレルギー情報を含むプロンプト（AI API実装時に使用）
    const _prompt = [
      `レシピ: ${recipe.trim()}`,
      child
        ? `対象: ${child.name}（${getAge(child.birth_date)}歳・${child.gender ?? ''}・活動量: ${child.activity_level ?? '普通'}）`
        : '',
      allergies.length > 0
        ? `アレルギー（除外必須）: ${allergies.join('・')}`
        : '',
    ]
      .filter(Boolean)
      .join('\n')

    // TODO: POST /api/recipe-consult にプロンプトを送信する
    await new Promise((r) => setTimeout(r, 1500))
    setAdvice({
      summary: '今日の摂取状況を見ると、鉄分とビタミンCが少し不足しそうです。レシピに少し工夫を加えることで、バランスよく補えます！',
      suggestions: [
        {
          nutrient: '鉄分',
          advice: '鉄分が不足しそうです',
          ingredient: 'ほうれん草やひじきを少し加えてみてはいかがでしょうか？',
        },
        {
          nutrient: 'ビタミンC',
          advice: 'ビタミンCも補いましょう',
          ingredient: 'パプリカやブロッコリーを付け合わせに加えると効果的です。',
        },
      ],
    })
    setLoading(false)
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex items-center gap-3 px-4 pt-12 pb-4">
        <Link href="/home" className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <h1 className="text-lg font-bold text-gray-800">レシピ相談</h1>
      </div>

      <div className="px-4 flex flex-col gap-4 pb-24">
        <div className="bg-orange-50 rounded-2xl p-4 flex items-start gap-3">
          <ChefHat className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
          <p className="text-sm text-gray-600 leading-relaxed">
            今日作る予定のレシピを入力してください。子供の年齢・体重・その日の摂取状況をもとに不足栄養素をアドバイスします。
          </p>
        </div>

        <div>
          <label className="text-sm text-gray-500 mb-2 block">レシピ・メニューを入力</label>
          <textarea
            value={recipe}
            onChange={(e) => setRecipe(e.target.value)}
            placeholder="例：鶏の唐揚げ、ごはん、わかめの味噌汁を作る予定です"
            rows={4}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none"
          />
        </div>

        {/* 対象の子供 */}
        {children.length > 0 && (
          <div className="bg-white border border-gray-100 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-500 mb-2">対象の子供</p>
            {children.length > 1 && (
              <div className="flex gap-2 mb-3 overflow-x-auto">
                {children.map((c, i) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setChildIndex(i)}
                    className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      childIndex === i
                        ? 'bg-orange-500 text-white border-orange-500'
                        : 'bg-gray-50 text-gray-500 border-gray-200'
                    }`}
                  >
                    <span>{c.avatar}</span>{c.name}
                  </button>
                ))}
              </div>
            )}
            {child && (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-orange-100 rounded-full flex items-center justify-center text-lg">
                  {child.avatar}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">{child.name}</p>
                  <p className="text-xs text-gray-400">
                    {getAge(child.birth_date)}歳{child.gender ? `・${child.gender}` : ''}
                    {child.activity_level ? `・活動量: ${child.activity_level}` : ''}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* アレルギー表示 */}
        {allergies.length > 0 && (
          <div className="bg-red-50 rounded-xl p-3 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-red-600 mb-0.5">登録済みアレルギー食材（自動除外）</p>
              <p className="text-xs text-red-500">{allergies.join('・')}</p>
            </div>
          </div>
        )}

        <button
          onClick={handleConsult}
          disabled={!recipe.trim() || loading}
          className="w-full bg-orange-500 text-white font-medium py-3.5 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-sm shadow-orange-200 disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              AIが分析中...
            </>
          ) : (
            'AIにアドバイスをもらう'
          )}
        </button>

        {advice && (
          <div className="flex flex-col gap-3">
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-4 border border-orange-100">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 bg-orange-500 rounded-full flex items-center justify-center shrink-0">
                  <span className="text-lg">🤖</span>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{advice.summary}</p>
              </div>
            </div>

            {advice.suggestions.map((s, i) => (
              <div key={i} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-red-100 text-red-600 text-xs font-medium px-2 py-0.5 rounded-full">
                    {s.nutrient}不足
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-700 mb-1">{s.advice}</p>
                <p className="text-sm text-gray-500 leading-relaxed">💡 {s.ingredient}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
