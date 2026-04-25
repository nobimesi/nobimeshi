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
  target_calories: number | null
}

interface Restriction {
  id: string
  food_name: string
  restriction_type: string
}

interface MealRecord {
  food_name: string
  calories: number | null
  protein: number | null
  carbs: number | null
  fat: number | null
}

interface AdviceResult {
  summary: string
  estimatedTotal?: { calories: number; protein: number; carbs: number; fat: number }
  suggestions: { nutrient: string; status?: string; advice: string; ingredient: string }[]
  growthAdvice?: string
}

function getAge(birthDate: string) {
  const birth = new Date(birthDate)
  const now = new Date()
  let age = now.getFullYear() - birth.getFullYear()
  const m = now.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--
  return age
}

function toLocalDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function RecipeConsultPage() {
  const [children, setChildren] = useState<Child[]>([])
  const [childIndex, setChildIndex] = useState(0)
  const [allergies, setAllergies] = useState<string[]>([])
  const [todayRecords, setTodayRecords] = useState<MealRecord[]>([])
  const [recipe, setRecipe] = useState('')
  const [loading, setLoading] = useState(false)
  const [advice, setAdvice] = useState<AdviceResult | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/children')
      .then(r => r.json())
      .then(d => setChildren(d.children ?? []))
      .catch(console.error)
  }, [])

  useEffect(() => {
    const child = children[childIndex]
    if (!child) return
    setAllergies([])
    setTodayRecords([])

    const today = toLocalDateStr(new Date())
    Promise.all([
      fetch(`/api/food-restrictions?childId=${child.id}`).then(r => r.json()),
      fetch(`/api/meal-records?childId=${child.id}&date=${today}`).then(r => r.json()),
    ]).then(([restrictionData, mealData]) => {
      const items = (restrictionData.restrictions ?? [])
        .filter((r: Restriction) => r.restriction_type === 'allergy')
        .map((r: Restriction) => r.food_name)
      setAllergies(items)
      setTodayRecords(mealData.records ?? [])
    }).catch(console.error)
  }, [children, childIndex])

  const child = children[childIndex]

  // 今日の合計
  const todayTotals = {
    calories: todayRecords.reduce((s, r) => s + (r.calories ?? 0), 0),
    protein:  todayRecords.reduce((s, r) => s + (r.protein ?? 0), 0),
    carbs:    todayRecords.reduce((s, r) => s + (r.carbs ?? 0), 0),
    fat:      todayRecords.reduce((s, r) => s + (r.fat ?? 0), 0),
  }

  const handleConsult = async () => {
    if (!recipe.trim()) return
    setLoading(true)
    setError('')
    setAdvice(null)
    try {
      const res = await fetch('/api/recipe-consult', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plannedMenu: recipe.trim(),
          childName: child?.name ?? '',
          age: child ? getAge(child.birth_date) : null,
          gender: child?.gender ?? '',
          activity: child?.activity_level ?? '普通',
          allergies,
          todayCalories: todayTotals.calories,
          todayProtein:  todayTotals.protein,
          todayCarbs:    todayTotals.carbs,
          todayFat:      todayTotals.fat,
          todayFoods:    todayRecords.map(r => r.food_name),
          targetCalories: child?.target_calories ?? null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'エラーが発生しました')
      setAdvice(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  const statusColor = (status?: string) => {
    if (status === '不足') return 'bg-red-100 text-red-600'
    if (status === 'やや不足') return 'bg-yellow-100 text-yellow-700'
    return 'bg-green-100 text-green-600'
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
            これから作る予定のメニューを入力してください。今日これまでの食事＋予定メニューを合算して栄養を分析し、子供の成長に合わせたアドバイスをします。
          </p>
        </div>

        {/* 対象の子供 */}
        {children.length > 0 && (
          <div className="bg-white border border-gray-100 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-500 mb-2">対象の子供</p>
            {children.length > 1 && (
              <div className="flex gap-2 mb-3 overflow-x-auto">
                {children.map((c, i) => (
                  <button key={c.id} type="button" onClick={() => setChildIndex(i)}
                    className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      childIndex === i ? 'bg-orange-500 text-white border-orange-500' : 'bg-gray-50 text-gray-500 border-gray-200'
                    }`}>
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

        {/* 今日の食事記録サマリー */}
        {child && (
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
            <p className="text-xs font-semibold text-blue-600 mb-1.5">📊 今日これまでの摂取量</p>
            {todayRecords.length === 0 ? (
              <p className="text-xs text-blue-400">まだ記録がありません</p>
            ) : (
              <>
                <p className="text-xs text-blue-500 mb-1">
                  {todayRecords.map(r => r.food_name).join('・')}
                </p>
                <div className="flex gap-3 text-xs">
                  <span className="text-blue-600 font-semibold">{Math.round(todayTotals.calories)}kcal</span>
                  <span className="text-blue-400">P:{Math.round(todayTotals.protein)}g</span>
                  <span className="text-blue-400">C:{Math.round(todayTotals.carbs)}g</span>
                  <span className="text-blue-400">F:{Math.round(todayTotals.fat)}g</span>
                </div>
              </>
            )}
          </div>
        )}

        {/* メニュー入力 */}
        <div>
          <label className="text-sm font-medium text-gray-600 mb-2 block">これから作る予定のメニュー</label>
          <textarea
            value={recipe} onChange={e => setRecipe(e.target.value)}
            placeholder="例：鶏の唐揚げ、ごはん、わかめの味噌汁を作る予定です"
            rows={4}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none"
          />
        </div>

        {/* アレルギー表示 */}
        {allergies.length > 0 && (
          <div className="bg-red-50 rounded-xl p-3 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-red-600 mb-0.5">登録済みアレルギー食材</p>
              <p className="text-xs text-red-500">{allergies.join('・')}</p>
            </div>
          </div>
        )}

        <button onClick={handleConsult} disabled={!recipe.trim() || loading}
          className="w-full bg-orange-500 text-white font-medium py-3.5 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-sm shadow-orange-200 disabled:opacity-60">
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" />AIが分析中...</>
          ) : (
            'AIにアドバイスをもらう'
          )}
        </button>

        {error && (
          <p className="text-sm text-red-500 text-center bg-red-50 rounded-xl px-4 py-3">{error}</p>
        )}

        {advice && (
          <div className="flex flex-col gap-3">
            {/* サマリー */}
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-4 border border-orange-100">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 bg-orange-500 rounded-full flex items-center justify-center shrink-0">
                  <span className="text-lg">🤖</span>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{advice.summary}</p>
              </div>
            </div>

            {/* 合算栄養推定 */}
            {advice.estimatedTotal && (
              <div className="bg-white border border-gray-100 rounded-xl p-3 shadow-sm">
                <p className="text-xs font-semibold text-gray-500 mb-2">📈 今日の合計推定（記録 + 予定）</p>
                <div className="grid grid-cols-4 gap-2 text-center">
                  {[
                    { label: 'kcal', value: Math.round(advice.estimatedTotal.calories), color: 'text-orange-500' },
                    { label: 'P(g)',  value: Math.round(advice.estimatedTotal.protein),  color: 'text-blue-500' },
                    { label: 'C(g)',  value: Math.round(advice.estimatedTotal.carbs),    color: 'text-yellow-600' },
                    { label: 'F(g)',  value: Math.round(advice.estimatedTotal.fat),      color: 'text-red-500' },
                  ].map(item => (
                    <div key={item.label} className="bg-gray-50 rounded-lg py-2">
                      <p className={`text-base font-bold ${item.color}`}>{item.value}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 栄養アドバイス */}
            {advice.suggestions.map((s, i) => (
              <div key={i} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColor(s.status)}`}>
                    {s.nutrient}{s.status ? `：${s.status}` : ''}
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-700 mb-1">{s.advice}</p>
                <p className="text-sm text-gray-500 leading-relaxed">💡 {s.ingredient}</p>
              </div>
            ))}

            {/* 成長アドバイス */}
            {advice.growthAdvice && (
              <div className="bg-green-50 border border-green-100 rounded-2xl p-4">
                <p className="text-xs font-semibold text-green-600 mb-1.5">🌱 成長・健康アドバイス</p>
                <p className="text-sm text-gray-700 leading-relaxed">{advice.growthAdvice}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
