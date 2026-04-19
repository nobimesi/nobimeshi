'use client'

import { useState } from 'react'
import { ArrowLeft, Loader2, Plus, X, Refrigerator } from 'lucide-react'
import Link from 'next/link'

interface Recipe {
  name: string
  ingredients: string[]
  description: string
  nutrients: { label: string; value: string }[]
  cookTime: string
}

export default function RecipeSuggestPage() {
  const [ingredients, setIngredients] = useState<string[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [recipes, setRecipes] = useState<Recipe[] | null>(null)

  const addIngredient = () => {
    const trimmed = input.trim()
    if (!trimmed || ingredients.includes(trimmed)) return
    setIngredients((prev) => [...prev, trimmed])
    setInput('')
  }

  const removeIngredient = (name: string) => {
    setIngredients((prev) => prev.filter((i) => i !== name))
  }

  const handleSuggest = async () => {
    if (ingredients.length === 0) return
    setLoading(true)
    await new Promise((r) => setTimeout(r, 1500))
    setRecipes([
      {
        name: '鮭と野菜の炒め物',
        ingredients: ['鮭', 'ブロッコリー', 'パプリカ'],
        description: 'カルシウム・鉄分・ビタミンCが豊富な栄養満点の一品。子供が食べやすい甘めの醤油味で仕上げます。',
        nutrients: [
          { label: 'カルシウム', value: '充分' },
          { label: '鉄分', value: '充分' },
          { label: 'ビタミンC', value: '豊富' },
        ],
        cookTime: '20分',
      },
      {
        name: '鮭とほうれん草のパスタ',
        ingredients: ['鮭', 'パスタ', 'ほうれん草'],
        description: '鉄分と良質なたんぱく質がとれるメニュー。クリームソースベースで子供も食べやすい！',
        nutrients: [
          { label: 'たんぱく質', value: '豊富' },
          { label: '鉄分', value: '充分' },
          { label: '炭水化物', value: '適量' },
        ],
        cookTime: '25分',
      },
    ])
    setLoading(false)
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex items-center gap-3 px-4 pt-12 pb-4">
        <Link href="/home" className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <h1 className="text-lg font-bold text-gray-800">レシピ提案</h1>
      </div>

      <div className="px-4 flex flex-col gap-4">
        <div className="bg-orange-50 rounded-2xl p-4 flex items-start gap-3">
          <Refrigerator className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
          <p className="text-sm text-gray-600 leading-relaxed">
            冷蔵庫にある食材を入力してください。AIが子供の年齢・栄養バランスを考慮したレシピを提案します。アレルギー食材は自動的に除外します。
          </p>
        </div>

        {/* 食材入力 */}
        <div>
          <label className="text-sm text-gray-500 mb-2 block">冷蔵庫の食材</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addIngredient()}
              placeholder="例: 鶏肉、にんじん..."
              className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
            <button
              onClick={addIngredient}
              className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center active:scale-95 transition-transform"
            >
              <Plus className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        {/* 食材タグ */}
        {ingredients.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {ingredients.map((ing) => (
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
        <div className="bg-red-50 rounded-xl p-3 flex items-start gap-2">
          <span className="text-red-500 text-sm">⚠️</span>
          <div>
            <p className="text-xs font-semibold text-red-600 mb-0.5">登録済みアレルギー食材（自動除外）</p>
            <p className="text-xs text-red-500">えび・かに・小麦</p>
          </div>
        </div>

        <button
          onClick={handleSuggest}
          disabled={ingredients.length === 0 || loading}
          className="w-full bg-orange-500 text-white font-medium py-3.5 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-sm shadow-orange-200 disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              AIがレシピを考え中...
            </>
          ) : (
            'レシピを提案してもらう'
          )}
        </button>

        {/* レシピ一覧 */}
        {recipes && (
          <div className="flex flex-col gap-4 pb-6">
            <p className="text-sm font-semibold text-gray-700">おすすめレシピ</p>
            {recipes.map((recipe, i) => (
              <div key={i} className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                <div className="bg-gradient-to-r from-orange-50 to-amber-50 px-4 py-3 border-b border-orange-100">
                  <div className="flex items-start justify-between">
                    <h3 className="text-sm font-bold text-gray-800">{recipe.name}</h3>
                    <span className="text-xs text-gray-400 shrink-0 ml-2">⏱️ {recipe.cookTime}</span>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-xs text-gray-500 leading-relaxed mb-3">{recipe.description}</p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {recipe.nutrients.map((n, j) => (
                      <span key={j} className="bg-green-50 text-green-700 text-xs px-2.5 py-1 rounded-full border border-green-100">
                        {n.label}: {n.value}
                      </span>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {recipe.ingredients.map((ing, j) => (
                      <span key={j} className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-md">
                        {ing}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
