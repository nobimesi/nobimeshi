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
  target_calories: number | null
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

// 年齢・性別別DRI目標値（日本人の食事摂取基準2020年版 参考値）
// インデックス: 0=1-2歳, 1=3-5歳, 2=6-7歳, 3=8-9歳, 4=10-11歳, 5=12-14歳, 6=15-17歳, 7=18歳以上
// 各エントリ: [男性, 女性]
const DRI_BY_AGE: Partial<Record<keyof MealRecord, [number, number][]>> = {
  vitamin_a:        [[300,250],[350,350],[400,400],[500,500],[600,600],[800,700],[900,650],[900,700]],
  vitamin_d:        [[3.0,3.0],[3.5,3.5],[4.5,4.5],[5.0,5.0],[6.5,6.5],[8.0,8.0],[9.0,8.5],[8.5,8.5]],
  vitamin_e:        [[3.0,3.0],[4.0,4.0],[5.0,5.0],[5.0,5.0],[5.5,5.5],[7.0,6.0],[7.5,6.0],[6.0,6.0]],
  vitamin_k:        [[50,50],[60,60],[90,90],[110,110],[140,140],[170,150],[160,150],[150,150]],
  vitamin_b1:       [[0.5,0.5],[0.7,0.7],[0.8,0.8],[1.0,0.9],[1.2,1.1],[1.4,1.3],[1.5,1.2],[1.4,1.1]],
  vitamin_b2:       [[0.6,0.5],[0.8,0.8],[0.9,0.9],[1.1,1.0],[1.4,1.3],[1.6,1.4],[1.7,1.4],[1.6,1.2]],
  vitamin_b6:       [[0.5,0.5],[0.6,0.6],[0.8,0.8],[0.9,0.9],[1.1,1.1],[1.4,1.3],[1.5,1.3],[1.4,1.1]],
  vitamin_b12:      [[0.9,0.9],[1.1,1.1],[1.3,1.3],[1.6,1.6],[1.9,1.9],[2.4,2.4],[2.4,2.4],[2.4,2.4]],
  vitamin_c:        [[40,40],[50,50],[60,60],[70,70],[85,85],[100,100],[100,100],[100,100]],
  niacin:           [[5,5],[7,7],[9,9],[11,11],[13,13],[15,14],[17,13],[15,12]],
  pantothenic_acid: [[3,3],[4,4],[4,4],[5,5],[6,5],[7,6],[7,6],[5,5]],
  folate:           [[90,90],[110,110],[140,140],[160,160],[190,190],[240,240],[240,240],[240,240]],
  biotin:           [[20,20],[25,25],[30,30],[35,35],[40,40],[50,50],[50,50],[50,50]],
  calcium:          [[450,400],[600,550],[600,550],[650,750],[700,750],[1000,800],[800,650],[800,650]],
  phosphorus:       [[500,500],[800,600],[800,600],[900,900],[1100,1000],[1200,1100],[1200,900],[1000,800]],
  potassium:        [[900,900],[1100,1100],[1300,1200],[1500,1400],[1800,1700],[2400,2200],[2800,2600],[2600,2000]],
  sodium:           [[600,600],[700,700],[800,750],[900,850],[1000,950],[1100,1000],[1100,1000],[1500,1500]],
  magnesium:        [[70,70],[100,100],[130,130],[170,160],[210,220],[290,290],[360,310],[370,290]],
  iron:             [[4.5,4.5],[5.5,5.0],[5.5,5.5],[7.0,7.0],[8.5,8.5],[10.0,10.0],[10.0,10.5],[7.5,10.5]],
  zinc:             [[3,3],[4,4],[5,5],[6,6],[7,7],[9,8],[10,8],[11,8]],
  copper:           [[0.3,0.3],[0.4,0.4],[0.5,0.5],[0.5,0.5],[0.6,0.6],[0.8,0.7],[1.0,0.8],[0.9,0.7]],
  manganese:        [[1.5,1.5],[1.5,1.5],[2.0,2.0],[2.5,2.5],[3.0,3.0],[3.5,3.0],[4.0,3.5],[4.0,3.5]],
  iodine:           [[50,50],[60,60],[90,90],[90,90],[110,110],[140,140],[140,140],[130,130]],
  selenium:         [[15,15],[20,20],[20,20],[25,25],[30,30],[40,35],[45,40],[30,25]],
  molybdenum:       [[10,10],[10,10],[15,15],[15,15],[20,20],[25,25],[30,25],[30,25]],
  sulfur:           [[700,700],[700,700],[700,700],[700,700],[700,700],[700,700],[700,700],[700,700]],
  chlorine:         [[2000,2000],[2000,2000],[2000,2000],[2000,2000],[2000,2000],[2000,2000],[2000,2000],[2000,2000]],
  chromium:         [[10,10],[10,10],[10,10],[10,10],[10,10],[10,10],[10,10],[10,10]],
  cobalt:           [[0.1,0.1],[0.1,0.1],[0.1,0.1],[0.1,0.1],[0.1,0.1],[0.1,0.1],[0.1,0.1],[0.1,0.1]],
}

