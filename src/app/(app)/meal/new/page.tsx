'use client'

import { useState, useEffect, useRef, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronLeft, Search, PenLine, Camera, X, Check, Loader2, Upload } from 'lucide-react'

// ---- 日本食品標準成分表ベース（よく使う食品 50 品目） ----
type Food = {
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  portion: string
  category: string
}

const FOOD_DB: Food[] = [
  // 主食
  { name: 'ごはん（茶碗1杯）', calories: 252, protein: 3.8, carbs: 55.7, fat: 0.5, portion: '150g', category: '主食' },
  { name: 'パン（食パン1枚）', calories: 158, protein: 5.6, carbs: 28.0, fat: 2.6, portion: '60g', category: '主食' },
  { name: 'うどん（1玉）', calories: 231, protein: 6.1, carbs: 47.5, fat: 0.8, portion: '200g', category: '主食' },
  { name: 'ラーメン（1杯）', calories: 472, protein: 18.0, carbs: 68.0, fat: 14.0, portion: '500g', category: '主食' },
  { name: 'そば（1玉）', calories: 268, protein: 12.0, carbs: 51.7, fat: 1.8, portion: '200g', category: '主食' },
  { name: 'パスタ（1人前）', calories: 374, protein: 13.2, carbs: 73.1, fat: 1.8, portion: '200g', category: '主食' },
  { name: 'おにぎり（1個）', calories: 176, protein: 2.8, carbs: 38.5, fat: 0.3, portion: '100g', category: '主食' },
  { name: 'コーンフレーク（1食）', calories: 143, protein: 3.0, carbs: 32.0, fat: 0.6, portion: '40g', category: '主食' },

  // 主菜（肉・魚・卵・大豆）
  { name: '卵（1個）', calories: 76, protein: 6.2, carbs: 0.2, fat: 5.1, portion: '60g', category: '主菜' },
  { name: '鶏むね肉（100g）', calories: 108, protein: 22.3, carbs: 0.0, fat: 1.5, portion: '100g', category: '主菜' },
  { name: '鶏もも肉（100g）', calories: 190, protein: 17.3, carbs: 0.0, fat: 13.0, portion: '100g', category: '主菜' },
  { name: '豚バラ肉（100g）', calories: 386, protein: 13.4, carbs: 0.1, fat: 34.0, portion: '100g', category: '主菜' },
  { name: '牛もも肉（100g）', calories: 182, protein: 21.2, carbs: 0.3, fat: 9.6, portion: '100g', category: '主菜' },
  { name: 'サーモン（1切れ）', calories: 133, protein: 20.5, carbs: 0.1, fat: 4.1, portion: '80g', category: '主菜' },
  { name: 'さば（1切れ）', calories: 202, protein: 17.0, carbs: 0.0, fat: 13.5, portion: '100g', category: '主菜' },
  { name: 'まぐろ刺身（5切れ）', calories: 108, protein: 23.5, carbs: 0.0, fat: 1.4, portion: '80g', category: '主菜' },
  { name: 'えび（5尾）', calories: 60, protein: 13.6, carbs: 0.1, fat: 0.3, portion: '70g', category: '主菜' },
  { name: '豆腐（半丁）', calories: 72, protein: 6.5, carbs: 1.5, fat: 4.1, portion: '150g', category: '主菜' },
  { name: '納豆（1パック）', calories: 100, protein: 8.3, carbs: 5.4, fat: 5.4, portion: '50g', category: '主菜' },
  { name: 'ウインナー（3本）', calories: 191, protein: 6.5, carbs: 3.1, fat: 16.8, portion: '60g', category: '主菜' },

  // 副菜（野菜）
  { name: 'にんじん（中1本）', calories: 30, protein: 0.7, carbs: 6.8, fat: 0.1, portion: '100g', category: '副菜' },
  { name: 'ほうれん草（1束）', calories: 20, protein: 2.2, carbs: 3.1, fat: 0.4, portion: '100g', category: '副菜' },
  { name: 'ブロッコリー（1/2房）', calories: 37, protein: 4.3, carbs: 5.2, fat: 0.5, portion: '100g', category: '副菜' },
  { name: 'トマト（中1個）', calories: 19, protein: 0.7, carbs: 3.9, fat: 0.1, portion: '100g', category: '副菜' },
  { name: 'きゅうり（1本）', calories: 13, protein: 1.0, carbs: 2.4, fat: 0.1, portion: '100g', category: '副菜' },
  { name: 'キャベツ（1/8個）', calories: 23, protein: 1.3, carbs: 5.2, fat: 0.2, portion: '100g', category: '副菜' },
  { name: 'じゃがいも（中1個）', calories: 84, protein: 1.6, carbs: 19.7, fat: 0.1, portion: '100g', category: '副菜' },
  { name: 'たまねぎ（中1/2個）', calories: 33, protein: 1.0, carbs: 7.6, fat: 0.1, portion: '100g', category: '副菜' },
  { name: 'えだまめ（50g）', calories: 68, protein: 5.8, carbs: 4.5, fat: 3.0, portion: '50g', category: '副菜' },
  { name: 'コーン缶（1/2缶）', calories: 77, protein: 2.9, carbs: 15.9, fat: 1.2, portion: '80g', category: '副菜' },

  // 乳製品
  { name: '牛乳（1杯）', calories: 122, protein: 6.6, carbs: 9.6, fat: 6.9, portion: '200ml', category: '乳製品' },
  { name: 'ヨーグルト（1個）', calories: 65, protein: 3.4, carbs: 7.9, fat: 2.0, portion: '100g', category: '乳製品' },
  { name: 'チーズ（スライス1枚）', calories: 68, protein: 4.1, carbs: 0.4, fat: 5.2, portion: '20g', category: '乳製品' },
  { name: 'バター（1かけ）', calories: 74, protein: 0.1, carbs: 0.0, fat: 8.2, portion: '10g', category: '乳製品' },

  // 果物
  { name: 'バナナ（1本）', calories: 93, protein: 1.1, carbs: 22.5, fat: 0.2, portion: '100g', category: '果物' },
  { name: 'りんご（1/2個）', calories: 56, protein: 0.2, carbs: 15.5, fat: 0.2, portion: '100g', category: '果物' },
  { name: 'みかん（1個）', calories: 45, protein: 0.7, carbs: 11.1, fat: 0.1, portion: '100g', category: '果物' },
  { name: 'いちご（5粒）', calories: 34, protein: 0.9, carbs: 8.5, fat: 0.1, portion: '100g', category: '果物' },
  { name: 'ぶどう（1房）', calories: 69, protein: 0.4, carbs: 17.1, fat: 0.1, portion: '100g', category: '果物' },

  // おやつ・飲み物
  { name: 'せんべい（3枚）', calories: 112, protein: 2.3, carbs: 24.0, fat: 0.5, portion: '30g', category: 'おやつ' },
  { name: 'チョコレート（1かけ）', calories: 151, protein: 1.9, carbs: 17.1, fat: 8.6, portion: '25g', category: 'おやつ' },
  { name: 'ポテトチップス（1袋）', calories: 356, protein: 3.7, carbs: 33.0, fat: 22.0, portion: '60g', category: 'おやつ' },
  { name: 'アイスクリーム（1個）', calories: 180, protein: 3.6, carbs: 22.4, fat: 8.0, portion: '100g', category: 'おやつ' },
  { name: 'プリン（1個）', calories: 116, protein: 4.5, carbs: 15.9, fat: 4.5, portion: '100g', category: 'おやつ' },
  { name: 'ジュース（1杯）', calories: 46, protein: 0.2, carbs: 11.4, fat: 0.0, portion: '100ml', category: 'おやつ' },

  // 汁物・その他
  { name: '味噌汁（1杯）', calories: 31, protein: 2.1, carbs: 3.1, fat: 1.0, portion: '180ml', category: 'その他' },
  { name: 'ツナ缶（1缶）', calories: 97, protein: 15.7, carbs: 0.3, fat: 2.5, portion: '70g', category: 'その他' },
  { name: 'マヨネーズ（大さじ1）', calories: 84, protein: 0.3, carbs: 0.4, fat: 9.1, portion: '12g', category: 'その他' },
]

