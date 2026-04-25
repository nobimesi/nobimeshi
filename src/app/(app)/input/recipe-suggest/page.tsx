'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Loader2, Plus, X, Refrigerator, AlertCircle } from 'lucide-react'
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

interface GrowthRecord {
  height: number | null
  weight: number | null
}

interface Recipe {
  name: string
  ingredients: string[]
  description: string
  steps?: string[]
  nutrients: { label: string; value: string }[]
  cookTime: string
  growthPoint?: string
}

function getAge(birthDate: string) {
  const birth = new Date(birthDate)
  const now = new Date()
  let age = now.getFullYear() - birth.getFullYear()
  const m = now.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--
  return age
}

export default function RecipeSuggestPage() {
  const [children, setChildren] = useState<Child[]>([])
  const [childIndex, setChildIndex] = useState(0)
  const [allergies, setAllergies] = useState<string[]>([])
  const [growthRecord, setGrowthRecord] = useState<GrowthRecord | null>(null)
  const [ingredients, setIngredients] = useState<string[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [recipes, setRecipes] = useState<Recipe[] | null>(null)
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
    setGrowthRecord(null)
    Promise.all([
      fetch(`/api/food-restrictions?childId=${child.id}`).then(r => r.json()),
      fetch(`/api/growth-records?childId=${child.id}`).then(r => r.json()),
    ]).then(([restrictionData, growthData]) => {
      const items = (restrictionData.restrictions ?? [])
        .filter((r: Restriction) => r.restriction_type === 'allergy')
        .map((r: Restriction) => r.food_name)
      setAllergies(items)
      const latest = growthData.records?.[0]
      if (latest) setGrowthRecord({ height: latest.height, weight: latest.weight })
    }).catch(console.error)
  }, [children, childIndex])

  const child = children[childIndex]

  const addIngredient = () => {
    const trimmed = input.trim()
    if (!trimmed || ingredients.includes(trimmed)) return
    setIngredients(prev => [...prev, trimmed])
    setInput('')
  }

  const removeIngredient = (name: string) => {
    setIngredients(prev => prev.filter(i => i !== name))
  }

  const handleSuggest = async () => {
    if (ingredients.length === 0) return
    setLoading(true)
    setError('')
    setRecipes(null)
    try {
      const res = await fetch('/api/recipe-suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ingredients,
          childName: child?.name ?? '',
          age: child ? getAge(child.birth_date) : null,
          gender: child?.gender ?? '',
          activity: child?.activity_level ?? '普通',
          allergies,
          height: growthRecord?.height ?? null,
          weight: growthRecord?.weight ?? null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'エラーが発生しました')
      setRecipes(data.recipes ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex items-center gap-3 px-4 pt-12 pb-4">
        <Link href="/home" className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <h1 className="text-lg font-bold text-gray-800">レシピ提案</h1>
      </div>

      <div className="px-4 flex flex-col gap-4 pb-24">
        <div className="bg-orange-50 rounded-2xl p-4 flex items-start gap-3">
          <Refrigerator className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
          <p className="text-sm text-gray-600 leading-relaxed">
            冷蔵庫にある食材を入力してください。カルシウム・ビタミンD・鉄分など成長に必要な栄養素を意識したレシピを提案します。アレルギー食材は自動的に除外します。
          </p>
        </div>

        {/* 対象の子供 */}
        {children.length > 0 && (
          <div className="bg-white border border-gray-100 rounded-xl p-3">
            <p className="text-xs font-semibold text-gray-500 mb-2">対象の子供</p>
            {children.length > 1 && (
              <div className="flex gap-2 mb-2 overflow-x-auto">
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
              <div className="flex items-center gap-2">
                <span className="text-xl">{child.avatar}</span>
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    {child.name}
                    <span className="text-xs text-gray-400 ml-1">
                      {getAge(child.birth_date)}歳{child.gender ? `・${child.gender}` : ''}
                    </span>
                  </p>
                  {growthRecord && (
                    <p className="text-xs text-gray-400">
                      {growthRecord.height && `${growthRecord.height}cm`}
                      {growthRecord.height && growthRecord.weight && '・'}
                      {growthRecord.weight && `${growthRecord.weight}kg`}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 食材入力 */}
        <div>
          <label className="text-sm font-medium text-gray-600 mb-2 block">冷蔵庫の食材</label>
          <div className="flex gap-2">
            <input
              type="text" value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addIngredient()}
              placeholder="例: 鶏肉、にんじん、ほうれん草..."
              className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
            <button onClick={addIngredient}
              className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center active:scale-95 transition-transform">
              <Plus className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        {/* 食材タグ */}
        {ingredients.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {ingredients.map(ing => (
              <div key={ing} className="flex items-center gap-1 bg-orange-100 text-orange-700 px-3 py-1.5 rounded-full text-sm">
                {ing}
                <button onClick={() => removeIngredient(ing)}>
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
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

        <button onClick={handleSuggest} disabled={ingredients.length === 0 || loading}
          className="w-full bg-orange-500 text-white font-medium py-3.5 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-sm shadow-orange-200 disabled:opacity-60">
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" />AIがレシピを考え中...</>
          ) : (
            'レシピを提案してもらう'
          )}
        </button>

        {error && (
          <p className="text-sm text-red-500 text-center bg-red-50 rounded-xl px-4 py-3">{error}</p>
        )}

        {/* レシピ一覧 */}
        {recipes && (
          <div className="flex flex-col gap-5">
            <p className="text-sm font-semibold text-gray-700">おすすめレシピ（{recipes.length}品）</p>
            {recipes.map((recipe, i) => (
              <div key={i} className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                {/* レシピ名ヘッダー — 大きく見やすく */}
                <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-lg font-bold text-white leading-tight">{recipe.name}</h3>
                    <span className="text-xs text-orange-100 shrink-0 mt-1 bg-white/20 px-2 py-1 rounded-full">
                      ⏱️ {recipe.cookTime}
                    </span>
                  </div>
                  {recipe.growthPoint && (
                    <p className="text-xs text-orange-100 mt-1.5">🌱 {recipe.growthPoint}</p>
                  )}
                </div>

                <div className="p-4 flex flex-col gap-3">
                  {/* 説明 */}
                  <p className="text-sm text-gray-600 leading-relaxed">{recipe.description}</p>

                  {/* 栄養バッジ */}
                  {recipe.nutrients.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {recipe.nutrients.map((n, j) => (
                        <span key={j} className="bg-green-50 text-green-700 text-xs px-2.5 py-1 rounded-full border border-green-100 font-medium">
                          ✓ {n.label}: {n.value}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* 食材 */}
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-1.5">食材</p>
                    <div className="flex flex-wrap gap-1.5">
                      {recipe.ingredients.map((ing, j) => (
                        <span key={j} className="bg-gray-100 text-gray-700 text-xs px-2.5 py-1 rounded-lg">
                          {ing}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* 作り方 */}
                  {recipe.steps && recipe.steps.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 mb-1.5">作り方</p>
                      <ol className="flex flex-col gap-1.5">
                        {recipe.steps.map((step, j) => (
                          <li key={j} className="flex items-start gap-2 text-sm text-gray-600">
                            <span className="w-5 h-5 bg-orange-100 text-orange-600 rounded-full text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                              {j + 1}
                            </span>
                            {step}
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
