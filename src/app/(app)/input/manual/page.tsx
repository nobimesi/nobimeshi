'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Plus, Trash2, Loader2, Search } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Child {
  id: string
  name: string
  avatar: string
  birth_date: string
}

interface FoodEntry {
  id: number
  name: string
  amount: string
  unit: string
  calories: number | null
  protein: number | null
  carbs: number | null
  fat: number | null
  // ビタミン 13種
  vitamin_a: number | null
  vitamin_d: number | null
  vitamin_e: number | null
  vitamin_k: number | null
  vitamin_c: number | null
  vitamin_b1: number | null
  vitamin_b2: number | null
  vitamin_b6: number | null
  vitamin_b12: number | null
  niacin: number | null
  pantothenic_acid: number | null
  folate: number | null
  biotin: number | null
  // ミネラル 16種
  calcium: number | null
  phosphorus: number | null
  potassium: number | null
  sulfur: number | null
  chlorine: number | null
  sodium: number | null
  magnesium: number | null
  iron: number | null
  zinc: number | null
  copper: number | null
  manganese: number | null
  iodine: number | null
  selenium: number | null
  molybdenum: number | null
  chromium: number | null
  cobalt: number | null
  loading: boolean
  error: string
}

const MEAL_TYPE_LABELS: Record<string, string> = {
  breakfast: '朝食',
  lunch: '昼食',
  dinner: '夕食',
  snack: 'おやつ',
}

function toLocalDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function emptyEntry(id: number): FoodEntry {
  return {
    id, name: '', amount: '', unit: 'g',
    calories: null, protein: null, carbs: null, fat: null,
    vitamin_a: null, vitamin_d: null, vitamin_e: null, vitamin_k: null,
    vitamin_c: null, vitamin_b1: null, vitamin_b2: null, vitamin_b6: null,
    vitamin_b12: null, niacin: null, pantothenic_acid: null, folate: null, biotin: null,
    calcium: null, phosphorus: null, potassium: null, sulfur: null, chlorine: null,
    sodium: null, magnesium: null, iron: null, zinc: null, copper: null,
    manganese: null, iodine: null, selenium: null, molybdenum: null,
    chromium: null, cobalt: null,
    loading: false, error: '',
  }
}

