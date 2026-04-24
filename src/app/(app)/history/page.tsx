'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Utensils, Flame } from 'lucide-react'

type FilterKey = 'today' | 'week' | 'month' | 'all'
type MealTypeKey = 'breakfast' | 'lunch' | 'dinner' | 'snack'

type Child = {
  id: string
  name: string
  avatar: string
}

type MealRecord = {
  id: string
  meal_type: MealTypeKey
  food_name: string
  calories: number | null
  protein:  number | null
  fat:      number | null
  carbs:    number | null
  notes:    string | null
  recorded_at: string
}

const MEAL_META: Record<MealTypeKey, { label: string; icon: string; color: string; border: string }> = {
  breakfast: { label: '朝食',   icon: '🌅', color: 'bg-amber-500/20',  border: 'border-amber-500/40' },
  lunch:     { label: '昼食',   icon: '☀️', color: 'bg-yellow-500/20', border: 'border-yellow-500/40' },
  dinner:    { label: '夕食',   icon: '🌙', color: 'bg-blue-500/20',   border: 'border-blue-500/40' },
  snack:     { label: 'おやつ', icon: '🍪', color: 'bg-pink-500/20',   border: 'border-pink-500/40' },
}

const MEAL_ORDER: MealTypeKey[] = ['breakfast', 'lunch', 'dinner', 'snack']

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'today', label: '今日' },
  { key: 'week',  label: '今週' },
  { key: 'month', label: '今月' },
  { key: 'all',   label: '全期間' },
]

