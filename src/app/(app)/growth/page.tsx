'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
  BarChart, Bar, Cell,
} from 'recharts'
import { Plus, TrendingUp, TrendingDown, X, Flame, Salad } from 'lucide-react'

// =====================================================================
// 型定義
// =====================================================================
type MetricType = 'height' | 'weight'

type Child = {
  id: string
  name: string
  avatar: string
  birth_date: string
  gender: string | null
}

type GrowthRecord = {
  id: string
  recorded_at: string
  height: number | null
  weight: number | null
}

type MealRecord = {
  id: string
  recorded_at: string
  calories: number | null
  protein: number | null
  carbs: number | null
  fat: number | null
  vitamin_a?: number | null; vitamin_d?: number | null; vitamin_e?: number | null; vitamin_k?: number | null
  vitamin_b1?: number | null; vitamin_b2?: number | null; vitamin_b6?: number | null; vitamin_b12?: number | null
  vitamin_c?: number | null; niacin?: number | null; pantothenic_acid?: number | null
  folate?: number | null; biotin?: number | null
  calcium?: number | null; phosphorus?: number | null; potassium?: number | null
  sulfur?: number | null; chlorine?: number | null; sodium?: number | null
  magnesium?: number | null; iron?: number | null; zinc?: number | null
  copper?: number | null; manganese?: number | null; iodine?: number | null
  selenium?: number | null; molybdenum?: number | null; chromium?: number | null; cobalt?: number | null
}

type ChartPoint = { label: string; value: number }

// =====================================================================
// 成長曲線参考値（厚労省）
// =====================================================================
const MHLW_HEIGHT: Record<'male' | 'female', Record<number, { avg: number; sd: number }>> = {
  male: {
    1: { avg: 75.8, sd: 3.0 },  2: { avg: 87.1, sd: 3.5 },  3: { avg: 95.1, sd: 3.8 },
    4: { avg: 102.1, sd: 4.0 }, 5: { avg: 110.4, sd: 4.2 }, 6: { avg: 116.5, sd: 4.5 },
    7: { avg: 122.5, sd: 4.8 }, 8: { avg: 128.0, sd: 5.0 }, 9: { avg: 133.5, sd: 5.2 },
    10: { avg: 138.8, sd: 5.5 }, 11: { avg: 145.2, sd: 6.0 }, 12: { avg: 152.6, sd: 6.5 },
    13: { avg: 160.0, sd: 7.0 }, 14: { avg: 165.1, sd: 6.5 }, 15: { avg: 168.3, sd: 6.0 },
    16: { avg: 169.8, sd: 5.8 }, 17: { avg: 170.6, sd: 5.5 }, 18: { avg: 170.8, sd: 5.5 },
  },
  female: {
    1: { avg: 74.4, sd: 3.0 },  2: { avg: 86.0, sd: 3.5 },  3: { avg: 93.9, sd: 3.8 },
    4: { avg: 101.0, sd: 4.0 }, 5: { avg: 109.4, sd: 4.2 }, 6: { avg: 115.6, sd: 4.5 },
    7: { avg: 121.5, sd: 4.8 }, 8: { avg: 127.3, sd: 5.0 }, 9: { avg: 133.4, sd: 5.2 },
    10: { avg: 140.2, sd: 5.5 }, 11: { avg: 146.8, sd: 6.0 }, 12: { avg: 151.8, sd: 6.0 },
    13: { avg: 154.8, sd: 5.5 }, 14: { avg: 156.7, sd: 5.5 }, 15: { avg: 157.3, sd: 5.3 },
    16: { avg: 157.7, sd: 5.3 }, 17: { avg: 158.0, sd: 5.3 }, 18: { avg: 157.9, sd: 5.3 },
  },
}

