'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'

type Child = {
  id: string
  name: string
  avatar: string
  birth_date: string
  gender: string | null
}

function calcAge(birthDate: string): number {
  const today = new Date()
  const birth = new Date(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

function greeting(): string {
  const h = new Date().getHours()
  if (h < 10) return 'おはよう'
  if (h < 17) return 'こんにちは'
  return 'おかえり'
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const [children, setChildren] = useState<Child[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/children')
      .then(r => r.json())
      .then(d => setChildren(d.children ?? []))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-slate-900 px-6 pt-14 pb-24">
      {/* あいさつ */}
      <div className="mb-8">
        <p className="text-slate-400 text-sm mb-1">
          {session?.user?.name ? `${session.user.name}さん、` : ''}
          {greeting()}！👋
        </p>
        <h1 className="text-2xl font-bold text-white">今日もいっしょに<br />栄養を管理しよう</h1>
      </div>

      {/* 子供カード */}
      {loading ? (
        <div className="flex flex-col gap-3">
          {[0, 1].map(i => (
            <div key={i} className="h-24 bg-slate-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : children.length === 0 ? (
        <div className="bg-slate-800 rounded-2xl p-6 text-center">
          <p className="text-slate-400 text-sm">お子様が登録されていません</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {children.map(child => (
            <div
              key={child.id}
              className="bg-slate-800 rounded-2xl p-5 flex items-center gap-4 border border-slate-700"
            >
              <div className="w-14 h-14 rounded-2xl bg-slate-700 flex items-center justify-center text-3xl shrink-0">
                {child.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-lg leading-tight">{child.name}</p>
                <p className="text-slate-400 text-sm mt-0.5">
                  {calcAge(child.birth_date)}歳
                  {child.gender ? `・${child.gender}` : ''}
                </p>
              </div>
              <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center shrink-0">
                <span className="text-orange-400 text-lg">→</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 今日の日付 */}
      <div className="mt-8 bg-slate-800 rounded-2xl p-4 border border-slate-700">
        <p className="text-slate-400 text-xs mb-1">今日</p>
        <p className="text-white font-bold text-base">
          {new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })}
        </p>
      </div>
    </div>
  )
}