export default function ManualInputPage() {
  const router = useRouter()
  const [children, setChildren] = useState<Child[]>([])
  const [childIndex, setChildIndex] = useState(0)
  const [mealType, setMealType] = useState('breakfast')
  const [date, setDate] = useState(toLocalDateStr(new Date()))
  const [foods, setFoods] = useState<FoodEntry[]>([emptyEntry(1)])
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  useEffect(() => {
    fetch('/api/children')
      .then(r => r.json())
      .then(d => setChildren(d.children ?? []))
      .catch(console.error)
  }, [])

  const addFood = () => {
    setFoods(prev => [...prev, emptyEntry(Date.now())])
  }

  const removeFood = (id: number) => {
    setFoods(prev => prev.filter(f => f.id !== id))
  }

  const updateFood = (id: number, patch: Partial<FoodEntry>) => {
    setFoods(prev => prev.map(f => f.id === id ? { ...f, ...patch } : f))
  }

  const fetchNutrition = async (id: number, name: string) => {
    if (!name.trim()) return
    updateFood(id, { loading: true, error: '' })
    try {
      const res = await fetch('/api/food-nutrition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ foodName: name.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        updateFood(id, { loading: false, error: data.error ?? '取得できませんでした' })
        return
      }
      const r = data.result
      updateFood(id, {
        loading: false, error: '',
        calories: r.calories ?? null,
        protein:  r.protein  ?? null,
        carbs:    r.carbs    ?? null,
        fat:      r.fat      ?? null,
        // ビタミン 13種
        vitamin_a:        r.vitamin_a        ?? null,
        vitamin_d:        r.vitamin_d        ?? null,
        vitamin_e:        r.vitamin_e        ?? null,
        vitamin_k:        r.vitamin_k        ?? null,
        vitamin_c:        r.vitamin_c        ?? null,
        vitamin_b1:       r.vitamin_b1       ?? null,
        vitamin_b2:       r.vitamin_b2       ?? null,
        vitamin_b6:       r.vitamin_b6       ?? null,
        vitamin_b12:      r.vitamin_b12      ?? null,
        niacin:           r.niacin           ?? null,
        pantothenic_acid: r.pantothenic_acid ?? null,
        folate:           r.folate           ?? null,
        biotin:           r.biotin           ?? null,
        // ミネラル 16種
        calcium:    r.calcium    ?? null,
        phosphorus: r.phosphorus ?? null,
        potassium:  r.potassium  ?? null,
        sulfur:     r.sulfur     ?? null,
        chlorine:   r.chlorine   ?? null,
        sodium:     r.sodium     ?? null,
        magnesium:  r.magnesium  ?? null,
        iron:       r.iron       ?? null,
        zinc:       r.zinc       ?? null,
        copper:     r.copper     ?? null,
        manganese:  r.manganese  ?? null,
        iodine:     r.iodine     ?? null,
        selenium:   r.selenium   ?? null,
        molybdenum: r.molybdenum ?? null,
        chromium:   r.chromium   ?? null,
        cobalt:     r.cobalt     ?? null,
      })
    } catch {
      updateFood(id, { loading: false, error: '通信エラーが発生しました' })
    }
  }

  const handleSave = async () => {
    const child = children[childIndex]
    if (!child) return
    const validFoods = foods.filter(f => f.name.trim())
    if (validFoods.length === 0) return

    setSaving(true)
    setSaveError('')

    // recordedAt: 選択した日付のローカル正午をISO文字列で送る
    const recordedAt = new Date(`${date}T12:00:00`).toISOString()

    try {
      await Promise.all(validFoods.map(f =>
        fetch('/api/meal-records', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            childId:  child.id,
            mealType,
            foodName: f.name.trim(),
            calories: f.calories,
            protein:  f.protein,
            carbs:    f.carbs,
            fat:      f.fat,
            notes:    f.amount ? `${f.amount}${f.unit}` : null,
            recordedAt,
            // ビタミン 13種
            vitamin_a:        f.vitamin_a,
            vitamin_d:        f.vitamin_d,
            vitamin_e:        f.vitamin_e,
            vitamin_k:        f.vitamin_k,
            vitamin_c:        f.vitamin_c,
            vitamin_b1:       f.vitamin_b1,
            vitamin_b2:       f.vitamin_b2,
            vitamin_b6:       f.vitamin_b6,
            vitamin_b12:      f.vitamin_b12,
            niacin:           f.niacin,
            pantothenic_acid: f.pantothenic_acid,
            folate:           f.folate,
            biotin:           f.biotin,
            // ミネラル 16種
            calcium:    f.calcium,
            phosphorus: f.phosphorus,
            potassium:  f.potassium,
            sulfur:     f.sulfur,
            chlorine:   f.chlorine,
            sodium:     f.sodium,
            magnesium:  f.magnesium,
            iron:       f.iron,
            zinc:       f.zinc,
            copper:     f.copper,
            manganese:  f.manganese,
            iodine:     f.iodine,
            selenium:   f.selenium,
            molybdenum: f.molybdenum,
            chromium:   f.chromium,
            cobalt:     f.cobalt,
          }),
        }).then(r => { if (!r.ok) throw new Error('保存に失敗しました') })
      ))
      router.push('/home')
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : '保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const child = children[childIndex]
  const totalCalories = foods.reduce((sum, f) => sum + (f.calories ?? 0), 0)
  const canSave = !saving && !!child && foods.some(f => f.name.trim())

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex items-center gap-3 px-4 pt-12 pb-4">
        <Link href="/home" className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <h1 className="text-lg font-bold text-gray-800">手動で入力</h1>
      </div>

      <div className="px-4 flex flex-col gap-4 pb-28">

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
                <p className="text-sm font-medium text-gray-700">{child.name}</p>
              </div>
            )}
          </div>
        )}

        {/* 食事タイプ */}
        <div>
          <p className="text-sm text-gray-500 mb-2">食事の種類</p>
          <div className="flex gap-2">
            {Object.entries(MEAL_TYPE_LABELS).map(([key, label]) => (
              <button key={key} onClick={() => setMealType(key)}
                className={`flex-1 py-2 rounded-xl text-xs font-medium border transition-colors ${
                  mealType === key ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-600 border-gray-200'
                }`}>
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
            value={date}
            onChange={e => setDate(e.target.value)}
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
                      onChange={e => updateFood(food.id, { name: e.target.value })}
                      onBlur={e => fetchNutrition(food.id, e.target.value)}
                      className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                    />
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>
                  <button onClick={() => removeFood(food.id)}
                    className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-red-400">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex gap-2 mb-3">
                  <input
                    type="number"
                    placeholder="量（任意）"
                    value={food.amount}
                    onChange={e => updateFood(food.id, { amount: e.target.value })}
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                  />
                  <select
                    value={food.unit}
                    onChange={e => updateFood(food.id, { unit: e.target.value })}
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
                ) : food.error ? (
                  <p className="text-xs text-red-500">{food.error}</p>
                ) : food.calories !== null ? (
                  <div className="flex flex-col gap-2">
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { label: 'kcal', value: food.calories,  bg: 'bg-orange-50',  text: 'text-orange-600' },
                        { label: 'P(g)',  value: food.protein,   bg: 'bg-blue-50',    text: 'text-blue-600' },
                        { label: 'C(g)',  value: food.carbs,     bg: 'bg-yellow-50',  text: 'text-yellow-700' },
                        { label: 'F(g)',  value: food.fat,       bg: 'bg-red-50',     text: 'text-red-600' },
                      ].map(item => (
                        <div key={item.label} className={`${item.bg} rounded-lg p-2 text-center`}>
                          <p className="text-xs text-gray-400">{item.label}</p>
                          <p className={`text-xs font-semibold ${item.text}`}>{item.value ?? '–'}</p>
                        </div>
                      ))}
                    </div>
                    {/* 主要ミネラル・ビタミンのサマリー */}
                    {(food.calcium || food.iron || food.vitamin_c || food.vitamin_d) ? (
                      <div className="flex flex-wrap gap-1.5">
                        {food.calcium  ? <span className="bg-green-50 text-green-700 text-xs px-2 py-0.5 rounded-full border border-green-100">Ca {food.calcium}mg</span>  : null}
                        {food.iron     ? <span className="bg-green-50 text-green-700 text-xs px-2 py-0.5 rounded-full border border-green-100">Fe {food.iron}mg</span>     : null}
                        {food.vitamin_c ? <span className="bg-green-50 text-green-700 text-xs px-2 py-0.5 rounded-full border border-green-100">VC {food.vitamin_c}mg</span> : null}
                        {food.vitamin_d ? <span className="bg-green-50 text-green-700 text-xs px-2 py-0.5 rounded-full border border-green-100">VD {food.vitamin_d}μg</span> : null}
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ))}
          </div>

          <button onClick={addFood}
            className="mt-3 w-full py-3 border-2 border-dashed border-orange-200 rounded-xl flex items-center justify-center gap-2 text-sm text-orange-500 font-medium hover:bg-orange-50 transition-colors">
            <Plus className="w-4 h-4" />
            食材を追加
          </button>
        </div>

        {/* 合計カロリー */}
        {totalCalories > 0 && (
          <div className="bg-orange-50 rounded-xl p-3 flex items-center justify-between">
            <span className="text-sm text-gray-600">合計カロリー</span>
            <span className="text-lg font-bold text-orange-500">{Math.round(totalCalories)} kcal</span>
          </div>
        )}

        {saveError && (
          <p className="text-sm text-red-500 text-center bg-red-50 rounded-xl px-4 py-3">{saveError}</p>
        )}
      </div>

      {/* 記録ボタン（固定） */}
      <div className="fixed bottom-16 left-0 right-0 px-4 pb-3 bg-white/80 backdrop-blur-sm border-t border-gray-100">
        <button onClick={handleSave} disabled={!canSave}
          className="w-full bg-orange-500 text-white font-medium py-3.5 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-sm shadow-orange-200 disabled:opacity-60">
          {saving ? (
            <><Loader2 className="w-4 h-4 animate-spin" />保存中...</>
          ) : (
            '記録する'
          )}
        </button>
      </div>
    </div>
  )
}
