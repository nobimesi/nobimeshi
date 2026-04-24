'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, TrendingUp, Plus, AlertCircle, Settings, Camera, PenLine, ChefHat, Refrigerator, X, BookOpen } from 'lucide-react'
import { useState } from 'react'

const NAV_ITEMS = [
  { href: '/home',     icon: Home,          label: 'ホーム' },
  { href: '/growth',   icon: TrendingUp,    label: '成長' },
  { href: '/input',    icon: null,          label: '入力' },
  { href: '/history',  icon: BookOpen,      label: '履歴' },
  { href: '/settings', icon: Settings,      label: '設定' },
]

const INPUT_MENU = [
  { href: '/input/scan',           icon: Camera,       label: '食べ物をスキャン', desc: '画像認識',    color: 'bg-orange-100 text-orange-500' },
  { href: '/meal/new',              icon: PenLine,      label: '手動で入力',       desc: '栄養素補完',  color: 'bg-blue-100 text-blue-500' },
  { href: '/input/recipe-consult', icon: ChefHat,      label: 'レシピ相談',       desc: '栄養アドバイス', color: 'bg-green-100 text-green-600' },
  { href: '/input/recipe-suggest', icon: Refrigerator, label: 'レシピ提案',       desc: '献立提案',    color: 'bg-purple-100 text-purple-500' },
]

export default function BottomNav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* 入力メニュー オーバーレイ */}
      {open && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="fixed bottom-20 left-0 right-0 z-50 px-5">
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-sm mx-auto">
              <div className="px-5 pt-4 pb-3 border-b border-gray-50">
                <p className="text-center text-xs font-semibold text-gray-400 tracking-wide uppercase">何を記録しますか？</p>
              </div>
              <div className="p-2">
                {INPUT_MENU.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-4 px-4 py-3.5 rounded-2xl hover:bg-gray-50 active:bg-gray-100 transition-colors"
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${item.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{item.label}</p>
                        <p className="text-xs text-gray-400">{item.desc}</p>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ナビバー */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-gray-100 dark:border-slate-700">
        <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
          {NAV_ITEMS.map((item) => {
            // プラスボタン（中央）
            if (item.href === '/input') {
              return (
                <button
                  key={item.href}
                  onClick={() => setOpen(v => !v)}
                  className="relative flex flex-col items-center justify-center -mt-5"
                >
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 ${
                    open
                      ? 'bg-gray-700 shadow-gray-300 rotate-45'
                      : 'bg-orange-500 shadow-orange-200'
                  }`}>
                    {open
                      ? <X className="w-6 h-6 text-white" strokeWidth={2.5} />
                      : <Plus className="w-7 h-7 text-white" strokeWidth={2.5} />
                    }
                  </div>
                </button>
              )
            }

            const Icon = item.icon!
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center gap-0.5 w-16 py-1"
              >
                <div className={`w-6 h-6 flex items-center justify-center transition-all ${isActive ? 'scale-110' : ''}`}>
                  <Icon
                    className={`w-5 h-5 transition-colors ${isActive ? 'text-orange-500' : 'text-gray-300'}`}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                </div>
                <span className={`text-xs transition-colors ${isActive ? 'text-orange-500 font-semibold' : 'text-gray-400'}`}>
                  {item.label}
                </span>
              </Link>
            )
          })}
        </div>
        {/* iPhoneのセーフエリア対応 */}
        <div className="h-safe-area-bottom bg-white" />
      </nav>
    </>
  )
}