function getAgeDri(key: keyof MealRecord, age: number, isFemale: boolean): number {
  const bracket = age <= 2 ? 0 : age <= 5 ? 1 : age <= 7 ? 2 : age <= 9 ? 3 : age <= 11 ? 4 : age <= 14 ? 5 : age <= 17 ? 6 : 7
  const row = DRI_BY_AGE[key]
  if (!row) return 0
  return row[bracket][isFemale ? 1 : 0]
}

function fmtNum(v: number): string {
  if (v <= 0) return '0'
  if (v < 1) return String(Math.round(v * 100) / 100)
  if (v < 100) return String(Math.round(v * 10) / 10)
  return String(Math.round(v))
}

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
  type, records, onClose, age, isFemale,
}: {
  type: 'vitamin' | 'mineral'; records: MealRecord[]; onClose: () => void
  age: number; isFemale: boolean
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
          {dris.map(({ key, label, unit }) => {
            const goal = getAgeDri(key, age, isFemale)
            const total = records.reduce((s, r) => s + (Number(r[key]) || 0), 0)
            const pct = goal > 0 ? Math.min(100, Math.round((total / goal) * 100)) : 0
            const hasData = total > 0
            const barColor = pct >= 80 ? 'bg-green-400' : pct >= 50 ? 'bg-yellow-400' : 'bg-red-300'
            return (
              <div key={key as string} className="flex items-center gap-2 py-2 border-b border-gray-50 last:border-0">
                <span className="text-xs text-gray-600 w-24 shrink-0">{label}</span>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  {hasData && <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />}
                </div>
                <div className="text-right w-28 shrink-0">
                  <span className="text-xs font-medium text-gray-700">
                    {hasData ? fmtNum(total) : '–'}
                  </span>
                  <span className="text-xs text-gray-400">
                    {unit} / {fmtNum(goal)}{unit}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
        <p className="text-xs text-gray-300 text-center pb-4 pt-1 shrink-0">
          ※ {age}歳{isFemale ? '女児' : '男児'}基準（参考値・食事摂取基準2020年版）
        </p>
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

// たんぱく質推奨量（日本人食事摂取基準2020年版）[男性, 女性] g/日
const PROTEIN_GOAL: [number, number][] = [
  [20,20],[25,25],[30,30],[40,40],[45,45],[60,55],[65,55],[65,50]
]
function getProteinGoal(age: number, isFemale: boolean): number {
  const idx = age<=2?0:age<=5?1:age<=7?2:age<=9?3:age<=11?4:age<=14?5:age<=17?6:7
  return PROTEIN_GOAL[idx][isFemale?1:0]
}

// ── アレルゲンフィルタリングヘルパー ─────────────────────────────────────────
function buildForbiddenSet(allergies: string[]): Set<string> {
  const set = new Set<string>()
  for (const a of allergies) {
    const lower = a.toLowerCase()
    set.add(lower)
    if (lower.includes('乳') || lower.includes('ミルク') || lower === '牛乳') {
      for (const t of ['乳', '牛乳', 'ヨーグルト', 'チーズ', '乳製品']) set.add(t)
    }
    if (lower.includes('魚') || lower.includes('えび') || lower.includes('かに') || lower.includes('魚介')) {
      for (const t of ['魚', '鮭', 'しらす', '小魚', 'えび', 'かに', '魚介']) set.add(t)
    }
    if (lower.includes('大豆') || lower === '豆腐' || lower === '納豆') {
      for (const t of ['大豆', '豆腐', '豆類', '大豆製品', '納豆', '枝豆']) set.add(t)
    }
    if (lower.includes('肉')) {
      for (const t of ['肉', 'お肉', '赤身肉', '赤身のお肉']) set.add(t)
    }
    if (lower.includes('ナッツ') || lower.includes('くるみ') || lower.includes('アーモンド')) {
      for (const t of ['ナッツ', 'くるみ', 'アーモンド']) set.add(t)
    }
    if (lower.includes('卵') || lower.includes('玉子')) {
      for (const t of ['卵', '玉子']) set.add(t)
    }
  }
  return set
}

function safeFoodList(
  candidates: Array<{ text: string; tags: string[] }>,
  forbidden: Set<string>,
): string[] {
  return candidates
    .filter(c => !c.tags.some(tag => forbidden.has(tag)))
    .map(c => c.text)
}

// ルールベースのアドバイス生成（最大2件、優先度順）
function generateAdvice(
  totals: { calories: number; protein: number; carbs: number; fat: number },
  mealRecords: MealRecord[],
  kcalPct: number,
  childAge: number,
  childIsFemale: boolean,
  childName: string,
  allergies: string[] = [],
): string[] {
  const name = childName ? `${childName}ちゃん` : 'お子さん'
  const forbidden = buildForbiddenSet(allergies)

  // カロリーがほぼゼロなら記録を促すだけ
  if (kcalPct < 10) {
    return [`食事を記録すると、${name}に合ったアドバイスをお届けします📝`]
  }

  const getTotal = (key: keyof MealRecord) =>
    mealRecords.reduce((s, r) => s + (Number(r[key]) || 0), 0)

  const driPct = (key: keyof MealRecord) => {
    const goal = getAgeDri(key, childAge, childIsFemale)
    return goal > 0 ? (getTotal(key) / goal) * 100 : 100
  }

  const issues: { priority: number; msg: string }[] = []

  // ── カロリーオーバー ──
  if (kcalPct > 115) {
    issues.push({ priority: 1, msg: `カロリーが目標を超えています。揚げ物や甘い飲み物を少し控えて、野菜や魚を中心にしてみましょう🥗` })
  }

  // ── たんぱく質（筋肉・免疫）──
  const proteinGoal = getProteinGoal(childAge, childIsFemale)
  const proteinPct = proteinGoal > 0 ? (totals.protein / proteinGoal) * 100 : 100
  if (proteinPct < 55) {
    const foods = safeFoodList([
      { text: 'お肉', tags: ['お肉', '肉'] },
      { text: '魚', tags: ['魚'] },
      { text: '卵', tags: ['卵', '玉子'] },
      { text: '豆腐', tags: ['豆腐', '大豆'] },
    ], forbidden)
    const src = foods.length > 0 ? `${foods.join('・')}を取り入れると、` : ''
    issues.push({ priority: 2, msg: `たんぱく質が少なめです。${src}${name}の筋肉と免疫力がアップします💪` })
  }

  // ── カルシウム（骨・身長）──
  const calcPct = driPct('calcium')
  if (calcPct < 55) {
    const foods = safeFoodList([
      { text: '牛乳', tags: ['牛乳', '乳'] },
      { text: 'ヨーグルト', tags: ['ヨーグルト', '乳'] },
      { text: 'チーズ', tags: ['チーズ', '乳'] },
      { text: '小魚', tags: ['小魚', '魚'] },
    ], forbidden)
    const src = foods.length > 0 ? foods.join('・') : '骨ごと食べられる食品'
    issues.push({ priority: 3, msg: `カルシウムが不足しています。${name}の骨や身長のために、${src}をプラスしてみて🦴` })
  }

  // ── 鉄（エネルギー・血液）──
  const ironPct = driPct('iron')
  if (ironPct < 50) {
    const foods = safeFoodList([
      { text: '赤身のお肉', tags: ['赤身のお肉', '肉', 'お肉'] },
      { text: 'ほうれん草', tags: ['ほうれん草'] },
      { text: '大豆製品', tags: ['大豆製品', '大豆', '豆腐'] },
    ], forbidden)
    const src = foods.length > 0 ? foods.join('・') : '鉄分の多い食品'
    issues.push({ priority: 4, msg: `鉄が少なめです。${src}で元気をチャージしましょう🥩` })
  }

  // ── ビタミンD（カルシウム吸収サポート）──
  const vitDPct = driPct('vitamin_d')
  if (vitDPct < 50 && calcPct < 80) {
    const foods = safeFoodList([
      { text: '鮭', tags: ['鮭', '魚'] },
      { text: 'しらす', tags: ['しらす', '魚'] },
      { text: 'きのこ類', tags: ['きのこ'] },
    ], forbidden)
    const src = foods.length > 0 ? foods.join('・') : 'きのこ類'
    issues.push({ priority: 5, msg: `ビタミンDを補うとカルシウムの吸収がアップ！${src}がおすすめです☀️` })
  }

  // ── 亜鉛（免疫・成長）──
  const zincPct = driPct('zinc')
  if (zincPct < 50) {
    const foods = safeFoodList([
      { text: '赤身肉', tags: ['赤身肉', '肉', 'お肉'] },
      { text: '豆類', tags: ['豆類', '大豆'] },
      { text: 'ナッツ', tags: ['ナッツ'] },
    ], forbidden)
    const src = foods.length > 0 ? foods.join('・') : '亜鉛を含む食品'
    issues.push({ priority: 6, msg: `亜鉛が不足しています。${name}の免疫力と成長のために、${src}を意識してみて🛡️` })
  }

  // ── ビタミンA（目・粘膜・免疫）──
  const vitAPct = driPct('vitamin_a')
  if (vitAPct < 45) {
    issues.push({ priority: 7, msg: `ビタミンAが少なめ。にんじん・ほうれん草・かぼちゃなど緑黄色野菜を一品加えましょう🥕` })
  }

  // ── ビタミンC（抗酸化・鉄吸収サポート）──
  const vitCPct = driPct('vitamin_c')
  if (vitCPct < 45) {
    issues.push({ priority: 8, msg: `ビタミンCが不足しています。野菜や果物をもう一品加えると鉄の吸収もアップします🍊` })
  }

  // ── 脂質バランス ──
  if (totals.calories > 300) {
    const fatKcalRatio = (totals.fat * 9) / totals.calories * 100
    if (fatKcalRatio > 35) {
      issues.push({ priority: 9, msg: `脂質が多めです。揚げ物を減らして、蒸し料理や焼き物に切り替えてみましょう🥦` })
    }
  }

  // 優先度順に最大2件
  issues.sort((a, b) => a.priority - b.priority)
  if (issues.length > 0) {
    return issues.slice(0, 2).map(i => i.msg)
  }

  // ── ポジティブフィードバック ──
  const allGood = proteinPct >= 75 && calcPct >= 75 && vitDPct >= 60
  if (kcalPct >= 80 && kcalPct <= 115 && allGood) {
    return [`今日は栄養バランスが優秀です！たんぱく質もカルシウムもしっかり摂れていて、${name}の成長をしっかり支えられていますね✨`]
  }
  if (kcalPct >= 80 && kcalPct <= 115) {
    return [`カロリーは目標通りです！引き続きいろいろな食品をバランスよく食べさせてあげましょう🌟`]
  }
  if (kcalPct < 80) {
    return [`まだ目標の${Math.round(kcalPct)}%です。残りの食事でしっかりエネルギーと栄養を補いましょう🍚`]
  }
  return [`バランスよく食べられています！${name}の体がぐんぐん成長しますね🌱`]
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
  const [childAllergies, setChildAllergies] = useState<string[]>([])

  useEffect(() => {
    fetch('/api/children')
      .then(r => r.json())
      .then(d => setChildren(d.children ?? []))
      .catch(console.error)
  }, [])

  useEffect(() => {
    const child = children[selectedChild]
    if (!child) { setChildAllergies([]); return }
    fetch(`/api/food-restrictions?childId=${child.id}`)
      .then(r => r.json())
      .then(d => {
        const names = (d.restrictions ?? [])
          .filter((r: { restriction_type: string }) => r.restriction_type === 'allergy')
          .map((r: { food_name: string }) => r.food_name as string)
        setChildAllergies(names)
      })
      .catch(() => setChildAllergies([]))
  }, [children, selectedChild])

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
  const childAge = child ? calcAge(child.birth_date) : 6
  const childIsFemale = child?.gender === '女の子'

  // 栄養素合計
  const totals = {
    calories: mealRecords.reduce((s, r) => s + (r.calories ?? 0), 0),
    protein:  mealRecords.reduce((s, r) => s + (r.protein ?? 0), 0),
    carbs:    mealRecords.reduce((s, r) => s + (r.carbs ?? 0), 0),
    fat:      mealRecords.reduce((s, r) => s + (r.fat ?? 0), 0),
  }
  const targetKcal = child?.target_calories ?? NUTRIENT_TARGETS[0].max
  const kcalRaw = Math.round((totals.calories / targetKcal) * 100)
  const kcalPct = Math.min(kcalRaw, 100) // 表示用（上限100%）

  // ビタミン・ミネラルの平均DRI達成率（%）
  const vitaminScore = calcMicroScore(mealRecords, VITAMIN_DRI)
  const mineralScore = calcMicroScore(mealRecords, MINERAL_DRI)

  const advice = generateAdvice(totals, mealRecords, kcalRaw, childAge, childIsFemale, child?.name ?? '', childAllergies)

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
            {child ? `・${child.name}ちゃん` : ''}
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
                <p className="text-xs font-bold text-orange-500 mb-1.5">今日の栄養アドバイス</p>
                <div className="flex flex-col gap-1.5">
                  {advice.map((line, i) => (
                    <p key={i} className="text-sm text-gray-700 leading-relaxed">{line}</p>
                  ))}
                </div>
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
          age={childAge}
          isFemale={childIsFemale}
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
