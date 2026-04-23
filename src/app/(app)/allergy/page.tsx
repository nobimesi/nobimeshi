'use client'

import { useState, useEffect } from 'react'
import { Plus, X, Star, AlertTriangle, ShieldCheck } from 'lucide-react'

type Child = {
  id: string
  name: string
  avatar: string
}

type Restriction = {
  id: string
  food_name: string
  restriction_type: 'allergy' | 'dislike'
  severity: 'mild' | 'moderate' | 'severe' | null
  overcome_count: number
}

const SEVERITY_CONFIG = {
  mild:     { label: '軽度', bgColor: 'bg-yellow-50', textColor: 'text-yellow-700', badgeBg: 'bg-yellow-100', border: 'border-yellow-200' },
  moderate: { label: '中度', bgColor: 'bg-orange-50', textColor: 'text-orange-700', badgeBg: 'bg-orange-100', border: 'border-orange-200' },
  severe:   { label: '重度', bgColor: 'bg-red-50',    textColor: 'text-red-700',    badgeBg: 'bg-red-100',    border: 'border-red-200' },
}

const COMMON_ALLERGENS = [
  { name: '卵', emoji: '🥚' },
  { name: '乳', emoji: '🥛' },
  { name: '小麦', emoji: '🌾' },
  { name: 'えび', emoji: '🦐' },
  { name: 'かに', emoji: '🦀' },
  { name: '落花生', emoji: '🥜' },
  { name: 'そば', emoji: '🍜' },
  { name: 'くるみ', emoji: '🌰' },
  { name: '大豆', emoji: '🫘' },
  { name: '魚', emoji: '🐟' },
]

const STAMPS_NEEDED = 5

