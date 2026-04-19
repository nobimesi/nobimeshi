'use client'

import { useState } from 'react'
import { ArrowLeft, Plus, Trash2, Loader2, Search } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface FoodEntry {
  id: number
  name: string
  amount: string
  unit: string
  calories: number | null
  protein: number | null
  carbs: number | null
  fat: number | null
  loading: boolean
}

const MEAL_TYPE_LABELS: Record<string, string> = {
  breakfast: '朝食',
  lunch: '昼食',
  dinner: '夕食',
  snack: 'おやつ',
}

export default function ManualInputPage() {
  const router = useRouter()
  const [mealType, setMealType] = useState('breakfast')
  const [foods, setFoods] = useState<FoodEntry[]>([
    { id: 1, name: '', amount: '', unit: 'g', calories: null, protein: null, carbs: null, fat: null, loading: false },
  ])

  const addFood = () => {
    setFoods((prev) => [
      ...prev,
      { id: Date.now(), name: '', amount: '', unit: 'g', calories: null, protein: null, carbs: null, fat: null, loading: false },
    ])
  }

  const removeFood = (id: number) => {
    setFoods((prev) => prev.filter((f) => f.id !== id))
  }

  const updateFood = (id: number, field: keyof FoodEntry, value: string | number | boolean | null) => {
    setFoods((prev) => prev.map((f) => (f.id === id ? { ...f, [field]: value } : f)))
  }

  const fetchNutrition = async (id: number, name: string) => {
    if (!name.trim()) return
    updateFood(id, 'loading', true)
    // AIによる栄養素補完シミュレーション
    await new Promise((r) => setTimeout(r, 800))
    // サンプルデータ
    const mock: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
      'ごはん': { calories: 168, protein: 2.5, carbs: 37.1, fat: 0.3 },
      '鶏むね肉': { calories: 108, protein: 22.3, carbs: 0, fat: 1.5 },
      'ブロッコリー': { calories: 33, protein: 3.5, carbs: 5.2, fat: 0.4 },
      'トマト': { calories: 20, protein: 0.7, carbs: 4.7, fat: 0.1 },
    }
    const data = mock[name] || { calories: 50, protein: 2.0, carbs: 8.0, fat: 1.5 }
    setFoods((prev) =>
      prev.map((f) =>
        f.id === id
          ? { ...f, ...data, loading: false }
          : f
      )
    )
  }

  const totalCalories = foods.reduce((sum, f) => sum + (f.calories || 0), 0)

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex items-center gap-3 px-4 pt-12 pb-4">
        <Link href="/home" className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <h1 className="text-lg font-bold text-gray-800">手動で入力</h1>
      </div>

      <div className="px-4 flex flex-col gap-4">
        {/* 食事タイプ選択 */}
        <div>
          <p className="text-sm text-gray-500 mb-2">食事の種類</p>
          <div className="flex gap-2">
            {Object.entries(MEAL_TYPE_LABELS).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setMealType(key)}
                className={`flex-1 py-2 rounded-xl text-xs font-medium border transition-colors ${
                  mealType === key
                    ? 'bg-orange-500 text-white border-orange-500'
                    : 'bg-white text-gray-600 border-gray-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* 日付 */}
        <div>
          <p className="text-sm text-gray-500 mb-2">日付</p>
          <input
            type="date"
            defaultValue={new Date().toISOString().split('T')[0]}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
          />
        </div>

        {/* 食材リスト */}
        <div>
          <p className="text-sm text-gray-500 mb-2">食材・メニュー</p>
          <div className="flex flex-col gap-3">
            {foods.map((food) => (
              <div key={food.id} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                <div className="flex gap-2 mb-3">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="食材・料理名を入力"
                      value={food.name}
                      onChange={(e) => updateFood(food.id, 'name', e.target.value)}
                      onBlur={(e) => fetchNutrition(food.id, e.target.value)}
                      className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                    />
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>
                  <button
                    onClick={() => removeFood(food.id)}
                    className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex gap-2 mb-3">
                  <input
                    type="number"
                    placeholder="量"
                    value={food.amount}
                    onChange={(e) => updateFood(food.id, 'amount', e.target.value)}
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                  />
                  <select
                    value={food.unit}
                    onChange={(e) => updateFood(food.id, 'unit', e.target.value)}
                    className="w-20 border border-gray-200 rounded-xl px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                  >
                    <option value="g">g</option>
                    <option value="ml">ml</option>
                    <option value="個">個</option>
                    <option value="枚">枚</option>
                    <option value="杯">杯</option>
                    <option value="本">本</option>
                  </select>
                </div>

                {food.loading ? (
                  <div className="flex items-center gap-2 text-xs text-orange-500">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    AIが栄養素を計算中...
                  </div>
                ) : food.calories !== null ? (
                  <div className="grid grid-cols-4 gap-2">
                    <div className="bg-orange-50 rounded-lg p-2 text-center">
                      <p className="text-xs text-gray-400">kcal</p>
                      <p className="text-xs font-medium text-gray-700">{food.calories}</p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-2 text-center">
                      <p className="text-xs text-gray-400">P(g)</p>
                      <p className="text-xs font-medium text-gray-700">{food.protein}</p>
                    </div>
                    <div className="bg-yellow-50 rounded-lg p-2 text-center">
                      <p className="text-xs text-gray-400">C(g)</p>
                      <p className="text-xs font-medium text-gray-700">{food.carbs}</p>
                    </div>
                    <div className="bg-red-50 rounded-lg p-2 text-center">
                      <p className="text-xs text-gray-400">F(g)</p>
                      <p className="text-xs font-medium text-gray-700">{food.fat}</p>
                    </div>
                  </div>
                ) : null}
              </div>
            ))}
          </div>

          <button
            onClick={addFood}
            className="mt-3 w-full py-3 border-2 border-dashed border-orange-200 rounded-xl flex items-center justify-center gap-2 text-sm text-orange-500 font-medium hover:bg-orange-50 transition-colors"
          >
            <Plus className="w-4 h-4" />
            食材を追加
          </button>
        </div>

        {/* 合計カロリー */}
        {totalCalories > 0 && (
          <div className="bg-orange-50 rounded-xl p-3 flex items-center justify-between">
            <span className="text-sm text-gray-600">合計カロリー</span>
            <span className="text-lg font-bold text-orange-500">{totalCalories} kcal</span>
          </div>
        )}

        {/* 記録ボタン */}
        <button
          onClick={() => router.push('/home')}
          className="w-full bg-orange-500 text-white font-medium py-3.5 rounded-xl active:scale-95 transition-transform shadow-sm shadow-orange-200 mb-6"
        >
          記録する
        </button>
      </div>
    </div>
  )
}
