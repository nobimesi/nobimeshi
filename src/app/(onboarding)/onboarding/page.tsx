'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function OnboardingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    name: '',
    emoji: '👦',
    birthDate: '',
    gender: '男の子',
    height: '',
    weight: '',
    activity: '普通',
  })

  const set = (k: keyof typeof form, v: string) =>
    setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.birthDate) {
      setError('名前と生年月日を入力してください')
      return
    }
    setLoading(true)
    setError('')

    const res = await fetch('/api/children', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        birthDate: form.birthDate,
        gender: form.gender,
        height: form.height,
        weight: form.weight,
        activity: form.activity,
        emoji: form.emoji,
      }),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error || '保存に失敗しました')
      setLoading(false)
      return
    }

    router.replace('/home')
  }

  return (
    <div className="flex flex-col min-h-screen px-5 py-12">
      {/* ヘッダー */}
      <div className="flex flex-col items-center mb-8">
        <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-md shadow-orange-100 mb-4">
          <img src="/icon.png" alt="のびメシ" className="w-full h-full object-cover" />
        </div>
        <h1 className="text-xl font-bold text-gray-800">はじめまして！</h1>
        <p className="text-sm text-gray-500 mt-1 text-center">お子様の情報を登録しましょう</p>
      </div>

      <div className="flex flex-col gap-5 flex-1">
        {/* 絵文字アイコン */}
        <div>
          <p className="text-xs font-semibold text-gray-500 mb-2">アイコン</p>
          <div className="flex gap-2">
            {['👦', '👧', '🧒', '👶'].map(e => (
              <button
                key={e}
                onClick={() => set('emoji', e)}
                className={`w-14 h-14 rounded-2xl text-3xl flex items-center justify-center border-2 transition-all ${
                  form.emoji === e
                    ? 'border-orange-500 bg-orange-50 scale-105'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        {/* 名前 */}
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1.5 block">
            名前（ニックネームOK）<span className="text-red-400 ml-1">*</span>
          </label>
          <input
            type="text"
            placeholder="例：たろう"
            value={form.name}
            onChange={e => set('name', e.target.value)}
            className="w-full border border-gray-200 rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
          />
        </div>

        {/* 生年月日 */}
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1.5 block">
            生年月日<span className="text-red-400 ml-1">*</span>
          </label>
          <input
            type="date"
            value={form.birthDate}
            onChange={e => set('birthDate', e.target.value)}
            max={new Date().toISOString().split('T')[0]}
            className="w-full border border-gray-200 rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
          />
        </div>

        {/* 性別 */}
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-2 block">性別</label>
          <div className="flex gap-2">
            {['男の子', '女の子', 'その他'].map(g => (
              <button
                key={g}
                onClick={() => set('gender', g)}
                className={`flex-1 py-3 rounded-2xl text-sm font-semibold border-2 transition-colors ${
                  form.gender === g
                    ? 'bg-orange-500 text-white border-orange-500'
                    : 'bg-white text-gray-500 border-gray-200'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* 身長・体重 */}
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-xs font-semibold text-gray-500 mb-1.5 block">身長 (cm)</label>
            <input
              type="number"
              placeholder="例：110.5"
              step="0.1"
              min="30"
              max="200"
              value={form.height}
              onChange={e => set('height', e.target.value)}
              className="w-full border border-gray-200 rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
          </div>
          <div className="flex-1">
            <label className="text-xs font-semibold text-gray-500 mb-1.5 block">体重 (kg)</label>
            <input
              type="number"
              placeholder="例：18.0"
              step="0.1"
              min="1"
              max="200"
              value={form.weight}
              onChange={e => set('weight', e.target.value)}
              className="w-full border border-gray-200 rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
          </div>
        </div>

        {/* 運動習慣 */}
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-2 block">運動習慣</label>
          <div className="flex gap-2">
            {[
              { key: '少ない', icon: '🛋️', desc: 'あまり動かない' },
              { key: '普通',   icon: '🚶', desc: 'ほどほど' },
              { key: '多い',   icon: '⚽', desc: 'よく動く' },
            ].map(a => (
              <button
                key={a.key}
                onClick={() => set('activity', a.key)}
                className={`flex-1 py-3 rounded-2xl border-2 transition-colors flex flex-col items-center gap-0.5 ${
                  form.activity === a.key
                    ? 'bg-orange-500 text-white border-orange-500'
                    : 'bg-white text-gray-500 border-gray-200'
                }`}
              >
                <span className="text-xl">{a.icon}</span>
                <span className="text-xs font-semibold">{a.key}</span>
                <span className={`text-[10px] ${form.activity === a.key ? 'text-orange-100' : 'text-gray-400'}`}>
                  {a.desc}
                </span>
              </button>
            ))}
          </div>
        </div>

        {error && (
          <p className="text-xs text-red-500 text-center bg-red-50 rounded-xl py-2.5 px-4">{error}</p>
        )}

        {/* 送信ボタン */}
        <button
          onClick={handleSubmit}
          disabled={loading || !form.name.trim() || !form.birthDate}
          className="w-full py-4 bg-orange-500 text-white rounded-2xl font-bold text-base shadow-lg shadow-orange-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-transform mt-2"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
          {loading ? '保存中...' : 'はじめる 🎉'}
        </button>

        <p className="text-center text-xs text-gray-400 pb-4">
          身長・体重は後から設定画面で変更できます
        </p>
      </div>
    </div>
  )
}
