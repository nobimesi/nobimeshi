'use client'

import { useState } from 'react'
import {
  User, Plus, ChevronRight, MessageCircle,
  FileText, Shield, LogOut, Trash2, Edit3, X, Bell, HelpCircle,
  Sun, Moon, Monitor,
} from 'lucide-react'
import { useTheme, type Theme } from '@/components/ThemeProvider'

interface Child {
  id: number
  name: string
  emoji: string
  birthDate: string
  gender: string
  height: string
  weight: string
  activity: string
}

const INITIAL_CHILDREN: Child[] = [
  { id: 1, name: 'たろう', emoji: '👦', birthDate: '2018-04-15', gender: '男の子', height: '113.2', weight: '19.1', activity: '普通' },
  { id: 2, name: 'はなこ', emoji: '👧', birthDate: '2020-11-03', gender: '女の子', height: '97.5', weight: '14.2', activity: '少ない' },
]

function getAge(birthDate: string) {
  const birth = new Date(birthDate)
  const now = new Date()
  let age = now.getFullYear() - birth.getFullYear()
  const m = now.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--
  return age
}

function ChildForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Partial<Child>
  onSave: (data: Omit<Child, 'id'>) => void
  onCancel: () => void
}) {
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    emoji: initial?.emoji ?? '👦',
    birthDate: initial?.birthDate ?? '',
    gender: initial?.gender ?? '男の子',
    height: initial?.height ?? '',
    weight: initial?.weight ?? '',
    activity: initial?.activity ?? '普通',
  })
  const set = (k: keyof typeof form, v: string) => setForm(p => ({ ...p, [k]: v }))

  return (
    <div className="flex flex-col gap-4">
      {/* 絵文字選択 */}
      <div>
        <p className="text-xs font-medium text-gray-500 mb-2">アイコン</p>
        <div className="flex gap-2">
          {['👦', '👧', '🧒', '👶'].map(e => (
            <button
              key={e}
              onClick={() => set('emoji', e)}
              className={`w-12 h-12 rounded-xl text-2xl flex items-center justify-center border-2 transition-all ${
                form.emoji === e ? 'border-orange-500 bg-orange-50' : 'border-gray-200 bg-gray-50'
              }`}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-gray-500 mb-1.5 block">名前（ニックネームOK）</label>
        <input
          type="text" placeholder="例: たろう" value={form.name}
          onChange={e => set('name', e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
        />
      </div>

      <div>
        <label className="text-xs font-medium text-gray-500 mb-1.5 block">生年月日</label>
        <input
          type="date" value={form.birthDate}
          onChange={e => set('birthDate', e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
        />
      </div>

      <div>
        <label className="text-xs font-medium text-gray-500 mb-2 block">性別</label>
        <div className="flex gap-2">
          {['男の子', '女の子', 'その他'].map(g => (
            <button
              key={g}
              onClick={() => set('gender', g)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-semibold border transition-colors ${
                form.gender === g ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-500 border-gray-200'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <div className="flex-1">
          <label className="text-xs font-medium text-gray-500 mb-1.5 block">身長 (cm)</label>
          <input
            type="number" placeholder="113.2" step="0.1" value={form.height}
            onChange={e => set('height', e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
          />
        </div>
        <div className="flex-1">
          <label className="text-xs font-medium text-gray-500 mb-1.5 block">体重 (kg)</label>
          <input
            type="number" placeholder="19.1" step="0.1" value={form.weight}
            onChange={e => set('weight', e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-gray-500 mb-2 block">運動習慣</label>
        <div className="flex gap-2">
          {[
            { key: '少ない', icon: '🛋️' },
            { key: '普通', icon: '🚶' },
            { key: '多い', icon: '⚽' },
          ].map(a => (
            <button
              key={a.key}
              onClick={() => set('activity', a.key)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-semibold border transition-colors flex flex-col items-center gap-0.5 ${
                form.activity === a.key ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-500 border-gray-200'
              }`}
            >
              <span>{a.icon}</span>
              {a.key}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <button onClick={onCancel} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm text-gray-500 font-medium">
          キャンセル
        </button>
        <button
          onClick={() => {
            if (!form.name.trim()) return
            onSave(form)
          }}
          className="flex-1 py-3 bg-orange-500 text-white rounded-xl text-sm font-semibold shadow-sm shadow-orange-200 active:scale-95 transition-transform"
        >
          保存する
        </button>
      </div>
    </div>
  )
}

const THEME_OPTIONS: { value: Theme; label: string; desc: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { value: 'light',  label: 'ライト',         desc: '常に明るいテーマ',       Icon: Sun },
  { value: 'dark',   label: 'ダーク',         desc: '常に暗いテーマ',         Icon: Moon },
  { value: 'system', label: 'システム設定',   desc: 'OSの設定に合わせる',     Icon: Monitor },
]

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const [children, setChildren] = useState<Child[]>(INITIAL_CHILDREN)
  const [showAddChild, setShowAddChild] = useState(false)
  const [editChild, setEditChild] = useState<Child | null>(null)

  const menuGroups = [
    {
      title: 'サポート',
      items: [
        { icon: MessageCircle, label: 'お問い合わせ', color: 'text-blue-500', bg: 'bg-blue-50' },
        { icon: HelpCircle, label: 'よくある質問', color: 'text-purple-500', bg: 'bg-purple-50' },
        { icon: Bell, label: '通知設定', color: 'text-orange-500', bg: 'bg-orange-50' },
      ]
    },
    {
      title: '法的情報',
      items: [
        { icon: FileText, label: '利用規約', color: 'text-gray-500', bg: 'bg-gray-50' },
        { icon: Shield, label: 'プライバシーポリシー', color: 'text-gray-500', bg: 'bg-gray-50' },
      ]
    },
  ]

  return (
    <div className="flex flex-col bg-gray-50 min-h-screen">
      {/* ヘッダー */}
      <div className="bg-white px-4 pt-12 pb-4 border-b border-gray-100">
        <h1 className="text-lg font-bold text-gray-800">設定</h1>
      </div>

      {/* アカウント情報 */}
      <div className="px-4 pt-4 pb-2">
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-bold text-white">ゲストユーザー</p>
              <p className="text-xs text-orange-100">guest@example.com</p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-white/20 flex gap-4">
            <div className="text-center">
              <p className="text-white font-bold text-lg">{children.length}</p>
              <p className="text-orange-100 text-xs">登録中の子供</p>
            </div>
            <div className="text-center">
              <p className="text-white font-bold text-lg">14</p>
              <p className="text-orange-100 text-xs">記録日数</p>
            </div>
            <div className="text-center">
              <p className="text-white font-bold text-lg">52</p>
              <p className="text-orange-100 text-xs">食事記録数</p>
            </div>
          </div>
        </div>
      </div>

      {/* 子供プロフィール */}
      <div className="px-4 py-2">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2.5 px-1">子供のプロフィール</p>
        <div className="flex flex-col gap-2.5">
          {children.map((child) => (
            <div key={child.id} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center text-2xl">
                    {child.emoji}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{child.name}</p>
                    <p className="text-xs text-gray-400">{getAge(child.birthDate)}歳 · {child.gender}</p>
                    <p className="text-xs text-gray-400">{child.height}cm · {child.weight}kg · 運動:{child.activity}</p>
                  </div>
                </div>
                <button
                  onClick={() => setEditChild(child)}
                  className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center"
                >
                  <Edit3 className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </div>
          ))}

          <button
            onClick={() => setShowAddChild(true)}
            className="w-full py-3.5 border-2 border-dashed border-orange-200 rounded-2xl flex items-center justify-center gap-2 text-sm text-orange-500 font-medium hover:bg-orange-50"
          >
            <Plus className="w-4 h-4" />
            子供を追加
          </button>
        </div>
      </div>

      {/* テーマ設定 */}
      <div className="px-4 py-2">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2.5 px-1">テーマ</p>
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
          {THEME_OPTIONS.map((opt, i) => {
            const { Icon } = opt
            const isSelected = theme === opt.value
            return (
              <button
                key={opt.value}
                onClick={() => setTheme(opt.value)}
                className={`w-full flex items-center justify-between px-4 py-3.5 transition-colors border-b border-gray-50 last:border-0 ${
                  isSelected ? 'bg-orange-50' : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                    isSelected ? 'bg-orange-500' : 'bg-gray-100'
                  }`}>
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-gray-500'}`} />
                  </div>
                  <div className="text-left">
                    <p className={`text-sm font-medium ${isSelected ? 'text-orange-600' : 'text-gray-700'}`}>
                      {opt.label}
                    </p>
                    <p className="text-xs text-gray-400">{opt.desc}</p>
                  </div>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  isSelected ? 'border-orange-500' : 'border-gray-300'
                }`}>
                  {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* メニューグループ */}
      {menuGroups.map((group) => (
        <div key={group.title} className="px-4 py-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2.5 px-1">{group.title}</p>
          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
            {group.items.map((item, i) => {
              const Icon = item.icon
              return (
                <button
                  key={i}
                  className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 ${item.bg} rounded-xl flex items-center justify-center`}>
                      <Icon className={`w-4 h-4 ${item.color}`} />
                    </div>
                    <span className="text-sm text-gray-700">{item.label}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </button>
              )
            })}
          </div>
        </div>
      ))}

      {/* アカウント操作 */}
      <div className="px-4 py-2 pb-6">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2.5 px-1">アカウント</p>
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
          <button className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors border-b border-gray-50">
            <div className="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center">
              <LogOut className="w-4 h-4 text-gray-500" />
            </div>
            <span className="text-sm text-gray-700">サインアウト</span>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-red-50 transition-colors">
            <div className="w-8 h-8 bg-red-50 rounded-xl flex items-center justify-center">
              <Trash2 className="w-4 h-4 text-red-400" />
            </div>
            <span className="text-sm text-red-500">アカウントを削除</span>
          </button>
        </div>
      </div>

      <p className="text-center text-xs text-gray-300 pb-6">キッズミール v1.0.0</p>

      {/* モーダル */}
      {(showAddChild || editChild) && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => { setShowAddChild(false); setEditChild(null) }} />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl max-w-lg mx-auto max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-800">
                {editChild ? 'プロフィールを編集' : '子供を追加'}
              </h3>
              <button onClick={() => { setShowAddChild(false); setEditChild(null) }} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <div className="px-6 py-5">
              <ChildForm
                initial={editChild ?? undefined}
                onSave={(data) => {
                  if (editChild) {
                    setChildren(p => p.map(c => c.id === editChild.id ? { ...c, ...data } : c))
                    setEditChild(null)
                  } else {
                    setChildren(p => [...p, { id: Date.now(), ...data }])
                    setShowAddChild(false)
                  }
                }}
                onCancel={() => { setShowAddChild(false); setEditChild(null) }}
              />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
