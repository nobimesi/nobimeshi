'use client'

import { useState } from 'react'
import { ArrowLeft, Loader2, ChefHat } from 'lucide-react'
import Link from 'next/link'

interface AdviceResult {
  summary: string
  suggestions: { nutrient: string; advice: string; ingredient: string }[]
}

export default function RecipeConsultPage() {
  const [recipe, setRecipe] = useState('')
  const [loading, setLoading] = useState(false)
  const [advice, setAdvice] = useState<AdviceResult | null>(null)

  const handleConsult = async () => {
    if (!recipe.trim()) return
    setLoading(true)
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

      <div className="px-4 flex flex-col gap-4">
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

        <div className="bg-white border border-gray-100 rounded-xl p-4">
          <p className="text-xs font-semibold text-gray-500 mb-2">対象の子供</p>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-orange-100 rounded-full flex items-center justify-center text-lg">👦</div>
            <div>
              <p className="text-sm font-medium text-gray-800">たろう</p>
              <p className="text-xs text-gray-400">6歳・男の子・身長112cm・体重18.9kg</p>
            </div>
          </div>
        </div>

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
          <div className="flex flex-col gap-3 pb-6">
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