function toLocalDateString(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function formatDateHeader(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00`)
  const today    = toLocalDateString(new Date())
  const yesterday = toLocalDateString(new Date(Date.now() - 86400000))
  if (dateStr === today)     return '今日'
  if (dateStr === yesterday) return '昨日'
  const days = ['日', '月', '火', '水', '木', '金', '土']
  return `${d.getMonth() + 1}月${d.getDate()}日（${days[d.getDay()]}）`
}

function sumNutrient(items: MealRecord[], key: keyof MealRecord): number {
  return items.reduce((acc, r) => acc + (Number(r[key]) || 0), 0)
}

function round1(n: number) { return Math.round(n * 10) / 10 }

// 食事記録をローカル日付でグループ化
function groupByDate(records: MealRecord[]): Map<string, MealRecord[]> {
  const map = new Map<string, MealRecord[]>()
  for (const r of records) {
    const d = new Date(r.recorded_at)
    const key = toLocalDateString(d)
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(r)
  }
  return map
}

function getFilterRange(filter: FilterKey): { start: Date; end: Date } | null {
  const now = new Date()
  if (filter === 'all') return null
  if (filter === 'today') {
    const start = new Date(now); start.setHours(0, 0, 0, 0)
    const end   = new Date(now); end.setHours(23, 59, 59, 999)
    return { start, end }
  }
  if (filter === 'week') {
    const start = new Date(now); start.setDate(now.getDate() - 6); start.setHours(0, 0, 0, 0)
    const end   = new Date(now); end.setHours(23, 59, 59, 999)
    return { start, end }
  }
  if (filter === 'month') {
    const start = new Date(now); start.setDate(1); start.setHours(0, 0, 0, 0)
    const end   = new Date(now); end.setHours(23, 59, 59, 999)
    return { start, end }
  }
  return null
}

// ---- 1日分の食事カード ----
function DaySection({ dateStr, records }: { dateStr: string; records: MealRecord[] }) {
  const byMeal = useMemo(() => {
    const m: Partial<Record<MealTypeKey, MealRecord[]>> = {}
    for (const r of records) {
      if (!m[r.meal_type]) m[r.meal_type] = []
      m[r.meal_type]!.push(r)
    }
    return m
  }, [records])

  const totalCals = sumNutrient(records, 'calories')
  const presentMeals = MEAL_ORDER.filter(k => (byMeal[k]?.length ?? 0) > 0)

  return (
    <div className="mb-5">
      {/* 日付ヘッダー */}
      <div className="flex items-center gap-2 mb-2 px-1">
        <span className="text-sm font-bold text-white">{formatDateHeader(dateStr)}</span>
        <div className="flex-1 h-px bg-gray-700" />
        {totalCals > 0 && (
          <div className="flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-orange-400" />
            <span className="text-xs font-semibold text-orange-400">{Math.round(totalCals)}kcal</span>
          </div>
        )}
      </div>

      {/* 食事タイプ別カード */}
      <div className="flex flex-col gap-2">
        {presentMeals.map(mealKey => {
          const items = byMeal[mealKey]!
          const meta  = MEAL_META[mealKey]
          const cal   = sumNutrient(items, 'calories')
          const prot  = sumNutrient(items, 'protein')
          const carbs = sumNutrient(items, 'carbs')
          const fat   = sumNutrient(items, 'fat')

          return (
            <div
              key={mealKey}
              className={`rounded-2xl border ${meta.border} ${meta.color} px-4 py-3`}
            >
              {/* ヘッダー */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-base">{meta.icon}</span>
                  <span className="text-xs font-bold text-white">{meta.label}</span>
                </div>
                {cal > 0 && (
                  <span className="text-sm font-bold text-orange-400">{Math.round(cal)}kcal</span>
                )}
              </div>

              {/* 食品リスト */}
              <div className="flex flex-col gap-1 mb-2">
                {items.map((item, i) => (
                  <div key={i} className="flex items-start justify-between gap-2">
                    <p className="text-sm text-white leading-snug flex-1">{item.food_name}</p>
                    {item.calories != null && (
                      <p className="text-xs text-gray-400 shrink-0">{Math.round(item.calories)}kcal</p>
                    )}
                  </div>
                ))}
              </div>

              {/* 栄養素バー */}
              {(prot > 0 || carbs > 0 || fat > 0) && (
                <div className="flex gap-3 text-xs text-gray-400 border-t border-white/10 pt-2 mt-1">
                  {prot  > 0 && <span><span className="text-blue-300 font-semibold">P</span> {round1(prot)}g</span>}
                  {carbs > 0 && <span><span className="text-yellow-300 font-semibold">C</span> {round1(carbs)}g</span>}
                  {fat   > 0 && <span><span className="text-red-300 font-semibold">F</span> {round1(fat)}g</span>}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ---- メインページ ----
export default function HistoryPage() {
  const router = useRouter()
  const [children, setChildren]     = useState<Child[]>([])
  const [childIndex, setChildIndex] = useState(0)
  const [filter, setFilter]         = useState<FilterKey>('week')
  const [records, setRecords]       = useState<MealRecord[]>([])
  const [loading, setLoading]       = useState(false)

  // 子供一覧を取得
  useEffect(() => {
    fetch('/api/children')
      .then(r => r.json())
      .then(d => setChildren(d.children ?? []))
      .catch(console.error)
  }, [])

  // 記録を取得（子供選択 or 子供リスト変化時）
  useEffect(() => {
    if (children.length === 0) return
    const child = children[childIndex]
    setLoading(true)
    fetch(`/api/meal-records?childId=${child.id}`)
      .then(r => r.json())
      .then(d => setRecords(d.records ?? []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [children, childIndex])

  // フィルター適用
  const filteredRecords = useMemo(() => {
    const range = getFilterRange(filter)
    if (!range) return records
    return records.filter(r => {
      const t = new Date(r.recorded_at).getTime()
      return t >= range.start.getTime() && t <= range.end.getTime()
    })
  }, [records, filter])

  // 日付グループ（新しい順）
  const grouped = useMemo(() => {
    const map = groupByDate(filteredRecords)
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]))
  }, [filteredRecords])

  // サマリー
  const summary = useMemo(() => ({
    days:  grouped.length,
    meals: filteredRecords.length,
    cals:  Math.round(sumNutrient(filteredRecords, 'calories')),
  }), [grouped, filteredRecords])

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* ヘッダー */}
      <div className="sticky top-0 z-10 bg-gray-900 border-b border-gray-800 px-4 pt-12 pb-3 flex items-center gap-3">
        <button type="button" onClick={() => router.back()}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-800">
          <ChevronLeft className="w-5 h-5 text-gray-300" />
        </button>
        <div className="flex items-center gap-2">
          <Utensils className="w-4 h-4 text-orange-400" />
          <h1 className="text-base font-bold">食事履歴</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4 pb-28">

        {/* 子供選択 */}
        {children.length > 0 && (
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {children.map((c, i) => (
              <button key={c.id} type="button" onClick={() => setChildIndex(i)}
                className={`shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium border transition-all ${
                  childIndex === i
                    ? 'bg-orange-500 text-white border-orange-500'
                    : 'bg-gray-800 text-gray-300 border-gray-700'
                }`}>
                <span>{c.avatar}</span>{c.name}
              </button>
            ))}
          </div>
        )}

        {/* フィルタータブ */}
        <div className="flex bg-gray-800 rounded-xl p-1">
          {FILTERS.map(f => (
            <button key={f.key} type="button" onClick={() => setFilter(f.key)}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                filter === f.key ? 'bg-orange-500 text-white shadow' : 'text-gray-400'
              }`}>
              {f.label}
            </button>
          ))}
        </div>

        {/* サマリー */}
        {!loading && filteredRecords.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: '記録日数', value: summary.days,  unit: '日' },
              { label: '食事回数', value: summary.meals, unit: '回' },
              { label: '合計カロリー', value: summary.cals.toLocaleString(), unit: 'kcal' },
            ].map(s => (
              <div key={s.label} className="bg-gray-800 rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-white">{s.value}<span className="text-xs ml-0.5 text-gray-400">{s.unit}</span></p>
                <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* 記録一覧 */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center py-16">
            <div className="w-7 h-7 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : grouped.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center">
              <Utensils className="w-7 h-7 text-gray-600" />
            </div>
            <p className="text-sm text-gray-500">この期間の食事記録はありません</p>
            <button type="button" onClick={() => router.push('/meal/new')}
              className="px-5 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-semibold">
              食事を記録する
            </button>
          </div>
        ) : (
          grouped.map(([dateStr, recs]) => (
            <DaySection key={dateStr} dateStr={dateStr} records={recs} />
          ))
        )}
      </div>
    </div>
  )
}