export default function AllergyPage() {
  const [activeTab, setActiveTab] = useState<'allergy' | 'disliked'>('allergy')
  const [selectedChild, setSelectedChild] = useState(0)
  const [children, setChildren] = useState<Child[]>([])
  const [restrictions, setRestrictions] = useState<Restriction[]>([])
  const [loadingRestrictions, setLoadingRestrictions] = useState(false)

  const [showAddAllergy, setShowAddAllergy] = useState(false)
  const [showAddDisliked, setShowAddDisliked] = useState(false)
  const [newAllergyName, setNewAllergyName] = useState('')
  const [newAllergySeverity, setNewAllergySeverity] = useState<'mild' | 'moderate' | 'severe'>('mild')
  const [newDislikedName, setNewDislikedName] = useState('')

  // 子供一覧を取得
  useEffect(() => {
    fetch('/api/children')
      .then(r => r.json())
      .then(d => setChildren(d.children ?? []))
      .catch(console.error)
  }, [])

  // 選択した子供の food_restrictions を取得
  useEffect(() => {
    const child = children[selectedChild]
    if (!child) return
    setLoadingRestrictions(true)
    fetch(`/api/food-restrictions?childId=${child.id}`)
      .then(r => r.json())
      .then(d => setRestrictions(d.restrictions ?? []))
      .catch(console.error)
      .finally(() => setLoadingRestrictions(false))
  }, [children, selectedChild])

  const currentChild = children[selectedChild]
  const allergies = restrictions.filter(r => r.restriction_type === 'allergy')
  const dislikedFoods = restrictions.filter(r => r.restriction_type === 'dislike')
  const severeCount = allergies.filter(a => a.severity === 'severe').length

  const addRestriction = async (foodName: string, type: 'allergy' | 'dislike', severity?: 'mild' | 'moderate' | 'severe') => {
    if (!currentChild) return
    const res = await fetch('/api/food-restrictions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ childId: currentChild.id, foodName, type, severity }),
    })
    const data = await res.json()
    if (data.restriction) {
      setRestrictions(p => [...p, data.restriction])
    }
  }

  const removeRestriction = async (id: string) => {
    await fetch(`/api/food-restrictions?id=${id}`, { method: 'DELETE' })
    setRestrictions(p => p.filter(r => r.id !== id))
  }

  const addStamp = async (id: string) => {
    const res = await fetch('/api/food-restrictions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    const data = await res.json()
    setRestrictions(p => p.map(r => {
      if (r.id !== id) return r
      const newCount = data.overcome_count ?? r.overcome_count + 1
      return { ...r, overcome_count: newCount }
    }))
  }

  return (
    <div className="flex flex-col bg-gray-50 min-h-screen">
      {/* ヘッダー */}
      <div className="bg-white px-4 pt-12 pb-4 border-b border-gray-100">
        <div className="mb-3">
          <h1 className="text-lg font-bold text-gray-800">苦手・アレルギー管理</h1>
          <p className="text-xs text-gray-400 mt-0.5">登録した食材はレシピ提案から自動除外されます</p>
        </div>
        {/* 子供選択 */}
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
                    : 'bg-white text-gray-600 border-gray-200'
                }`}
              >
                <span>{c.avatar}</span>
                {c.name}
              </button>
            ))
          )}
        </div>
      </div>

      {/* タブ */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex bg-white rounded-2xl p-1 border border-gray-100 shadow-sm">
          <button
            onClick={() => setActiveTab('allergy')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'allergy' ? 'bg-red-500 text-white shadow-sm' : 'text-gray-400'
            }`}
          >
            ⚠️ アレルギー
          </button>
          <button
            onClick={() => setActiveTab('disliked')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'disliked' ? 'bg-orange-500 text-white shadow-sm' : 'text-gray-400'
            }`}
          >
            😣 苦手な食べ物
          </button>
        </div>
      </div>

      {loadingRestrictions && (
        <div className="px-4 py-2 flex flex-col gap-2">
          {[0, 1].map(i => <div key={i} className="h-16 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      )}

      {/* アレルギータブ */}
      {!loadingRestrictions && activeTab === 'allergy' && (
        <div className="px-4 pb-6">
          {severeCount > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-3.5 flex items-start gap-3 mb-3">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-red-600 mb-0.5">重度アレルギーが{severeCount}件登録されています</p>
                <p className="text-xs text-red-400">外食・学校給食では必ずスタッフに伝えてください</p>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2.5 mb-3">
            {allergies.map((a) => {
              const cfg = SEVERITY_CONFIG[a.severity ?? 'mild']
              return (
                <div key={a.id} className={`bg-white border ${cfg.border} rounded-2xl px-4 py-3.5 flex items-center justify-between shadow-sm`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 ${cfg.bgColor} rounded-xl flex items-center justify-center text-xl`}>
                      {COMMON_ALLERGENS.find(c => c.name === a.food_name)?.emoji ?? '🚫'}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{a.food_name}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${cfg.badgeBg} ${cfg.textColor} font-medium`}>
                        {cfg.label}アレルギー
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => removeRestriction(a.id)}
                    className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center"
                  >
                    <X className="w-3.5 h-3.5 text-gray-400" />
                  </button>
                </div>
              )
            })}
          </div>

          {/* よくあるアレルゲン */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-3 shadow-sm">
            <p className="text-xs font-semibold text-gray-500 mb-3">よくあるアレルゲン</p>
            <div className="flex flex-wrap gap-2">
              {COMMON_ALLERGENS.filter(a => !allergies.find(al => al.food_name === a.name)).map((item) => (
                <button
                  key={item.name}
                  onClick={() => addRestriction(item.name, 'allergy', 'mild')}
                  className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 text-gray-600 text-xs px-3 py-2 rounded-full hover:bg-orange-50 hover:border-orange-200 hover:text-orange-600 transition-colors"
                >
                  <span>{item.emoji}</span>+ {item.name}
                </button>
              ))}
            </div>
          </div>

          {/* カスタム追加 */}
          {showAddAllergy ? (
            <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm mb-3">
              <p className="text-sm font-semibold text-gray-700 mb-3">アレルギーを追加</p>
              <input
                type="text"
                placeholder="食材名を入力"
                value={newAllergyName}
                onChange={e => setNewAllergyName(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
              <p className="text-xs text-gray-500 mb-2">重症度</p>
              <div className="flex gap-2 mb-3">
                {(['mild', 'moderate', 'severe'] as const).map(sev => (
                  <button
                    key={sev}
                    onClick={() => setNewAllergySeverity(sev)}
                    className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                      newAllergySeverity === sev
                        ? 'bg-orange-500 text-white border-orange-500'
                        : 'bg-white text-gray-500 border-gray-200'
                    }`}
                  >
                    {SEVERITY_CONFIG[sev].label}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowAddAllergy(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-500">
                  キャンセル
                </button>
                <button
                  onClick={async () => {
                    if (!newAllergyName.trim()) return
                    await addRestriction(newAllergyName.trim(), 'allergy', newAllergySeverity)
                    setNewAllergyName('')
                    setShowAddAllergy(false)
                  }}
                  className="flex-1 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-semibold"
                >
                  追加する
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAddAllergy(true)}
              className="w-full py-3 border-2 border-dashed border-orange-200 rounded-xl flex items-center justify-center gap-2 text-sm text-orange-500 font-medium hover:bg-orange-50"
            >
              <Plus className="w-4 h-4" />
              その他のアレルギーを追加
            </button>
          )}
        </div>
      )}

      {/* 苦手タブ */}
      {!loadingRestrictions && activeTab === 'disliked' && (
        <div className="px-4 pb-6">
          <div className="bg-orange-50 border border-orange-100 rounded-2xl p-3.5 flex items-start gap-3 mb-3">
            <span className="text-xl shrink-0">🌟</span>
            <p className="text-xs text-orange-700 leading-relaxed">
              食べられたら「できた！」をタップしてスタンプを集めよう！{STAMPS_NEEDED}個集めると克服達成です🎉
            </p>
          </div>

          <div className="flex flex-col gap-3 mb-3">
            {dislikedFoods.map(food => {
              const overcame = food.overcome_count >= STAMPS_NEEDED
              return (
                <div
                  key={food.id}
                  className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${
                    overcame ? 'border-green-200' : 'border-gray-100'
                  }`}
                >
                  <div className={`flex items-center justify-between px-4 py-3 ${overcame ? 'bg-green-50' : ''}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${
                        overcame ? 'bg-green-100' : 'bg-gray-100'
                      }`}>
                        😣
                      </div>
                      <div>
                        <p className={`text-sm font-semibold ${overcame ? 'text-green-700' : 'text-gray-800'}`}>
                          {food.food_name}
                        </p>
                        {overcame ? (
                          <div className="flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-green-500" />
                            <span className="text-xs text-green-500 font-medium">克服済み！</span>
                          </div>
                        ) : (
                          <p className="text-xs text-gray-400">{food.overcome_count}/{STAMPS_NEEDED} スタンプ</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!overcame && (
                        <button
                          onClick={() => addStamp(food.id)}
                          className="flex items-center gap-1 bg-yellow-100 text-yellow-700 text-xs px-3 py-1.5 rounded-full border border-yellow-200 hover:bg-yellow-200 active:scale-95 transition-all font-medium"
                        >
                          <Star className="w-3.5 h-3.5" />
                          できた！
                        </button>
                      )}
                      <button
                        onClick={() => removeRestriction(food.id)}
                        className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center"
                      >
                        <X className="w-3.5 h-3.5 text-gray-400" />
                      </button>
                    </div>
                  </div>

                  {!overcame && (
                    <div className="px-4 pb-3 pt-1">
                      <div className="flex gap-1.5">
                        {Array.from({ length: STAMPS_NEEDED }).map((_, i) => (
                          <div
                            key={i}
                            className={`flex-1 h-2 rounded-full transition-all duration-300 ${
                              i < food.overcome_count ? 'bg-yellow-400' : 'bg-gray-100'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {showAddDisliked ? (
            <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm mb-3">
              <p className="text-sm font-semibold text-gray-700 mb-3">苦手な食べ物を追加</p>
              <input
                type="text"
                placeholder="食べ物の名前を入力"
                value={newDislikedName}
                onChange={e => setNewDislikedName(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
              <div className="flex gap-2">
                <button onClick={() => setShowAddDisliked(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-500">
                  キャンセル
                </button>
                <button
                  onClick={async () => {
                    if (!newDislikedName.trim()) return
                    await addRestriction(newDislikedName.trim(), 'dislike')
                    setNewDislikedName('')
                    setShowAddDisliked(false)
                  }}
                  className="flex-1 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-semibold"
                >
                  追加する
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAddDisliked(true)}
              className="w-full py-3 border-2 border-dashed border-orange-200 rounded-xl flex items-center justify-center gap-2 text-sm text-orange-500 font-medium hover:bg-orange-50"
            >
              <Plus className="w-4 h-4" />
              苦手な食べ物を追加
            </button>
          )}
        </div>
      )}
    </div>
  )
}
