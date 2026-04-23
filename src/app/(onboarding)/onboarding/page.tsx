'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Loader2 } from 'lucide-react'

const TOTAL_STEPS = 7

const ALLERGEN_OPTIONS = [
  { name: '卵',    emoji: '🥚' },
  { name: '乳',    emoji: '🥛' },
  { name: '小麦',  emoji: '🌾' },
  { name: 'えび',  emoji: '🦐' },
  { name: 'かに',  emoji: '🦀' },
  { name: '落花生',emoji: '🥜' },
  { name: 'そば',  emoji: '🍜' },
  { name: 'なし',  emoji: '✅' },
]

type Form = {
  name: string
  birthDate: string
  gender: string
  height: string
  weight: string
  activity: string
  emoji: string
  allergies: string[]
  dislikedFoods: string[]
}

const INITIAL_FORM: Form = {
  name: '',
  birthDate: '',
  gender: '',
  height: '',
  weight: '',
  activity: '普通',
  emoji: '👦',
  allergies: [],
  dislikedFoods: [],
}

// ---------- ステップコンポーネント ----------

function StepName({ form, set }: { form: Form; set: (k: keyof Form, v: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => { inputRef.current?.focus() }, [])

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs font-semibold text-orange-400 mb-1 tracking-widest uppercase">Step 1</p>
        <h2 className="text-2xl font-bold text-white leading-snug">お子様のお名前を<br />教えてください</h2>
        <p className="text-sm text-slate-400 mt-2">ニックネームでもOKです</p>
      </div>
      <input
        ref={inputRef}
        type="text"
        placeholder="例：たろう"
        value={form.name}
        onChange={e => set('name', e.target.value)}
        className="w-full bg-slate-800 border border-slate-600 rounded-2xl px-4 py-4 text-white text-lg placeholder-slate-500 focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
      />
      <div className="flex gap-2">
        {(['👦', '👧', '🧒', '👶'] as const).map(e => (
          <button
            key={e}
            onClick={() => set('emoji', e)}
            className={`w-14 h-14 rounded-2xl text-3xl flex items-center justify-center border-2 transition-all ${
              form.emoji === e
                ? 'border-orange-400 bg-orange-500/20 scale-110'
                : 'border-slate-600 bg-slate-800'
            }`}
          >
            {e}
          </button>
        ))}
      </div>
    </div>
  )
}

function StepBirthDate({ form, set }: { form: Form; set: (k: keyof Form, v: string) => void }) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs font-semibold text-orange-400 mb-1 tracking-widest uppercase">Step 2</p>
        <h2 className="text-2xl font-bold text-white leading-snug">{form.name || 'お子様'}の<br />生年月日は？</h2>
        <p className="text-sm text-slate-400 mt-2">年齢に合わせた栄養バランスを計算します</p>
      </div>
      <input
        type="date"
        value={form.birthDate}
        onChange={e => set('birthDate', e.target.value)}
        max={new Date().toISOString().split('T')[0]}
        className="w-full bg-slate-800 border border-slate-600 rounded-2xl px-4 py-4 text-white text-lg focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400 [color-scheme:dark]"
      />
    </div>
  )
}