const MHLW_WEIGHT: Record<'male' | 'female', Record<number, { avg: number; sd: number }>> = {
  male: {
    1: { avg: 9.7, sd: 1.0 },   2: { avg: 12.0, sd: 1.3 },  3: { avg: 13.9, sd: 1.5 },
    4: { avg: 15.7, sd: 1.8 },  5: { avg: 18.9, sd: 2.5 },  6: { avg: 21.4, sd: 3.0 },
    7: { avg: 23.9, sd: 3.5 },  8: { avg: 26.9, sd: 4.0 },  9: { avg: 30.4, sd: 5.0 },
    10: { avg: 34.1, sd: 6.0 }, 11: { avg: 38.2, sd: 7.0 }, 12: { avg: 44.0, sd: 8.0 },
    13: { avg: 49.7, sd: 9.0 }, 14: { avg: 54.1, sd: 9.5 }, 15: { avg: 58.2, sd: 9.5 },
    16: { avg: 60.4, sd: 9.5 }, 17: { avg: 62.4, sd: 9.5 }, 18: { avg: 64.2, sd: 9.5 },
  },
  female: {
    1: { avg: 9.1, sd: 1.0 },   2: { avg: 11.5, sd: 1.3 },  3: { avg: 13.5, sd: 1.5 },
    4: { avg: 15.2, sd: 1.8 },  5: { avg: 18.4, sd: 2.5 },  6: { avg: 20.6, sd: 3.0 },
    7: { avg: 23.0, sd: 3.5 },  8: { avg: 25.8, sd: 4.0 },  9: { avg: 29.1, sd: 5.0 },
    10: { avg: 33.5, sd: 6.0 }, 11: { avg: 38.8, sd: 7.0 }, 12: { avg: 43.8, sd: 8.0 },
    13: { avg: 47.0, sd: 8.5 }, 14: { avg: 49.6, sd: 8.5 }, 15: { avg: 51.0, sd: 8.5 },
    16: { avg: 51.9, sd: 8.5 }, 17: { avg: 52.4, sd: 8.5 }, 18: { avg: 52.9, sd: 8.5 },
  },
}

type RefData = { avg: number; p3: number; p10: number; p90: number; p97: number }

function getRef(table: typeof MHLW_HEIGHT, age: number, gender: string | null): RefData {
  const key: 'male' | 'female' = gender === '女の子' ? 'female' : 'male'
  const entry = table[key][Math.max(1, Math.min(18, age))]
  if (!entry) return { avg: 0, p3: 0, p10: 0, p90: 0, p97: 0 }
  const r = (v: number) => Math.round(v * 10) / 10
  return {
    avg: r(entry.avg),
    p3:  r(entry.avg - 1.88 * entry.sd),
    p10: r(entry.avg - 1.28 * entry.sd),
    p90: r(entry.avg + 1.28 * entry.sd),
    p97: r(entry.avg + 1.88 * entry.sd),
  }
}

// =====================================================================
// 栄養参照値（日本人の食事摂取基準 2020年版, 身体活動レベルII 男性基準）
// =====================================================================
function getCalorieGoal(age: number, isFemale: boolean): number {
  const t: Record<number, [number, number]> = {
    1:[950,900], 2:[1050,1000], 3:[1300,1250], 4:[1300,1250], 5:[1300,1250],
    6:[1550,1450], 7:[1750,1650], 8:[2100,1900], 9:[2200,2050],
    10:[2500,2150], 11:[2700,2450], 12:[2900,2700],
    13:[3150,2850], 14:[3300,2950], 15:[3150,2750],
    16:[3150,2450], 17:[3150,2450], 18:[2850,2350],
  }
  const e = t[Math.max(1, Math.min(18, age))]
  return e ? (isFemale ? e[1] : e[0]) : 2000
}

// [ビタミン, ミネラル] ごとのDRI定義（6〜7歳男性基準、単位付き）
type DRI = { label: string; key: keyof MealRecord; unit: string; goal: number }

const VITAMIN_DRIS: DRI[] = [
  { label: 'ビタミンA',    key: 'vitamin_a',        unit: 'μg', goal: 400  },
  { label: 'ビタミンD',    key: 'vitamin_d',        unit: 'μg', goal: 3    },
  { label: 'ビタミンE',    key: 'vitamin_e',        unit: 'mg', goal: 5    },
  { label: 'ビタミンK',    key: 'vitamin_k',        unit: 'μg', goal: 90   },
  { label: 'ビタミンB1',   key: 'vitamin_b1',       unit: 'mg', goal: 0.8  },
  { label: 'ビタミンB2',   key: 'vitamin_b2',       unit: 'mg', goal: 0.9  },
  { label: 'ビタミンB6',   key: 'vitamin_b6',       unit: 'mg', goal: 0.8  },
  { label: 'ビタミンB12',  key: 'vitamin_b12',      unit: 'μg', goal: 1.3  },
  { label: 'ビタミンC',    key: 'vitamin_c',        unit: 'mg', goal: 60   },
  { label: 'ナイアシン',   key: 'niacin',           unit: 'mg', goal: 9    },
  { label: 'パントテン酸', key: 'pantothenic_acid', unit: 'mg', goal: 4    },
  { label: '葉酸',         key: 'folate',           unit: 'μg', goal: 140  },
  { label: 'ビオチン',     key: 'biotin',           unit: 'μg', goal: 30   },
]

