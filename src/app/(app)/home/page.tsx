'use client'

import { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Plus, Flame, PenLine, X, Trash2 } from 'lucide-react'
import Link from 'next/link'

type Child = {
  id: string
  name: string
  avatar: string
  birth_date: string
  gender: string | null
  activity_level: string | null
}

type MealRecord = {
  id: string
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  food_name: string
  calories: number | null
  protein: number | null
  fat: number | null
  carbs: number | null
  notes: string | null
  recorded_at: string
  // ビタミン
  vitamin_a?: number | null; vitamin_d?: number | null; vitamin_e?: number | null; vitamin_k?: number | null
  vitamin_b1?: number | null; vitamin_b2?: number | null; vitamin_b6?: number | null; vitamin_b12?: number | null
  vitamin_c?: number | null; niacin?: number | null; pantothenic_acid?: number | null
  folate?: number | null; biotin?: number | null
  // ミネラル
  calcium?: number | null; phosphorus?: number | null; potassium?: number | null
  sulfur?: number | null; chlorine?: number | null; sodium?: number | null
  magnesium?: number | null; iron?: number | null; zinc?: number | null
  copper?: number | null; manganese?: number | null; iodine?: number | null
  selenium?: number | null; molybdenum?: number | null; chromium?: number | null; cobalt?: number | null
}

// ビタミン13種のDRI（6〜7歳男性基準、日本人食事摂取基準2020年版）
const VITAMIN_DRI: { key: keyof MealRecord; label: string; unit: string; dri: number }[] = [
  { key: 'vitamin_a',        label: 'ビタミンA',    unit: 'μg', dri: 400  },
  { key: 'vitamin_d',        label: 'ビタミンD',    unit: 'μg', dri: 3    },
  { key: 'vitamin_e',        label: 'ビタミンE',    unit: 'mg', dri: 5    },
  { key: 'vitamin_k',        label: 'ビタミンK',    unit: 'μg', dri: 90   },
  { key: 'vitamin_b1',       label: 'ビタミンB1',   unit: 'mg', dri: 0.8  },
  { key: 'vitamin_b2',       label: 'ビタミンB2',   unit: 'mg', dri: 0.9  },
  { key: 'vitamin_b6',       label: 'ビタミンB6',   unit: 'mg', dri: 0.8  },
  { key: 'vitamin_b12',      label: 'ビタミンB12',  unit: 'μg', dri: 1.3  },
  { key: 'vitamin_c',        label: 'ビタミンC',    unit: 'mg', dri: 60   },
  { key: 'niacin',           label: 'ナイアシン',   unit: 'mg', dri: 9    },
  { key: 'pantothenic_acid', label: 'パントテン酸', unit: 'mg', dri: 4    },
  { key: 'folate',           label: '葉酸',         unit: 'μg', dri: 140  },
  { key: 'biotin',           label: 'ビオチン',     unit: 'μg', dri: 30   },
]

// ミネラル16種のDRI（同上）
const MINERAL_DRI: { key: keyof MealRecord; label: string; unit: string; dri: number }[] = [
  { key: 'calcium',    label: 'カルシウム',   unit: 'mg', dri: 600  },
  { key: 'phosphorus', label: 'リン',         unit: 'mg', dri: 500  },
  { key: 'potassium',  label: 'カリウム',     unit: 'mg', dri: 1300 },
  { key: 'sulfur',     label: '硫黄',         unit: 'mg', dri: 700  },
  { key: 'chlorine',   label: '塩素',         unit: 'mg', dri: 2000 },
  { key: 'sodium',     label: 'ナトリウム',   unit: 'mg', dri: 800  },
  { key: 'magnesium',  label: 'マグネシウム', unit: 'mg', dri: 130  },
  { key: 'iron',       label: '鉄',           unit: 'mg', dri: 5.5  },
  { key: 'zinc',       label: '亜鉛',         unit: 'mg', dri: 5    },
  { key: 'copper',     label: '銅',           unit: 'mg', dri: 0.4  },
  { key: 'manganese',  label: 'マンガン',     unit: 'mg', dri: 2.0  },
  { key: 'iodine',     label: 'ヨウ素',       unit: 'μg', dri: 90   },
  { key: 'selenium',   label: 'セレン',       unit: 'μg', dri: 20   },
  { key: 'molybdenum', label: 'モリブデン',   unit: 'μg', dri: 15   },
  { key: 'chromium',   label: 'クロム',       unit: 'μg', dri: 10   },
  { key: 'cobalt',     label: 'コバルト',     unit: 'μg', dri: 0.1  },
]

