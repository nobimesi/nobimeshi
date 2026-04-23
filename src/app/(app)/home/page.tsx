'use client'

import { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Plus, Flame } from 'lucide-react'
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
}

function calcAge(birthDate: string): number {
  const today = new Date()
  const birth = new Date(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
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

function NutritionBar({ label, unit, bg, value, max }: { label: string; unit: string; bg: string; value: number; max: number }) {
  const pct = Math.min((value / max) * 100, 100)
  const isLow = pct < 50
  const isHigh = pct > 90
  return (
    <div className="flex items-center gap-2.5">
      <span className="text-xs text-gray-500 w-16 shrink-0 font-medium">{label}</span>
      <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${bg} ${isHigh ? 'opacity-100' : 'opacity-80'}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="w-24 text-right shrink-0">
        <span className={`text-xs font-semibold ${isLow ? 'text-gray-400' : isHigh ? 'text-orange-500' : 'text-gray-700'}`}>{Math.round(value)}</span>
        <span className="text-xs text-gray-300">/{max}{unit}</span>
      </div>
    </div>
  )
}

function MealCard({ mealType, foods }: { mealType: typeof MEAL_TYPES[number]; foods: MealRecord[] }) {
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
            href={`/input/manual?meal=${mealType.key}`}
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
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-300 shrink-0" />
                <span className="text-sm text-gray-700">{food.food_name}</span>
                {food.notes && <span className="text-xs text-gray-400">{food.notes}</span>}
              </div>
              {food.calories !== null && <span className="text-xs text-gray-500">{Math.round(food.calories)}kcal</span>}
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

  useEffect(() => {
    fetch('/api/children')
      .then(r => r.json())
      .then(d => setChildren(d.children ?? []))
      .catch(console.error)
  }, [])

  const fetchMeals = useCallback((childId: string, date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
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

  // 栄養素合計
  const totals = {
    calories: mealRecords.reduce((s, r) => s + (r.calories ?? 0), 0),
    protein:  mealRecords.reduce((s, r) => s + (r.protein ?? 0), 0),
    carbs:    mealRecords.reduce((s, r) => s + (r.carbs ?? 0), 0),
    fat:      mealRecords.reduce((s, r) => s + (r.fat ?? 0), 0),
  }
  const targetKcal = NUTRIENT_TARGETS[0].max
  const kcalPct = Math.min(Math.round((totals.calories / targetKcal) * 100), 100)

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
              {[0, 1, 2, 3].map(i => <div key={i} className="h-4 bg-gray-100 rounded-full animate-pulse" />)}
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {NUTRIENT_TARGETS.map(n => (
                <NutritionBar key={n.key} label={n.label} unit={n.unit} bg={n.bg} value={totals[n.key]} max={n.max} />
              ))}
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
    </div>
  )
}