const MEAL_TYPES = [
  { key: 'breakfast', label: '朝食', icon: '🌅' },
  { key: 'lunch',     label: '昼食', icon: '☀️' },
  { key: 'dinner',    label: '夕食', icon: '🌙' },
  { key: 'snack',     label: 'おやつ', icon: '🍪' },
] as const

type MealTypeKey = typeof MEAL_TYPES[number]['key']
type TabKey = 'search' | 'manual' | 'ai'

type NutrientForm = {
  foodName: string
  calories: string
  protein: string
  carbs: string
  fat: string
}

const EMPTY_FORM: NutrientForm = { foodName: '', calories: '', protein: '', carbs: '', fat: '' }

// ---- 検索タブ ----
function SearchTab({ onSelect }: { onSelect: (f: NutrientForm) => void }) {
  const [query, setQuery] = useState('')
  const results = query.trim().length >= 1
    ? FOOD_DB.filter(f => f.name.includes(query))
    : FOOD_DB.slice(0, 20)

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="食品名を入力（例: ごはん、卵）"
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-700 bg-gray-800 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
        {query && (
          <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        )}
      </div>
      <p className="text-xs text-gray-500">{query ? `「${query}」の検索結果 ${results.length}件` : '人気の食品'}</p>
      <div className="flex flex-col gap-1.5 max-h-80 overflow-y-auto">
        {results.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-6">見つかりませんでした</p>
        ) : (
          results.map((food, i) => (
            <button
              key={i}
              onClick={() => onSelect({
                foodName: food.name,
                calories: String(food.calories),
                protein: String(food.protein),
                carbs: String(food.carbs),
                fat: String(food.fat),
              })}
              className="flex items-center justify-between p-3 rounded-xl bg-gray-800 border border-gray-700 hover:border-orange-500 active:scale-[0.98] transition-all text-left"
            >
              <div>
                <p className="text-sm font-medium text-white">{food.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{food.portion} · {food.category}</p>
              </div>
              <div className="text-right shrink-0 ml-3">
                <p className="text-sm font-bold text-orange-400">{food.calories}kcal</p>
                <p className="text-xs text-gray-500">P:{food.protein}g C:{food.carbs}g F:{food.fat}g</p>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  )
}

// ---- 手入力タブ ----
function ManualTab({ form, onChange }: { form: NutrientForm; onChange: (f: NutrientForm) => void }) {
  const set = (k: keyof NutrientForm, v: string) => onChange({ ...form, [k]: v })
  return (
    <div className="flex flex-col gap-3">
      <div>
        <label className="text-xs font-medium text-gray-400 mb-1.5 block">食品名 *</label>
        <input
          type="text" placeholder="例: ハンバーグ" value={form.foodName}
          onChange={e => set('foodName', e.target.value)}
          className="w-full border border-gray-700 bg-gray-800 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-gray-400 mb-1.5 block">カロリー (kcal)</label>
          <input type="number" placeholder="例: 300" step="1" value={form.calories}
            onChange={e => set('calories', e.target.value)}
            className="w-full border border-gray-700 bg-gray-800 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-400 mb-1.5 block">たんぱく質 (g)</label>
          <input type="number" placeholder="例: 20" step="0.1" value={form.protein}
            onChange={e => set('protein', e.target.value)}
            className="w-full border border-gray-700 bg-gray-800 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-400 mb-1.5 block">炭水化物 (g)</label>
          <input type="number" placeholder="例: 40" step="0.1" value={form.carbs}
            onChange={e => set('carbs', e.target.value)}
            className="w-full border border-gray-700 bg-gray-800 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-400 mb-1.5 block">脂質 (g)</label>
          <input type="number" placeholder="例: 10" step="0.1" value={form.fat}
            onChange={e => set('fat', e.target.value)}
            className="w-full border border-gray-700 bg-gray-800 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
      </div>
    </div>
  )
}

// ---- AI 認識タブ ----
function AiTab({ onResult }: { onResult: (f: NutrientForm) => void }) {
  const [preview, setPreview] = useState<string | null>(null)
  const [base64, setBase64] = useState<string | null>(null)
  const [mediaType, setMediaType] = useState<string>('image/jpeg')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [recognized, setRecognized] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback((file: File) => {
    setError('')
    setRecognized(false)
    const reader = new FileReader()
    reader.onload = e => {
      const dataUrl = e.target?.result as string
      setPreview(dataUrl)
      const b64 = dataUrl.split(',')[1]
      setBase64(b64)
      setMediaType(file.type || 'image/jpeg')
    }
    reader.readAsDataURL(file)
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const handleRecognize = async () => {
    if (!base64) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/ai-food-recognize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, mediaType }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'エラーが発生しました')
      const r = data.result
      if (!r?.foodName) throw new Error('食品を認識できませんでした')
      onResult({
        foodName: r.foodName ?? '',
        calories: r.calories != null ? String(r.calories) : '',
        protein: r.protein != null ? String(r.protein) : '',
        carbs: r.carbs != null ? String(r.carbs) : '',
        fat: r.fat != null ? String(r.fat) : '',
      })
      setRecognized(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* 画像アップロードエリア */}
      <div
        onClick={() => inputRef.current?.click()}
        className="relative w-full aspect-video rounded-2xl border-2 border-dashed border-gray-600 flex flex-col items-center justify-center cursor-pointer hover:border-orange-500 transition-colors overflow-hidden"
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="preview" className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-2 text-gray-500">
            <Upload className="w-8 h-8" />
            <p className="text-sm">タップして写真を選択</p>
            <p className="text-xs text-gray-600">JPEG / PNG / WebP</p>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleInputChange}
          className="hidden"
        />
      </div>

      {preview && !recognized && (
        <button
          onClick={handleRecognize}
          disabled={loading}
          className="w-full py-3.5 bg-orange-500 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 transition-transform"
        >
          {loading
            ? <><Loader2 className="w-4 h-4 animate-spin" />認識中...</>
            : <><Camera className="w-4 h-4" />AIで食品を認識</>
          }
        </button>
      )}

      {recognized && (
        <div className="flex items-center gap-2 bg-green-900/30 border border-green-700 rounded-xl px-4 py-3">
          <Check className="w-4 h-4 text-green-400 shrink-0" />
          <p className="text-sm text-green-300">認識完了！下の「手入力」タブで確認・修正できます</p>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-400 text-center bg-red-900/20 border border-red-800 rounded-xl px-4 py-3">{error}</p>
      )}

      <p className="text-xs text-gray-600 text-center">
        ※ AI認識はClaudeが行います。栄養値は目安です
      </p>
    </div>
  )
}

// ---- メインページ（Suspenseでラップが必要なためinner componentに分離） ----
function MealNewInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialMeal = (searchParams.get('meal') ?? 'breakfast') as MealTypeKey

  const [children, setChildren] = useState<{ id: string; name: string; avatar: string }[]>([])
  const [selectedChildIndex, setSelectedChildIndex] = useState(0)
  const [mealType, setMealType] = useState<MealTypeKey>(initialMeal)
  const [activeTab, setActiveTab] = useState<TabKey>('search')
  const [form, setForm] = useState<NutrientForm>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [recordedAt, setRecordedAt] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    fetch('/api/children')
      .then(r => r.json())
      .then(d => setChildren(d.children ?? []))
      .catch(console.error)
  }, [])

  const handleSearchSelect = (f: NutrientForm) => {
    setForm(f)
    setActiveTab('manual')
  }

  const handleAiResult = (f: NutrientForm) => {
    setForm(f)
    setActiveTab('manual')
  }

  const canSave = form.foodName.trim().length > 0

  const handleSave = async () => {
    if (!canSave || children.length === 0) return
    setSaving(true)
    setSaveError('')
    const child = children[selectedChildIndex]
    try {
      const res = await fetch('/api/meal-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childId: child.id,
          mealType,
          foodName: form.foodName,
          calories: form.calories || null,
          protein: form.protein || null,
          carbs: form.carbs || null,
          fat: form.fat || null,
          recordedAt: `${recordedAt}T00:00:00.000Z`,
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error ?? '保存に失敗しました')
      }
      router.push('/home')
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : '保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const TABS: { key: TabKey; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
    { key: 'search', label: '検索', Icon: Search },
    { key: 'manual', label: '手入力', Icon: PenLine },
    { key: 'ai',     label: 'AI認識', Icon: Camera },
  ]

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* ヘッダー */}
      <div className="sticky top-0 z-10 bg-gray-900 border-b border-gray-800 px-4 pt-12 pb-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-800">
          <ChevronLeft className="w-5 h-5 text-gray-300" />
        </button>
        <h1 className="text-base font-bold">食事を記録</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-5 pb-36">
        {/* 子供選択 */}
        {children.length > 0 && (
          <div>
            <p className="text-xs font-medium text-gray-400 mb-2">記録する子供</p>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {children.map((c, i) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedChildIndex(i)}
                  className={`shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium border transition-all ${
                    selectedChildIndex === i
                      ? 'bg-orange-500 text-white border-orange-500'
                      : 'bg-gray-800 text-gray-300 border-gray-700'
                  }`}
                >
                  <span>{c.avatar}</span>{c.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 食事の種類 */}
        <div>
          <p className="text-xs font-medium text-gray-400 mb-2">食事の種類</p>
          <div className="grid grid-cols-4 gap-2">
            {MEAL_TYPES.map(m => (
              <button
                key={m.key}
                onClick={() => setMealType(m.key)}
                className={`py-2.5 rounded-xl flex flex-col items-center gap-0.5 text-xs font-semibold border transition-all ${
                  mealType === m.key
                    ? 'bg-orange-500 border-orange-500 text-white'
                    : 'bg-gray-800 border-gray-700 text-gray-400'
                }`}
              >
                <span className="text-lg">{m.icon}</span>
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* 日付 */}
        <div>
          <p className="text-xs font-medium text-gray-400 mb-2">日付</p>
          <input
            type="date"
            value={recordedAt}
            onChange={e => setRecordedAt(e.target.value)}
            className="w-full border border-gray-700 bg-gray-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        {/* タブ切り替え */}
        <div>
          <div className="flex bg-gray-800 rounded-xl p-1 mb-4">
            {TABS.map(({ key, label, Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === key ? 'bg-orange-500 text-white shadow' : 'text-gray-400'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>

          {activeTab === 'search' && <SearchTab onSelect={handleSearchSelect} />}
          {activeTab === 'manual' && <ManualTab form={form} onChange={setForm} />}
          {activeTab === 'ai' && <AiTab onResult={handleAiResult} />}
        </div>

        {/* 入力内容プレビュー（食品名が入力済みのとき） */}
        {form.foodName && (
          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-gray-400">入力内容</p>
              <button onClick={() => setForm(EMPTY_FORM)} className="text-xs text-gray-500 underline">クリア</button>
            </div>
            <p className="font-semibold text-white mb-2">{form.foodName}</p>
            <div className="flex gap-3 text-xs text-gray-400">
              {form.calories && <span>🔥 {form.calories}kcal</span>}
              {form.protein && <span>P {form.protein}g</span>}
              {form.carbs && <span>C {form.carbs}g</span>}
              {form.fat && <span>F {form.fat}g</span>}
            </div>
          </div>
        )}
      </div>

      {/* 保存ボタン（固定フッター） */}
      <div className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto px-4 pb-8 pt-3 bg-gray-900 border-t border-gray-800">
        {saveError && <p className="text-xs text-red-400 text-center mb-2">{saveError}</p>}
        <button
          onClick={handleSave}
          disabled={!canSave || saving || children.length === 0}
          className="w-full py-4 bg-orange-500 text-white rounded-2xl font-bold text-base shadow-lg shadow-orange-900/40 disabled:opacity-40 active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
        >
          {saving ? <><Loader2 className="w-5 h-5 animate-spin" />保存中...</> : '記録する'}
        </button>
      </div>
    </div>
  )
}

export default function MealNewPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-900" />}>
      <MealNewInner />
    </Suspense>
  )
}