/** ビタミンまたはミネラルの平均DRI達成率（0〜100）を返す */
function calcMicroScore(records: MealRecord[], driList: { key: keyof MealRecord; dri: number }[]): number {
  let score = 0
  for (const { key, dri } of driList) {
    const total = records.reduce((s, r) => s + (Number(r[key]) || 0), 0)
    score += Math.min(total / dri, 1)
  }
  return Math.round((score / driList.length) * 100)
}

function calcAge(birthDate: string): number {
  const today = new Date()
  const birth = new Date(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

function toLocalDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const NUTRIENT_TARGETS = [
  { key: 'calories' as const, label: 'エネルギー', unit: 'kcal', bg: 'bg-orange-400', max: 1600 },
  { key: 'protein' as const,  label: 'たんぱく質', unit: 'g',    bg: 'bg-blue-400',   max: 55 },
  { key: 'carbs' as const,    label: '炭水化物',   unit: 'g',    bg: 'bg-yellow-400', max: 220 },
  { key: 'fat' as const,      label: '脂質',       unit: 'g',    bg: 'bg-red-400',    max: 50 },
]

const MEAL_TYPES = [
  { key: 'breakfast' as const, label: '朝食', icon: '🌅' },
  { key: 'lunch'     as const, label: '昼食', icon: '☀️' },
  { key: 'dinner'    as const, label: '夕食', icon: '🌙' },
  { key: 'snack'     as const, label: 'おやつ', icon: '🍪' },
]

type ViewMode = 'day' | 'week' | 'month'

function WeekCalendar({ selectedDate, onSelect }: { selectedDate: Date; onSelect: (d: Date) => void }) {
  const today = new Date()
  const weekStart = new Date(selectedDate)
  weekStart.setDate(selectedDate.getDate() - selectedDate.getDay())
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + i)
    return d
  })
  const dayLabels = ['日', '月', '火', '水', '木', '金', '土']

  return (
    <div className="bg-white px-4 py-3 border-b border-gray-100">
      <div className="flex items-center justify-between mb-2">
        <button onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate() - 7); onSelect(d) }} className="p-1.5 rounded-full hover:bg-gray-100">
          <ChevronLeft className="w-4 h-4 text-gray-400" />
        </button>
        <span className="text-sm font-semibold text-gray-700">
          {selectedDate.getFullYear()}年{selectedDate.getMonth() + 1}月
        </span>
        <button onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate() + 7); onSelect(d) }} className="p-1.5 rounded-full hover:bg-gray-100">
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {days.map((day, i) => {
          const isSelected = day.toDateString() === selectedDate.toDateString()
          const isToday = day.toDateString() === today.toDateString()
          return (
            <button key={i} onClick={() => onSelect(day)} className="flex flex-col items-center py-1 rounded-xl">
              <span className={`text-xs mb-1 ${i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-gray-400'}`}>
                {dayLabels[i]}
              </span>
              <span className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium transition-all ${
                isSelected ? 'bg-orange-500 text-white shadow-sm'
                : isToday ? 'bg-orange-100 text-orange-500 font-bold'
                : 'text-gray-700 hover:bg-gray-100'
              }`}>
                {day.getDate()}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function NutritionBar({ label, unit, bg, value, max, onClick }: {
  label: string; unit: string; bg: string; value: number; max: number; onClick?: () => void
}) {
  const pct = Math.min((value / max) * 100, 100)
  const isLow = pct < 50
  const isHigh = pct > 90
  const inner = (
    <div className={`flex items-center gap-2.5 w-full ${onClick ? 'active:opacity-70' : ''}`}>
      <span className="text-xs text-gray-500 w-16 shrink-0 font-medium">{label}</span>
      <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${bg} ${isHigh ? 'opacity-100' : 'opacity-80'}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="w-24 text-right shrink-0">
        <span className={`text-xs font-semibold ${isLow ? 'text-gray-400' : isHigh ? 'text-orange-500' : 'text-gray-700'}`}>{Math.round(value)}</span>
        <span className="text-xs text-gray-300">/{max}{unit}</span>
        {onClick && <span className="text-xs text-gray-300 ml-0.5">›</span>}
      </div>
    </div>
  )
  if (onClick) return <button className="w-full text-left" onClick={onClick}>{inner}</button>
  return inner
}

function MicroDetailModal({
  type, records, onClose,
}: {
  type: 'vitamin' | 'mineral'; records: MealRecord[]; onClose: () => void
}) {
  const dris = type === 'vitamin' ? VITAMIN_DRI : MINERAL_DRI
  const title = type === 'vitamin' ? 'ビタミン詳細（13種）' : 'ミネラル詳細（16種）'

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl max-w-lg mx-auto max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100 shrink-0">
          <h3 className="text-base font-bold text-gray-800">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-3 flex flex-col">
          {dris.map(({ key, label, unit, dri }) => {
            const total = records.reduce((s, r) => s + (Number(r[key]) || 0), 0)
            const pct = dri > 0 ? Math.min(100, Math.round((total / dri) * 100)) : 0
            const hasData = total > 0
            const barColor = pct >= 80 ? 'bg-green-400' : pct >= 50 ? 'bg-yellow-400' : 'bg-red-300'
            const display = total < 10
              ? (Math.round(total * 100) / 100).toString()
              : total < 100
              ? (Math.round(total * 10) / 10).toString()
              : Math.round(total).toString()
            return (
              <div key={key as string} className="flex items-center gap-2 py-2 border-b border-gray-50 last:border-0">
                <span className="text-xs text-gray-600 w-24 shrink-0">{label}</span>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  {hasData && <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />}
                </div>
                <div className="text-right w-20 shrink-0">
                  <span className="text-xs font-medium text-gray-700">{hasData ? `${display}${unit}` : '–'}</span>
                  {hasData && <span className="text-xs text-gray-400 ml-1">({pct}%)</span>}
                </div>
              </div>
            )
          })}
        </div>
        <p className="text-xs text-gray-300 text-center pb-4 pt-1 shrink-0">※ 6〜7歳男性基準（参考値）</p>
      </div>
    </>
  )
}

function EditMealModal({
  record, onClose, onSaved,
}: {
  record: MealRecord; onClose: () => void; onSaved: () => void
}) {
  const [foodName, setFoodName] = useState(record.food_name)
  const [calories, setCalories] = useState(record.calories?.toString() ?? '')
  const [protein, setProtein] = useState(record.protein?.toString() ?? '')
  const [carbs, setCarbs] = useState(record.carbs?.toString() ?? '')
  const [fat, setFat] = useState(record.fat?.toString() ?? '')
  const [notes, setNotes] = useState(record.notes ?? '')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleSave = async () => {
    if (!foodName.trim()) return
    setSaving(true)
    await fetch(`/api/meal-records?id=${record.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ foodName, calories, protein, carbs, fat, notes }),
    })
    setSaving(false)
    onSaved()
    onClose()
  }

  const handleDelete = async () => {
    setDeleting(true)
    await fetch(`/api/meal-records?id=${record.id}`, { method: 'DELETE' })
    setDeleting(false)
    onSaved()
    onClose()
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl max-w-lg mx-auto">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <h3 className="text-base font-bold text-gray-800">食事を編集</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        <div className="px-6 py-4 flex flex-col gap-3">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">食品名</label>
            <input
              value={foodName}
              onChange={e => setFoodName(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1.5 block">カロリー (kcal)</label>
              <input type="number" value={calories} onChange={e => setCalories(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1.5 block">たんぱく質 (g)</label>
              <input type="number" value={protein} onChange={e => setProtein(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1.5 block">炭水化物 (g)</label>
              <input type="number" value={carbs} onChange={e => setCarbs(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1.5 block">脂質 (g)</label>
              <input type="number" value={fat} onChange={e => setFat(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">メモ</label>
            <input value={notes} onChange={e => setNotes(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
          </div>
          <div className="flex gap-3 mt-1">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex-1 py-3 border border-red-200 text-red-500 rounded-xl font-semibold text-sm flex items-center justify-center gap-1.5 active:bg-red-50 disabled:opacity-40"
            >
              <Trash2 className="w-4 h-4" />
              {deleting ? '削除中...' : '削除'}
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !foodName.trim()}
              className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-semibold text-sm active:scale-95 transition-transform disabled:opacity-40"
            >
              {saving ? '保存中...' : '保存'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

function MealCard({
  mealType, foods, dateStr, onEdit,
}: {
  mealType: typeof MEAL_TYPES[number]; foods: MealRecord[]; dateStr: string; onEdit: (record: MealRecord) => void
}) {
  const totalKcal = foods.reduce((s, f) => s + (f.calories ?? 0), 0)
  const hasFood = foods.length > 0

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">{mealType.icon}</span>
          <span className="text-sm font-semibold text-gray-700">{mealType.label}</span>
        </div>
        <div className="flex items-center gap-2">
          {hasFood && <span className="text-xs font-bold text-orange-500">{Math.round(totalKcal)}kcal</span>}
          <Link
            href={`/meal/new?meal=${mealType.key}&date=${dateStr}`}
            className="w-7 h-7 bg-orange-50 rounded-full flex items-center justify-center active:bg-orange-100"
          >
            <Plus className="w-4 h-4 text-orange-500" />
          </Link>
        </div>
      </div>
      {hasFood ? (
        <div className="px-4 pb-3 flex flex-col gap-2 border-t border-gray-50">
          {foods.map((food) => (
            <div key={food.id} className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-300 shrink-0" />
                <span className="text-sm text-gray-700 truncate">{food.food_name}</span>
                {food.notes && <span className="text-xs text-gray-400 truncate">{food.notes}</span>}
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-2">
                {food.calories !== null && <span className="text-xs text-gray-500">{Math.round(food.calories)}kcal</span>}
                <button
                  onClick={() => onEdit(food)}
                  className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-50 active:bg-gray-100"
                >
                  <PenLine className="w-3.5 h-3.5 text-gray-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="px-4 pb-3 border-t border-gray-50">
          <p className="text-xs text-gray-300 text-center py-2">まだ記録がありません</p>
        </div>
      )}
    </div>
  )
}

export default function HomePage() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedChild, setSelectedChild] = useState(0)
  const [viewMode, setViewMode] = useState<ViewMode>('day')
  const [children, setChildren] = useState<Child[]>([])
  const [mealRecords, setMealRecords] = useState<MealRecord[]>([])
  const [loadingMeals, setLoadingMeals] = useState(false)
  const [editMeal, setEditMeal] = useState<MealRecord | null>(null)
  const [microModal, setMicroModal] = useState<'vitamin' | 'mineral' | null>(null)

  useEffect(() => {
    fetch('/api/children')
      .then(r => r.json())
      .then(d => setChildren(d.children ?? []))
      .catch(console.error)
  }, [])

  const fetchMeals = useCallback((childId: string, date: Date) => {
    const dateStr = toLocalDateStr(date)
    setLoadingMeals(true)
    fetch(`/api/meal-records?childId=${childId}&date=${dateStr}`)
      .then(r => r.json())
      .then(d => setMealRecords(d.records ?? []))
      .catch(console.error)
      .finally(() => setLoadingMeals(false))
  }, [])

  useEffect(() => {
    const child = children[selectedChild]
    if (!child) return
    fetchMeals(child.id, selectedDate)
  }, [children, selectedChild, selectedDate, fetchMeals])

  const isToday = selectedDate.toDateString() === new Date().toDateString()
  const child = children[selectedChild]
  const localDateStr = toLocalDateStr(selectedDate)

  // 栄養素合計
  const totals = {
    calories: mealRecords.reduce((s, r) => s + (r.calories ?? 0), 0),
    protein:  mealRecords.reduce((s, r) => s + (r.protein ?? 0), 0),
    carbs:    mealRecords.reduce((s, r) => s + (r.carbs ?? 0), 0),
    fat:      mealRecords.reduce((s, r) => s + (r.fat ?? 0), 0),
  }
  const targetKcal = NUTRIENT_TARGETS[0].max
  const kcalPct = Math.min(Math.round((totals.calories / targetKcal) * 100), 100)

  // ビタミン・ミネラルの平均DRI達成率（%）
  const vitaminScore = calcMicroScore(mealRecords, VITAMIN_DRI)
  const mineralScore = calcMicroScore(mealRecords, MINERAL_DRI)

  const handleEditSaved = () => {
    const c = children[selectedChild]
    if (c) fetchMeals(c.id, selectedDate)
  }

  return (
    <div className="flex flex-col bg-gray-50 min-h-screen">
      {/* ヘッダー */}
      <div className="bg-white px-4 pt-12 pb-3 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-lg font-bold text-gray-800">のびメシ</h1>
            <p className="text-xs text-gray-400">子供の食事・栄養管理</p>
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-0.5">
          {children.length === 0 ? (
            <div className="h-8 w-24 bg-gray-100 rounded-full animate-pulse" />
          ) : (
            children.map((c, i) => (
              <button
                key={c.id}
                onClick={() => setSelectedChild(i)}
                className={`shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium border transition-all ${
                  selectedChild === i
                    ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
                    : 'bg-white text-gray-600 border-gray-200'
                }`}
              >
                <span>{c.avatar}</span>
                {c.name}
                <span className={`text-xs ${selectedChild === i ? 'text-orange-200' : 'text-gray-400'}`}>{calcAge(c.birth_date)}歳</span>
              </button>
            ))
          )}
        </div>
      </div>

      {/* 週間カレンダー */}
      <WeekCalendar selectedDate={selectedDate} onSelect={setSelectedDate} />

      {/* カロリーサマリー */}
      <div className="px-4 pt-4 pb-2">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs text-gray-400 mb-0.5">
                {isToday ? '今日' : `${selectedDate.getMonth() + 1}/${selectedDate.getDate()}`}の摂取カロリー
              </p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-bold text-gray-800">{Math.round(totals.calories).toLocaleString()}</span>
                <span className="text-sm text-gray-400">/ {targetKcal.toLocaleString()} kcal</span>
              </div>
            </div>
            <div className="flex flex-col items-center">
              <div className="relative w-16 h-16">
                <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                  <circle cx="32" cy="32" r="26" fill="none" stroke="#f3f4f6" strokeWidth="8" />
                  <circle
                    cx="32" cy="32" r="26" fill="none" stroke="#FF6B35" strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 26}`}
                    strokeDashoffset={`${2 * Math.PI * 26 * (1 - kcalPct / 100)}`}
                    className="transition-all duration-700"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold text-orange-500">{kcalPct}%</span>
                </div>
              </div>
              <span className="text-xs text-gray-400 mt-0.5">目標達成率</span>
            </div>
          </div>

          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-gray-600">栄養素</span>
            <div className="flex bg-gray-100 rounded-full p-0.5">
              {(['day', 'week', 'month'] as ViewMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`text-xs px-2.5 py-1 rounded-full transition-colors ${viewMode === mode ? 'bg-white text-orange-500 font-semibold shadow-sm' : 'text-gray-400'}`}
                >
                  {mode === 'day' ? '今日' : mode === 'week' ? '週' : '月'}
                </button>
              ))}
            </div>
          </div>

          {loadingMeals ? (
            <div className="flex flex-col gap-2.5">
              {[0, 1, 2, 3, 4, 5].map(i => <div key={i} className="h-4 bg-gray-100 rounded-full animate-pulse" />)}
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {NUTRIENT_TARGETS.map(n => (
                <NutritionBar key={n.key} label={n.label} unit={n.unit} bg={n.bg} value={totals[n.key]} max={n.max} />
              ))}
              <div className="h-px bg-gray-100 my-0.5" />
              <NutritionBar
                label="ビタミン"
                unit="%(DRI)"
                bg="bg-green-400"
                value={vitaminScore}
                max={100}
                onClick={() => setMicroModal('vitamin')}
              />
              <NutritionBar
                label="ミネラル"
                unit="%(DRI)"
                bg="bg-teal-400"
                value={mineralScore}
                max={100}
                onClick={() => setMicroModal('mineral')}
              />
            </div>
          )}
        </div>
      </div>

      {/* 食事記録 */}
      <div className="px-4 py-2">
        <div className="flex items-center justify-between mb-2.5">
          <h2 className="text-sm font-semibold text-gray-700">食事記録</h2>
          <span className="text-xs text-gray-400">
            {isToday ? '今日' : `${selectedDate.getMonth() + 1}月${selectedDate.getDate()}日`}
            {child ? `・${child.name}` : ''}
          </span>
        </div>
        <div className="flex flex-col gap-2.5">
          {MEAL_TYPES.map((meal) => (
            <MealCard
              key={meal.key}
              mealType={meal}
              foods={mealRecords.filter(r => r.meal_type === meal.key)}
              dateStr={localDateStr}
              onEdit={setEditMeal}
            />
          ))}
        </div>
      </div>

      {/* アドバイスバナー（記録がある日のみ） */}
      {mealRecords.length > 0 && (
        <div className="px-4 py-2 pb-6">
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-4 border border-orange-100">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 bg-orange-500 rounded-full flex items-center justify-center shrink-0 shadow-sm">
                <Flame className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-orange-500 mb-1">今日の栄養</p>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {kcalPct >= 80
                    ? `目標の${kcalPct}%を達成しています！バランスよく食べられていますね。`
                    : `今日はまだ目標の${kcalPct}%です。夕食でしっかり栄養を補いましょう。`
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ビタミン/ミネラル詳細モーダル */}
      {microModal && (
        <MicroDetailModal
          type={microModal}
          records={mealRecords}
          onClose={() => setMicroModal(null)}
        />
      )}

      {/* 食事編集モーダル */}
      {editMeal && (
        <EditMealModal
          record={editMeal}
          onClose={() => setEditMeal(null)}
          onSaved={handleEditSaved}
        />
      )}
    </div>
  )
}