function StepGender({ form, set }: { form: Form; set: (k: keyof Form, v: string) => void }) {
  const options = [
    { value: '男の子', icon: '👦', color: 'from-blue-500/20 to-blue-600/20 border-blue-400' },
    { value: '女の子', icon: '👧', color: 'from-pink-500/20 to-pink-600/20 border-pink-400' },
    { value: 'その他', icon: '🧒', color: 'from-purple-500/20 to-purple-600/20 border-purple-400' },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs font-semibold text-orange-400 mb-1 tracking-widest uppercase">Step 3</p>
        <h2 className="text-2xl font-bold text-white leading-snug">性別を教えてください</h2>
        <p className="text-sm text-slate-400 mt-2">スキップして「その他」でも問題ありません</p>
      </div>
      <div className="flex flex-col gap-3">
        {options.map(o => (
          <button
            key={o.value}
            onClick={() => set('gender', o.value)}
            className={`w-full py-4 px-5 rounded-2xl border-2 flex items-center gap-4 transition-all ${
              form.gender === o.value
                ? `bg-gradient-to-r ${o.color} scale-[1.02]`
                : 'border-slate-600 bg-slate-800'
            }`}
          >
            <span className="text-3xl">{o.icon}</span>
            <span className={`text-lg font-bold ${form.gender === o.value ? 'text-white' : 'text-slate-300'}`}>
              {o.value}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

function StepBody({ form, set }: { form: Form; set: (k: keyof Form, v: string) => void }) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs font-semibold text-orange-400 mb-1 tracking-widest uppercase">Step 4</p>
        <h2 className="text-2xl font-bold text-white leading-snug">身長・体重を<br />教えてください</h2>
        <p className="text-sm text-slate-400 mt-2">任意です。後から設定画面で変更できます</p>
      </div>
      <div className="flex gap-4">
        <div className="flex-1">
          <label className="text-xs font-semibold text-slate-400 mb-2 block">身長 (cm)</label>
          <div className="relative">
            <input
              type="number"
              placeholder="110"
              step="0.1"
              min="30"
              max="200"
              value={form.height}
              onChange={e => set('height', e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 rounded-2xl px-4 py-4 text-white text-lg placeholder-slate-500 focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">cm</span>
          </div>
        </div>
        <div className="flex-1">
          <label className="text-xs font-semibold text-slate-400 mb-2 block">体重 (kg)</label>
          <div className="relative">
            <input
              type="number"
              placeholder="18"
              step="0.1"
              min="1"
              max="200"
              value={form.weight}
              onChange={e => set('weight', e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 rounded-2xl px-4 py-4 text-white text-lg placeholder-slate-500 focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">kg</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function StepActivity({ form, set }: { form: Form; set: (k: keyof Form, v: string) => void }) {
  const options = [
    { key: '少ない', icon: '🛋️', desc: 'あまり動かない' },
    { key: '普通',   icon: '🚶', desc: 'ほどほどに動く' },
    { key: '多い',   icon: '⚽', desc: 'よく動く・スポーツ' },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs font-semibold text-orange-400 mb-1 tracking-widest uppercase">Step 5</p>
        <h2 className="text-2xl font-bold text-white leading-snug">運動習慣は<br />どのくらいですか？</h2>
        <p className="text-sm text-slate-400 mt-2">必要カロリーの計算に使います</p>
      </div>
      <div className="flex flex-col gap-3">
        {options.map(o => (
          <button
            key={o.key}
            onClick={() => set('activity', o.key)}
            className={`w-full py-4 px-5 rounded-2xl border-2 flex items-center gap-4 transition-all ${
              form.activity === o.key
                ? 'border-orange-400 bg-orange-500/20 scale-[1.02]'
                : 'border-slate-600 bg-slate-800'
            }`}
          >
            <span className="text-3xl">{o.icon}</span>
            <div className="text-left">
              <p className={`text-lg font-bold ${form.activity === o.key ? 'text-white' : 'text-slate-300'}`}>
                {o.key}
              </p>
              <p className="text-xs text-slate-400">{o.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

function StepAllergy({ form, setForm }: { form: Form; setForm: React.Dispatch<React.SetStateAction<Form>> }) {
  const toggle = (name: string) => {
    if (name === 'なし') {
      setForm(p => ({ ...p, allergies: p.allergies.includes('なし') ? [] : ['なし'] }))
      return
    }
    setForm(p => {
      const without = p.allergies.filter(a => a !== 'なし')
      return {
        ...p,
        allergies: without.includes(name)
          ? without.filter(a => a !== name)
          : [...without, name],
      }
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs font-semibold text-orange-400 mb-1 tracking-widest uppercase">Step 6</p>
        <h2 className="text-2xl font-bold text-white leading-snug">アレルギーは<br />ありますか？</h2>
        <p className="text-sm text-slate-400 mt-2">複数選択できます。なければ「なし」を選んでください</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {ALLERGEN_OPTIONS.map(o => {
          const selected = form.allergies.includes(o.name)
          return (
            <button
              key={o.name}
              onClick={() => toggle(o.name)}
              className={`py-4 px-4 rounded-2xl border-2 flex items-center gap-3 transition-all ${
                selected
                  ? 'border-orange-400 bg-orange-500/20 scale-[1.02]'
                  : 'border-slate-600 bg-slate-800'
              }`}
            >
              <span className="text-2xl">{o.emoji}</span>
              <span className={`text-base font-bold ${selected ? 'text-white' : 'text-slate-300'}`}>{o.name}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function StepDisliked({ form, setForm }: { form: Form; setForm: React.Dispatch<React.SetStateAction<Form>> }) {
  const [input, setInput] = useState('')

  const add = () => {
    const v = input.trim()
    if (!v || form.dislikedFoods.includes(v)) return
    setForm(p => ({ ...p, dislikedFoods: [...p.dislikedFoods, v] }))
    setInput('')
  }

  const remove = (name: string) => {
    setForm(p => ({ ...p, dislikedFoods: p.dislikedFoods.filter(f => f !== name) }))
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs font-semibold text-orange-400 mb-1 tracking-widest uppercase">Step 7</p>
        <h2 className="text-2xl font-bold text-white leading-snug">苦手な食べ物は<br />ありますか？</h2>
        <p className="text-sm text-slate-400 mt-2">任意です。後から変更できます</p>
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
          placeholder="例：なす、ピーマン"
          className="flex-1 bg-slate-800 border border-slate-600 rounded-2xl px-4 py-3.5 text-white text-base placeholder-slate-500 focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
        />
        <button
          onClick={add}
          disabled={!input.trim()}
          className="px-4 py-3.5 bg-orange-500 text-white rounded-2xl font-bold disabled:opacity-40"
        >
          追加
        </button>
      </div>
      {form.dislikedFoods.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {form.dislikedFoods.map(f => (
            <div key={f} className="flex items-center gap-1.5 bg-slate-700 rounded-full px-3 py-1.5">
              <span className="text-white text-sm">😣 {f}</span>
              <button onClick={() => remove(f)} className="text-slate-400 hover:text-white ml-0.5">×</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ---------- メインページ ----------

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [direction, setDirection] = useState<'forward' | 'back'>('forward')
  const [animating, setAnimating] = useState(false)
  const [visible, setVisible] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState<Form>(INITIAL_FORM)

  const set = (k: keyof Form, v: string) => setForm(p => ({ ...p, [k]: v }))


  const canNext = () => {
    if (step === 1) return form.name.trim().length > 0
    if (step === 2) return form.birthDate.length > 0
    if (step === 3) return true // 性別はスキップ可
    return true
  }

  const navigate = (nextStep: number, dir: 'forward' | 'back') => {
    if (animating) return
    setDirection(dir)
    setAnimating(true)
    setVisible(false)

    setTimeout(() => {
      setStep(nextStep)
      setVisible(true)
      setAnimating(false)
    }, 200)
  }

  const handleNext = () => {
    if (!canNext()) return
    if (step < TOTAL_STEPS) {
      navigate(step + 1, 'forward')
    } else {
      handleSubmit()
    }
  }

  const handleBack = () => {
    if (step > 1) navigate(step - 1, 'back')
  }

  const handleSubmit = async () => {
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
        allergies: form.allergies.filter(a => a !== 'なし'),
        dislikedFoods: form.dislikedFoods,
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

  const slideClass = visible
    ? 'translate-x-0 opacity-100'
    : direction === 'forward'
      ? '-translate-x-8 opacity-0'
      : 'translate-x-8 opacity-0'

  return (
    <div className="flex flex-col min-h-screen bg-slate-900 px-6 pt-12 pb-8">
      {/* ヘッダー */}
      <div className="flex items-center gap-3 mb-8">
        {step > 1 ? (
          <button
            onClick={handleBack}
            className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 hover:bg-slate-700 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        ) : (
          <div className="w-10 h-10" />
        )}
        {/* プログレスバー */}
        <div className="flex-1 flex gap-1.5">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className="flex-1 h-1.5 rounded-full transition-all duration-300"
              style={{
                backgroundColor: i < step ? '#f97316' : '#334155',
              }}
            />
          ))}
        </div>
        <div className="w-10 text-right">
          <span className="text-xs text-slate-500">{step}/{TOTAL_STEPS}</span>
        </div>
      </div>

      {/* ステップコンテンツ */}
      <div
        className={`flex-1 transition-all duration-200 ease-out ${slideClass}`}
      >
        {step === 1 && <StepName form={form} set={set} />}
        {step === 2 && <StepBirthDate form={form} set={set} />}
        {step === 3 && <StepGender form={form} set={set} />}
        {step === 4 && <StepBody form={form} set={set} />}
        {step === 5 && <StepActivity form={form} set={set} />}
        {step === 6 && <StepAllergy form={form} setForm={setForm} />}
        {step === 7 && <StepDisliked form={form} setForm={setForm} />}
      </div>

      {/* エラー */}
      {error && (
        <p className="text-sm text-red-400 text-center bg-red-500/10 rounded-xl py-3 px-4 mb-4">
          {error}
        </p>
      )}

      {/* 次へボタン */}
      <button
        onClick={handleNext}
        disabled={!canNext() || loading}
        className="w-full py-4 bg-orange-500 text-white rounded-2xl font-bold text-base shadow-lg shadow-orange-500/30 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>保存中...</span>
          </>
        ) : step === TOTAL_STEPS ? (
          <span>はじめる 🎉</span>
        ) : (
          <span>次へ →</span>
        )}
      </button>

      {/* ステップ3以降はスキップ可 */}
      {(step === 3 || step === 4 || step === 6 || step === 7) && (
        <button
          onClick={handleNext}
          className="w-full py-3 text-slate-500 text-sm mt-2"
        >
          スキップ
        </button>
      )}
    </div>
  )
}