const MINERAL_DRIS: DRI[] = [
  { label: 'カルシウム',     key: 'calcium',     unit: 'mg', goal: 600  },
  { label: 'リン',           key: 'phosphorus',  unit: 'mg', goal: 500  },
  { label: 'カリウム',       key: 'potassium',   unit: 'mg', goal: 1300 },
  { label: '硫黄',           key: 'sulfur',      unit: 'mg', goal: 700  },
  { label: '塩素',           key: 'chlorine',    unit: 'mg', goal: 2000 },
  { label: 'ナトリウム',     key: 'sodium',      unit: 'mg', goal: 800  },
  { label: 'マグネシウム',   key: 'magnesium',   unit: 'mg', goal: 130  },
  { label: '鉄',             key: 'iron',        unit: 'mg', goal: 5.5  },
  { label: '亜鉛',           key: 'zinc',        unit: 'mg', goal: 5    },
  { label: '銅',             key: 'copper',      unit: 'mg', goal: 0.4  },
  { label: 'マンガン',       key: 'manganese',   unit: 'mg', goal: 2.0  },
  { label: 'ヨウ素',         key: 'iodine',      unit: 'μg', goal: 90   },
  { label: 'セレン',         key: 'selenium',    unit: 'μg', goal: 20   },
  { label: 'モリブデン',     key: 'molybdenum',  unit: 'μg', goal: 15   },
  { label: 'クロム',         key: 'chromium',    unit: 'μg', goal: 10   },
  { label: 'コバルト',       key: 'cobalt',      unit: 'μg', goal: 0.1  },
]

