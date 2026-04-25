'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Plus, Trash2, Loader2, Search, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// ── 型定義 ──────────────────────────────────────────────────────────────────
interface Child {
  id: string
  name: string
  avatar: string
  birth_date: string
}

// ミクロ栄養素 29種のキー（meal-records の MICRO_COLUMNS と完全一致させること）
const MICRO_FIELDS = [
  'vitamin_a', 'vitamin_d', 'vitamin_e', 'vitamin_k', 'vitamin_c',
  'vitamin_b1', 'vitamin_b2', 'vitamin_b6', 'vitamin_b12',
  'niacin', 'pantothenic_acid', 'folate', 'biotin',
  'calcium', 'phosphorus', 'potassium', 'sulfur', 'chlorine', 'sodium',
  'magnesium', 'iron', 'zinc', 'copper', 'manganese',
  'iodine', 'selenium', 'molybdenum', 'chromium', 'cobalt',
] as const

type MicroField = typeof MICRO_FIELDS[number]
type MicroValues = Record<MicroField, number | null>

type FoodStatus = 'idle' | 'loading' | 'done' | 'error'

interface FoodEntry {
  id: number
  name: string
  amount: string
  unit: string
  // 基本栄養素
  calories: number | null
  protein: number | null
  carbs: number | null
  fat: number | null
  // ミクロ栄養素 29種（food-nutrition API のレスポンスをそのまま格納）
  micro: MicroValues
  // 取得状態
  status: FoodStatus
  error: string
}

// ── 定数 ────────────────────────────────────────────────────────────────────
const MEAL_TYPE_LABELS: Record<string, string> = {
  breakfast: '朝食',
  lunch: '昼食',
  dinner: '夕食',
  snack: 'おやつ',
}

const UNITS = ['g', 'ml', '個', '枚', '杯', '本'] as const

// ── ヘルパー ─────────────────────────────────────────────────────────────────
function toLocalDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function emptyMicro(): MicroValues {
  return MICRO_FIELDS.reduce((acc, k) => { acc[k] = null; return acc }, {} as MicroValues)
}

function emptyEntry(id: number): FoodEntry {
  return {
    id,
    name: '', amount: '', unit: 'g',
    calories: null, protein: null, carbs: null, fat: null,
    micro: emptyMicro(),
    status: 'idle', error: '',
  }
}