// =====================================================================
// ユーティリティ
// =====================================================================
function calcAge(birthDate: string): number {
  const today = new Date()
  const birth = new Date(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`
}

function toChartLabel(dateStr: string) {
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}月`
}

function sumField(records: MealRecord[], key: keyof MealRecord): number {
  return records.reduce((acc, r) => acc + (Number(r[key]) || 0), 0)
}

// =====================================================================
// 成長グラフコンポーネント（既存）
// =====================================================================
function GrowthChart({ type, data, age, gender }: { type: MetricType; data: ChartPoint[]; age: number; gender: string | null }) {
  const ref = type === 'height' ? getRef(MHLW_HEIGHT, age, gender) : getRef(MHLW_WEIGHT, age, gender)
  const unit = type === 'height' ? 'cm' : 'kg'
  const color = type === 'height' ? '#FF6B35' : '#4CAF82'

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm flex flex-col items-center gap-2">
        <span className="text-3xl">{type === 'height' ? '📏' : '⚖️'}</span>
        <p className="text-sm text-gray-400">まだ記録がありません</p>
        <p className="text-xs text-gray-300">「記録追加」から入力してください</p>
      </div>
    )
  }

  const latest = data[0].value
  const prev = data.length > 1 ? data[1].value : null
  const diff = prev !== null ? (latest - prev).toFixed(1) : null
  const isUp = prev !== null ? latest >= prev : true

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs text-gray-400 mb-0.5">現在の{type === 'height' ? '身長' : '体重'}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-gray-800">{latest}</span>
            <span className="text-sm text-gray-400">{unit}</span>
            {diff !== null && (
              <div className={`flex items-center gap-0.5 text-xs font-medium ${isUp ? 'text-green-500' : 'text-red-400'}`}>
                {isUp ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                {Number(diff) >= 0 ? '+' : ''}{diff}{unit}
              </div>
            )}
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">厚労省平均（参考）</p>
          <p className="text-base font-semibold text-gray-500">{ref.avg}{unit}</p>
          <p className="text-xs text-gray-300">平均より {(latest - ref.avg).toFixed(1)}{unit}</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={[...data].reverse()} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
          <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
          <YAxis
            tick={{ fontSize: 10, fill: '#9ca3af' }}
            domain={[(dataMin: number) => Math.floor(dataMin - 2), (dataMax: number) => Math.ceil(dataMax + 2)]}
            axisLine={false} tickLine={false}
          />
          <Tooltip
            formatter={(value) => [`${value}${unit}`, type === 'height' ? '身長' : '体重']}
            labelStyle={{ color: '#374151', fontSize: 12, fontWeight: 600 }}
            contentStyle={{ borderRadius: '12px', border: '1px solid #f0f0f0', fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
          />
          <ReferenceLine y={ref.avg} stroke="#94a3b8" strokeDasharray="5 3" strokeWidth={1.5} />
          <ReferenceLine y={ref.p10} stroke="#e2e8f0" strokeDasharray="3 3" strokeWidth={1} />
          <ReferenceLine y={ref.p90} stroke="#e2e8f0" strokeDasharray="3 3" strokeWidth={1} />
          <Line
            type="monotone" dataKey="value" stroke={color} strokeWidth={3}
            dot={{ fill: color, r: 4, strokeWidth: 2, stroke: '#fff' }}
            activeDot={{ r: 7, fill: color, stroke: '#fff', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>

      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-50">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-px" style={{ borderTop: '2px dashed #94a3b8' }} />
          <span className="text-xs text-gray-400">平均</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-px bg-slate-200" />
          <span className="text-xs text-gray-400">10〜90パーセンタイル</span>
        </div>
      </div>
    </div>
  )
}

function PercentileBar({ value, type, age, gender }: { value: number; type: MetricType; age: number; gender: string | null }) {
  const refData = type === 'height' ? getRef(MHLW_HEIGHT, age, gender) : getRef(MHLW_WEIGHT, age, gender)
  const range = refData.p97 - refData.p3
  const pos = Math.max(0, Math.min(100, ((value - refData.p3) / range) * 100))
  let pLabel = ''
  if (value < refData.p3) pLabel = '3未満'
  else if (value < refData.p10) pLabel = '3〜10'
  else if (value < refData.avg) pLabel = '10〜50'
  else if (value < refData.p90) pLabel = '50〜90'
  else if (value < refData.p97) pLabel = '90〜97'
  else pLabel = '97超'

  return (
    <div className="mt-2">
      <div className="flex justify-between text-xs text-gray-300 mb-1">
        <span>3</span><span>10</span><span>25</span><span>50</span><span>75</span><span>90</span><span>97</span>
      </div>
      <div className="relative h-3 bg-gradient-to-r from-blue-100 via-green-100 to-blue-100 rounded-full">
        <div
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-orange-500 rounded-full border-2 border-white shadow-md transition-all duration-500"
          style={{ left: `calc(${pos}% - 8px)` }}
        />
      </div>
      <p className="text-xs text-center text-gray-500 mt-1.5">
        パーセンタイル: <span className="font-semibold text-orange-500">{pLabel}</span>
      </p>
    </div>
  )
}

// =====================================================================
// 栄養レポートコンポーネント
// =====================================================================

// カロリー棒グラフ（週: 曜日別 / 月: 週別）
function CalorieBarChart({ records, period }: { records: MealRecord[]; period: 'week' | 'month' }) {
  const data = useMemo(() => {
    const now = new Date()
    if (period === 'week') {
      const labels = ['月', '火', '水', '木', '金', '土', '日']
      const buckets = new Array(7).fill(0)
      const weekStart = new Date(now)
      const day = now.getDay() // 0=Sun
      weekStart.setDate(now.getDate() - ((day + 6) % 7)) // 月曜起算
      weekStart.setHours(0, 0, 0, 0)
      for (const r of records) {
        const d = new Date(r.recorded_at)
        const diff = Math.floor((d.getTime() - weekStart.getTime()) / 86400000)
        if (diff >= 0 && diff < 7) buckets[diff] += r.calories || 0
      }
      return labels.map((label, i) => ({ label, calories: Math.round(buckets[i]) }))
    } else {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      const labels = ['第1週', '第2週', '第3週', '第4週', '第5週']
      const buckets = new Array(5).fill(0)
      for (const r of records) {
        const d = new Date(r.recorded_at)
        if (d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear()) continue
        const weekIdx = Math.floor((d.getDate() - 1) / 7)
        if (weekIdx < 5) buckets[weekIdx] += r.calories || 0
      }
      // 今月の日数から実際の週を計算
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
      const weeksInMonth = Math.ceil(lastDay / 7)
      return labels.slice(0, weeksInMonth).map((label, i) => ({
        label,
        calories: Math.round(buckets[i]),
      }))
      void monthStart
    }
  }, [records, period])

  const maxCal = Math.max(...data.map(d => d.calories), 1)

  return (
    <div className="bg-gray-800 rounded-2xl p-4">
      <p className="text-xs font-semibold text-gray-400 mb-3">
        {period === 'week' ? '今週のカロリー（曜日別）' : '今月のカロリー（週別）'}
      </p>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data} margin={{ top: 4, right: 4, left: -28, bottom: 0 }} barSize={24}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} domain={[0, Math.ceil(maxCal * 1.2)]} />
          <Tooltip
            formatter={(v) => [`${v} kcal`, 'カロリー']}
            contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: '10px', fontSize: 12, color: '#fff' }}
            labelStyle={{ color: '#d1d5db', fontWeight: 600 }}
            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
          />
          <Bar dataKey="calories" radius={[6, 6, 0, 0]}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.calories > 0 ? '#f97316' : '#374151'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// PFC バランス横棒グラフ
function PFCBar({ records }: { records: MealRecord[] }) {
  const totalProtein = sumField(records, 'protein') * 4
  const totalCarbs   = sumField(records, 'carbs')   * 4
  const totalFat     = sumField(records, 'fat')     * 9
  const total = totalProtein + totalCarbs + totalFat

  if (total === 0) {
    return (
      <div className="bg-gray-800 rounded-2xl p-4">
        <p className="text-xs font-semibold text-gray-400 mb-2">PFCバランス</p>
        <p className="text-xs text-gray-600 text-center py-4">記録がありません</p>
      </div>
    )
  }

  const pPct = Math.round((totalProtein / total) * 100)
  const cPct = Math.round((totalCarbs   / total) * 100)
  const fPct = 100 - pPct - cPct

  return (
    <div className="bg-gray-800 rounded-2xl p-4">
      <p className="text-xs font-semibold text-gray-400 mb-3">PFCバランス（カロリー換算）</p>
      <div className="flex h-5 rounded-full overflow-hidden gap-0.5 mb-3">
        <div className="bg-blue-400 transition-all" style={{ width: `${pPct}%` }} />
        <div className="bg-yellow-400 transition-all" style={{ width: `${cPct}%` }} />
        <div className="bg-red-400 transition-all"  style={{ width: `${fPct}%` }} />
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'たんぱく質', pct: pPct, g: Math.round(sumField(records, 'protein') * 10) / 10, color: 'text-blue-400' },
          { label: '炭水化物',   pct: cPct, g: Math.round(sumField(records, 'carbs')   * 10) / 10, color: 'text-yellow-400' },
          { label: '脂質',       pct: fPct, g: Math.round(sumField(records, 'fat')     * 10) / 10, color: 'text-red-400' },
        ].map(item => (
          <div key={item.label} className="bg-gray-700/50 rounded-xl p-2.5 text-center">
            <p className={`text-lg font-bold ${item.color}`}>{item.pct}<span className="text-xs">%</span></p>
            <p className="text-xs text-gray-400">{item.label}</p>
            <p className="text-xs text-gray-500 mt-0.5">{item.g}g</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// カロリー目標達成率カード
function CalorieGoalCard({ records, period, age, gender }: {
  records: MealRecord[]; period: 'week' | 'month'; age: number; gender: string | null
}) {
  const isFemale = gender === '女の子'
  const dailyGoal = getCalorieGoal(age, isFemale)

  const { days, totalCals } = useMemo(() => {
    const now = new Date()
    const daySet = new Set<string>()
    let total = 0
    const cutoff = new Date(now)
    if (period === 'week') {
      cutoff.setDate(now.getDate() - 6); cutoff.setHours(0, 0, 0, 0)
    } else {
      cutoff.setDate(1); cutoff.setHours(0, 0, 0, 0)
    }
    for (const r of records) {
      const d = new Date(r.recorded_at)
      if (d >= cutoff) {
        daySet.add(d.toISOString().split('T')[0])
        total += r.calories || 0
      }
    }
    return { days: daySet.size, totalCals: Math.round(total) }
  }, [records, period])

  const avgCals = days > 0 ? Math.round(totalCals / days) : 0
  const pct = dailyGoal > 0 ? Math.min(120, Math.round((avgCals / dailyGoal) * 100)) : 0
  const color = pct < 70 ? '#60a5fa' : pct > 110 ? '#f87171' : '#4ade80'

  return (
    <div className="bg-gray-800 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-gray-400">目標カロリー達成率</p>
        <p className="text-xs text-gray-500">目標 {dailyGoal.toLocaleString()} kcal/日</p>
      </div>
      <div className="flex items-center gap-4">
        {/* 円形プログレス（SVG） */}
        <div className="relative w-16 h-16 shrink-0">
          <svg viewBox="0 0 36 36" className="w-16 h-16 -rotate-90">
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="#374151" strokeWidth="3" />
            <circle
              cx="18" cy="18" r="15.9" fill="none"
              stroke={color} strokeWidth="3"
              strokeDasharray={`${pct} ${100 - pct}`}
              strokeLinecap="round"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white">{pct}%</span>
        </div>
        <div className="flex-1">
          <div className="flex items-baseline gap-1 mb-0.5">
            <span className="text-2xl font-bold text-white">{avgCals.toLocaleString()}</span>
            <span className="text-xs text-gray-400">kcal/日 (平均)</span>
          </div>
          <p className="text-xs text-gray-500">
            {period === 'week' ? '今週' : '今月'} {days}日記録 · 合計 {totalCals.toLocaleString()} kcal
          </p>
        </div>
      </div>
    </div>
  )
}

// 栄養素1行
function MicroRow({ dri, total }: { dri: DRI; total: number }) {
  const pct = dri.goal > 0 ? Math.min(100, Math.round((total / dri.goal) * 100)) : 0
  const hasData = total > 0
  const barColor = pct >= 80 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-red-400'
  const display = total < 10 ? (Math.round(total * 100) / 100).toString()
    : total < 100 ? (Math.round(total * 10) / 10).toString()
    : Math.round(total).toString()

  return (
    <div className="flex items-center gap-2 py-1.5 border-b border-gray-700/50 last:border-0">
      <p className="text-xs text-gray-300 w-24 shrink-0">{dri.label}</p>
      <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
        {hasData && <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />}
      </div>
      <div className="text-right w-20 shrink-0">
        <span className="text-xs font-medium text-white">{hasData ? `${display} ${dri.unit}` : '–'}</span>
        {hasData && <span className="text-xs text-gray-500 ml-1">({pct}%)</span>}
      </div>
    </div>
  )
}

// ビタミン・ミネラル一覧
function MicroNutrientGrid({ records }: { records: MealRecord[] }) {
  const totals = useMemo(() => {
    const out: Record<string, number> = {}
    const allDris = [...VITAMIN_DRIS, ...MINERAL_DRIS]
    for (const dri of allDris) {
      out[dri.key as string] = sumField(records, dri.key)
    }
    return out
  }, [records])

  return (
    <div className="flex flex-col gap-3">
      {/* ビタミン */}
      <div className="bg-gray-800 rounded-2xl p-4">
        <p className="text-xs font-semibold text-gray-400 mb-2">ビタミン（13種）</p>
        {VITAMIN_DRIS.map(dri => (
          <MicroRow key={dri.key as string} dri={dri} total={totals[dri.key as string] ?? 0} />
        ))}
      </div>
      {/* ミネラル */}
      <div className="bg-gray-800 rounded-2xl p-4">
        <p className="text-xs font-semibold text-gray-400 mb-2">ミネラル（16種）</p>
        {MINERAL_DRIS.map(dri => (
          <MicroRow key={dri.key as string} dri={dri} total={totals[dri.key as string] ?? 0} />
        ))}
      </div>
    </div>
  )
}

// =====================================================================
// メインページ
// =====================================================================
export default function GrowthPage() {
  const [mainTab, setMainTab] = useState<'growth' | 'nutrition'>('growth')
  const [activeMetric, setActiveMetric] = useState<MetricType>('height')
  const [selectedChild, setSelectedChild] = useState(0)
  const [showAddModal, setShowAddModal] = useState(false)
  const [children, setChildren] = useState<Child[]>([])
  const [records, setRecords] = useState<GrowthRecord[]>([])
  const [loadingRecords, setLoadingRecords] = useState(false)

  // 栄養タブ
  const [nutritionPeriod, setNutritionPeriod] = useState<'week' | 'month'>('week')
  const [mealRecords, setMealRecords] = useState<MealRecord[]>([])
  const [loadingMeal, setLoadingMeal] = useState(false)

  // 記録追加フォーム
  const [addDate, setAddDate] = useState(new Date().toISOString().split('T')[0])
  const [addHeight, setAddHeight] = useState('')
  const [addWeight, setAddWeight] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/children')
      .then(r => r.json())
      .then(d => setChildren(d.children ?? []))
      .catch(console.error)
  }, [])

  // 成長記録取得
  useEffect(() => {
    const child = children[selectedChild]
    if (!child) return
    setLoadingRecords(true)
    fetch(`/api/growth-records?childId=${child.id}`)
      .then(r => r.json())
      .then(d => setRecords(d.records ?? []))
      .catch(console.error)
      .finally(() => setLoadingRecords(false))
  }, [children, selectedChild])

  // 食事記録取得（栄養タブ用）
  useEffect(() => {
    if (mainTab !== 'nutrition') return
    const child = children[selectedChild]
    if (!child) return
    setLoadingMeal(true)
    fetch(`/api/meal-records?childId=${child.id}`)
      .then(r => r.json())
      .then(d => setMealRecords(d.records ?? []))
      .catch(console.error)
      .finally(() => setLoadingMeal(false))
  }, [mainTab, children, selectedChild])

  const heightData: ChartPoint[] = records
    .filter(r => r.height !== null)
    .map(r => ({ label: toChartLabel(r.recorded_at), value: r.height! }))

  const weightData: ChartPoint[] = records
    .filter(r => r.weight !== null)
    .map(r => ({ label: toChartLabel(r.recorded_at), value: r.weight! }))

  const chartData = activeMetric === 'height' ? heightData : weightData
  const currentChild = children[selectedChild] ?? null
  const currentAge = currentChild ? calcAge(currentChild.birth_date) : 6
  const currentGender = currentChild?.gender ?? null
  const latestHeight = heightData[0]?.value ?? null
  const latestWeight = weightData[0]?.value ?? null
  const bmi = latestHeight && latestWeight
    ? (latestWeight / ((latestHeight / 100) ** 2)).toFixed(1)
    : null

  // 栄養タブ用: 期間フィルタ
  const filteredMealRecords = useMemo(() => {
    const now = new Date()
    const cutoff = new Date(now)
    if (nutritionPeriod === 'week') {
      cutoff.setDate(now.getDate() - 6); cutoff.setHours(0, 0, 0, 0)
    } else {
      cutoff.setDate(1); cutoff.setHours(0, 0, 0, 0)
    }
    return mealRecords.filter(r => new Date(r.recorded_at) >= cutoff)
  }, [mealRecords, nutritionPeriod])

  const handleAddRecord = async () => {
    const child = children[selectedChild]
    if (!child || (!addHeight && !addWeight)) return
    setSaving(true)
    const res = await fetch('/api/growth-records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ childId: child.id, recordedAt: addDate, height: addHeight || null, weight: addWeight || null }),
    })
    const data = await res.json()
    if (data.record) setRecords(p => [data.record, ...p])
    setAddHeight(''); setAddWeight('')
    setShowAddModal(false); setSaving(false)
  }

  return (
    <div className={`flex flex-col min-h-screen ${mainTab === 'nutrition' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* ヘッダー */}
      <div className={`px-4 pt-12 pb-3 border-b ${mainTab === 'nutrition' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
        <div className="flex items-center justify-between mb-3">
          <h1 className={`text-lg font-bold ${mainTab === 'nutrition' ? 'text-white' : 'text-gray-800'}`}>成長記録</h1>
          {mainTab === 'growth' && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 bg-orange-500 text-white text-sm font-medium px-3.5 py-2 rounded-full shadow-sm shadow-orange-200 active:scale-95 transition-transform"
            >
              <Plus className="w-4 h-4" />記録追加
            </button>
          )}
        </div>

        {/* メインタブ */}
        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-2xl p-1 mb-3">
          <button
            onClick={() => setMainTab('growth')}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 transition-all ${
              mainTab === 'growth' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />成長
          </button>
          <button
            onClick={() => setMainTab('nutrition')}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 transition-all ${
              mainTab === 'nutrition' ? 'bg-orange-500 text-white shadow-sm' : 'text-gray-500'
            }`}
          >
            <Salad className="w-3.5 h-3.5" />栄養
          </button>
        </div>

        {/* 子供セレクター */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
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
                    : mainTab === 'nutrition'
                      ? 'bg-gray-800 text-gray-300 border-gray-700'
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

      {/* ===== 成長タブ ===== */}
      {mainTab === 'growth' && (
        <>
          <div className="px-4 pt-4 pb-2">
            <div className="flex bg-white rounded-2xl p-1 border border-gray-100 shadow-sm">
              <button
                onClick={() => setActiveMetric('height')}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeMetric === 'height' ? 'bg-orange-500 text-white shadow-sm' : 'text-gray-400'}`}
              >📏 身長</button>
              <button
                onClick={() => setActiveMetric('weight')}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeMetric === 'weight' ? 'bg-green-500 text-white shadow-sm' : 'text-gray-400'}`}
              >⚖️ 体重</button>
            </div>
          </div>

          {loadingRecords ? (
            <div className="px-4 pb-3">
              <div className="h-48 bg-gray-100 rounded-2xl animate-pulse" />
            </div>
          ) : (
            <>
              <div className="px-4 pb-3">
                <GrowthChart type={activeMetric} data={chartData} age={currentAge} gender={currentGender} />
              </div>
              {chartData.length > 0 && (
                <div className="px-4 pb-3">
                  <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                    <p className="text-xs font-semibold text-gray-500 mb-3">成長曲線上の位置（参考）</p>
                    <PercentileBar value={chartData[0].value} type={activeMetric} age={currentAge} gender={currentGender} />
                  </div>
                </div>
              )}
              <div className="px-4 pb-3">
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white rounded-2xl border border-gray-100 p-3 shadow-sm text-center">
                    <p className="text-xs text-gray-400 mb-1">身長</p>
                    {latestHeight !== null
                      ? <><p className="text-xl font-bold text-orange-500">{latestHeight}</p><p className="text-xs text-gray-300">cm</p></>
                      : <p className="text-xs text-gray-300 mt-2">--</p>}
                  </div>
                  <div className="bg-white rounded-2xl border border-gray-100 p-3 shadow-sm text-center">
                    <p className="text-xs text-gray-400 mb-1">体重</p>
                    {latestWeight !== null
                      ? <><p className="text-xl font-bold text-green-500">{latestWeight}</p><p className="text-xs text-gray-300">kg</p></>
                      : <p className="text-xs text-gray-300 mt-2">--</p>}
                  </div>
                  <div className="bg-white rounded-2xl border border-gray-100 p-3 shadow-sm text-center">
                    <p className="text-xs text-gray-400 mb-1">BMI</p>
                    {bmi !== null
                      ? <><p className="text-xl font-bold text-blue-500">{bmi}</p><p className="text-xs text-gray-300">計算値</p></>
                      : <p className="text-xs text-gray-300 mt-2">--</p>}
                  </div>
                </div>
              </div>
              <div className="px-4 pb-6">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-50">
                    <p className="text-sm font-semibold text-gray-700">記録履歴</p>
                  </div>
                  {records.length === 0 ? (
                    <div className="px-4 py-6 text-center">
                      <p className="text-sm text-gray-400">まだ記録がありません</p>
                    </div>
                  ) : (
                    records.map((rec) => (
                      <div key={rec.id} className="flex items-center justify-between px-4 py-3 border-b border-gray-50 last:border-0">
                        <span className="text-xs text-gray-400">{formatDate(rec.recorded_at)}</span>
                        <div className="flex gap-6">
                          {rec.height !== null && <span className="text-sm font-medium text-orange-500">{rec.height} cm</span>}
                          {rec.weight !== null && <span className="text-sm font-medium text-green-500">{rec.weight} kg</span>}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* ===== 栄養タブ ===== */}
      {mainTab === 'nutrition' && (
        <div className="flex-1 px-4 py-4 flex flex-col gap-4 pb-28">
          {/* 週/月トグル */}
          <div className="flex bg-gray-800 rounded-xl p-1">
            {(['week', 'month'] as const).map(p => (
              <button
                key={p}
                onClick={() => setNutritionPeriod(p)}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                  nutritionPeriod === p ? 'bg-orange-500 text-white shadow' : 'text-gray-400'
                }`}
              >
                {p === 'week' ? '今週' : '今月'}
              </button>
            ))}
          </div>

          {loadingMeal ? (
            <div className="flex-1 flex items-center justify-center py-16">
              <div className="w-7 h-7 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredMealRecords.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16">
              <Flame className="w-10 h-10 text-gray-700" />
              <p className="text-sm text-gray-500">この期間の食事記録がありません</p>
            </div>
          ) : (
            <>
              {/* カロリー棒グラフ */}
              <CalorieBarChart records={filteredMealRecords} period={nutritionPeriod} />

              {/* 目標達成率 */}
              <CalorieGoalCard
                records={filteredMealRecords}
                period={nutritionPeriod}
                age={currentAge}
                gender={currentGender}
              />

              {/* PFCバランス */}
              <PFCBar records={filteredMealRecords} />

              {/* ビタミン・ミネラル */}
              <div>
                <p className="text-xs text-gray-500 mb-2 px-1">
                  ※ 対象期間の合計値。DRI目標は6〜7歳男性基準（参考値）
                </p>
                <MicroNutrientGrid records={filteredMealRecords} />
              </div>
            </>
          )}
        </div>
      )}

      {/* 記録追加モーダル */}
      {showAddModal && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setShowAddModal(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl max-w-lg mx-auto">
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-800">成長記録を追加</h3>
              <button onClick={() => setShowAddModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <div className="px-6 py-4 flex flex-col gap-4">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">日付</label>
                <input
                  type="date" value={addDate} onChange={e => setAddDate(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs font-medium text-gray-500 mb-1.5 block">身長 (cm)</label>
                  <input type="number" placeholder="例: 110.5" step="0.1"
                    value={addHeight} onChange={e => setAddHeight(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs font-medium text-gray-500 mb-1.5 block">体重 (kg)</label>
                  <input type="number" placeholder="例: 18.0" step="0.1"
                    value={addWeight} onChange={e => setAddWeight(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                  />
                </div>
              </div>
              <button
                onClick={handleAddRecord}
                disabled={saving || (!addHeight && !addWeight)}
                className="w-full bg-orange-500 text-white font-semibold py-3.5 rounded-xl active:scale-95 transition-transform shadow-sm shadow-orange-200 disabled:opacity-40"
              >
                {saving ? '保存中...' : '記録する'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