// ── ページコンポーネント ──────────────────────────────────────────────────────
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

  // ── state 操作 ──────────────────────────────────────────────────────────
  const patchFood = (id: number, patch: Partial<FoodEntry>) => {
    setFoods(prev => prev.map(f => f.id === id ? { ...f, ...patch } : f))
  }

  const addFood = () => setFoods(prev => [...prev, emptyEntry(Date.now())])
  const removeFood = (id: number) => setFoods(prev => prev.filter(f => f.id !== id))

  // 食品名を変更したら栄養素を全リセット（古いデータが紛れ込まないよう）
  const handleNameChange = (id: number, newName: string) => {
    setFoods(prev => prev.map(f =>
      f.id === id
        ? { ...emptyEntry(id), name: newName, amount: f.amount, unit: f.unit }
        : f
    ))
  }

  // ── 栄養素取得 ──────────────────────────────────────────────────────────
  const fetchNutrition = async (id: number, name: string) => {
    if (!name.trim()) return

    patchFood(id, { status: 'loading', error: '' })

    try {
      const res = await fetch('/api/food-nutrition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ foodName: name.trim() }),
      })

      const data = await res.json()
      console.log('[fetchNutrition] foodName:', name)
      console.log('[fetchNutrition] raw response:', JSON.stringify(data))

      if (!res.ok || !data.result) {
        const msg = res.status === 422
          ? `「${name}」は認識できませんでした。食品名を変えてください。`
          : (data.error ?? '栄養素の取得に失敗しました')
        patchFood(id, { status: 'error', error: msg })
        return
      }

      const r = data.result as Record<string, unknown>

      // ── ミクロ栄養素 29種を全て取り出す ────────────────────────────────
      const micro = MICRO_FIELDS.reduce((acc, k) => {
        const v = r[k]
        acc[k] = typeof v === 'number' && !isNaN(v) ? v : null
        return acc
      }, {} as MicroValues)

      console.log('[fetchNutrition] calories:', r.calories, 'protein:', r.protein)
      console.log('[fetchNutrition] micro (all 29 fields):', JSON.stringify(micro))

      patchFood(id, {
        status: 'done',
        error: '',
        calories: typeof r.calories === 'number' ? r.calories : null,
        protein:  typeof r.protein  === 'number' ? r.protein  : null,
        carbs:    typeof r.carbs    === 'number' ? r.carbs    : null,
        fat:      typeof r.fat      === 'number' ? r.fat      : null,
        micro,
      })
    } catch (e) {
      console.error('[fetchNutrition] exception:', e)
      patchFood(id, { status: 'error', error: '通信エラーが発生しました' })
    }
  }

  // ── 保存 ────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    const child = children[childIndex]
    if (!child) return

    // status === 'done' の食材だけ保存対象
    const validFoods = foods.filter(f => f.name.trim() && f.status === 'done')
    if (validFoods.length === 0) return

    setSaving(true)
    setSaveError('')

    // 選択日のローカル正午を recordedAt に使用
    const recordedAt = new Date(`${date}T12:00:00`).toISOString()

    try {
      await Promise.all(validFoods.map(async f => {
        // ── POST body を組み立てる ──────────────────────────────────────
        // f.micro を展開することで 29フィールドが全て body に入る
        const body = {
          childId:  child.id,
          mealType,
          foodName: f.name.trim(),
          calories: f.calories,
          protein:  f.protein,
          carbs:    f.carbs,
          fat:      f.fat,
          notes:    f.amount ? `${f.amount}${f.unit}` : null,
          recordedAt,
          // ── ミクロ栄養素 29種（スプレッドで全フィールドを展開）──────────
          ...f.micro,
        }

        // ── デバッグ用：DBに何が入るか確認 ──────────────────────────────
        console.log('[handleSave] POST body for', f.name, ':', JSON.stringify(body, null, 2))
        console.log('[handleSave] key micro fields →',
          'vitamin_c:', body.vitamin_c,
          'vitamin_k:', body.vitamin_k,
          'calcium:', body.calcium,
          'iron:', body.iron,
          'folate:', body.folate,
          'magnesium:', body.magnesium,
        )

        const res = await fetch('/api/meal-records', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })

        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err.error ?? '保存に失敗しました')
        }

        const saved = await res.json()
        console.log('[handleSave] saved record from DB:', JSON.stringify(saved.record))
      }))

      router.push('/home')
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : '保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  // ── canSave ─────────────────────────────────────────────────────────────
  const child = children[childIndex]
  const namedFoods = foods.filter(f => f.name.trim())
  const totalCalories = foods.reduce((s, f) => s + (f.calories ?? 0), 0)

  // 全ての名前入力済み食材が 'done'（取得成功）であることを要求
  // error の食材は再試行または食品名変更が必要
  const canSave = !saving && !!child && namedFoods.length > 0 &&
    namedFoods.every(f => f.status === 'done')

  // ── レンダリング ─────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-screen">
      {/* ヘッダー */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-4">
        <Link href="/home" className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <h1 className="text-lg font-bold text-gray-800">手動で入力</h1>
      </div>

      <div className="px-4 flex flex-col gap-4 pb-28">

        {/* 子供選択 */}
        {children.length > 0 && (
          <div className="bg-white border border-gray-100 rounded-xl p-3">
            <p className="text-xs font-semibold text-gray-500 mb-2">対象の子供</p>
            {children.length > 1 && (
              <div className="flex gap-2 mb-2 overflow-x-auto">
                {children.map((c, i) => (
                  <button key={c.id} type="button" onClick={() => setChildIndex(i)}
                    className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      childIndex === i
                        ? 'bg-orange-500 text-white border-orange-500'
                        : 'bg-gray-50 text-gray-500 border-gray-200'
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
                  mealType === key
                    ? 'bg-orange-500 text-white border-orange-500'
                    : 'bg-white text-gray-600 border-gray-200'
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
            {foods.map(food => (
              <div key={food.id} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">

                {/* 食品名入力 */}
                <div className="flex gap-2 mb-3">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="食材・料理名を入力"
                      value={food.name}
                      onChange={e => handleNameChange(food.id, e.target.value)}
                      onBlur={e => fetchNutrition(food.id, e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur() }}
                      className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                    />
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>
                  <button onClick={() => removeFood(food.id)}
                    className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-red-400">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* 量入力 */}
                <div className="flex gap-2 mb-3">
                  <input
                    type="number"
                    placeholder="量（任意）"
                    value={food.amount}
                    onChange={e => patchFood(food.id, { amount: e.target.value })}
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                  />
                  <select
                    value={food.unit}
                    onChange={e => patchFood(food.id, { unit: e.target.value })}
                    className="w-20 border border-gray-200 rounded-xl px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                  >
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>

                {/* ステータス別表示 */}
                {food.status === 'loading' ? (
                  <div className="flex items-center gap-2 text-xs text-orange-500">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    AIが栄養素を計算中...
                  </div>

                ) : food.status === 'error' ? (
                  <div className="flex items-start gap-2">
                    <p className="text-xs text-red-500 flex-1">{food.error}</p>
                    <button
                      onClick={() => fetchNutrition(food.id, food.name)}
                      className="shrink-0 flex items-center gap-1 text-xs text-orange-500 border border-orange-200 rounded-lg px-2 py-1 hover:bg-orange-50"
                    >
                      <RefreshCw className="w-3 h-3" />再試行
                    </button>
                  </div>

                ) : food.status === 'idle' && food.name.trim() ? (
                  <p className="text-xs text-gray-400">
                    Enterまたはフォーカス移動で栄養素を自動取得します
                  </p>

                ) : food.status === 'done' ? (
                  <div className="flex flex-col gap-2">
                    {/* 基本栄養素グリッド */}
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { label: 'kcal', value: food.calories,  bg: 'bg-orange-50',  text: 'text-orange-600' },
                        { label: 'P(g)',  value: food.protein,   bg: 'bg-blue-50',    text: 'text-blue-600'   },
                        { label: 'C(g)',  value: food.carbs,     bg: 'bg-yellow-50',  text: 'text-yellow-700' },
                        { label: 'F(g)',  value: food.fat,       bg: 'bg-red-50',     text: 'text-red-600'    },
                      ].map(item => (
                        <div key={item.label} className={`${item.bg} rounded-lg p-2 text-center`}>
                          <p className="text-xs text-gray-400">{item.label}</p>
                          <p className={`text-xs font-semibold ${item.text}`}>{item.value ?? '–'}</p>
                        </div>
                      ))}
                    </div>
                    {/* 主要ミネラル・ビタミンバッジ */}
                    {(food.micro.calcium || food.micro.iron || food.micro.vitamin_c || food.micro.vitamin_d) ? (
                      <div className="flex flex-wrap gap-1.5">
                        {food.micro.calcium    ? <span className="bg-green-50 text-green-700 text-xs px-2 py-0.5 rounded-full border border-green-100">Ca {food.micro.calcium}mg</span>    : null}
                        {food.micro.iron       ? <span className="bg-green-50 text-green-700 text-xs px-2 py-0.5 rounded-full border border-green-100">Fe {food.micro.iron}mg</span>       : null}
                        {food.micro.vitamin_c  ? <span className="bg-green-50 text-green-700 text-xs px-2 py-0.5 rounded-full border border-green-100">VC {food.micro.vitamin_c}mg</span>  : null}
                        {food.micro.vitamin_d  ? <span className="bg-green-50 text-green-700 text-xs px-2 py-0.5 rounded-full border border-green-100">VD {food.micro.vitamin_d}μg</span>  : null}
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

        {/* 取得中・未取得の食材がある場合の案内 */}
        {namedFoods.some(f => f.status === 'idle' || f.status === 'loading') && (
          <p className="text-xs text-center text-amber-600 bg-amber-50 rounded-xl px-4 py-2">
            栄養素を取得中または未取得の食材があります。取得完了後に記録できます。
          </p>
        )}

        {saveError && (
          <p className="text-sm text-red-500 text-center bg-red-50 rounded-xl px-4 py-3">{saveError}</p>
        )}
      </div>

      {/* 記録ボタン（固定フッター） */}
      <div className="fixed bottom-16 left-0 right-0 px-4 pb-3 bg-white/80 backdrop-blur-sm border-t border-gray-100">
        <button
          onClick={handleSave}
          disabled={!canSave}
          className="w-full bg-orange-500 text-white font-medium py-3.5 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-sm shadow-orange-200 disabled:opacity-60"
        >
          {saving
            ? <><Loader2 className="w-4 h-4 animate-spin" />保存中...</>
            : '記録する'
          }
        </button>
      </div>
    </div>
  )
}
