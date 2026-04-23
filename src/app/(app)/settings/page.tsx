'use client'

import { useState, useEffect } from 'react'
import {
  User, Plus, ChevronRight, MessageCircle,
  FileText, Shield, LogOut, Trash2, Edit3, X, Bell, HelpCircle,
  Sun, Moon, Monitor, Send, AlertTriangle, Check,
} from 'lucide-react'
import { signOut, useSession } from 'next-auth/react'
import { useTheme, type Theme } from '@/components/ThemeProvider'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Child {
  id: string
  name: string
  avatar: string
  birth_date: string
  gender: string | null
  activity_level: string | null
}

function getAge(birthDate: string) {
  const birth = new Date(birthDate)
  const now = new Date()
  let age = now.getFullYear() - birth.getFullYear()
  const m = now.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--
  return age
}

type ChildFormState = {
  id?: string
  name: string; emoji: string; birthDate: string
  gender: string; height: string; weight: string; activity: string
}

function ChildForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Partial<ChildFormState>
  onSave: (data: ChildFormState) => void
  onCancel: () => void
}) {
  const [form, setForm] = useState<ChildFormState>({
    name: initial?.name ?? '',
    emoji: initial?.emoji ?? '👦',
    birthDate: initial?.birthDate ?? '',
    gender: initial?.gender ?? '男の子',
    height: initial?.height ?? '',
    weight: initial?.weight ?? '',
    activity: initial?.activity ?? '普通',
  })

  // initial が変わったときに form を再初期化（同一インスタンスの再利用を防ぐ補完）
  useEffect(() => {
    setForm({
      name: initial?.name ?? '',
      emoji: initial?.emoji ?? '👦',
      birthDate: initial?.birthDate ?? '',
      gender: initial?.gender ?? '男の子',
      height: initial?.height ?? '',
      weight: initial?.weight ?? '',
      activity: initial?.activity ?? '普通',
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial?.id])

  const set = (k: keyof ChildFormState, v: string) => setForm(p => ({ ...p, [k]: v }))

  return (
    <div className="flex flex-col gap-4">
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
            type="number" placeholder="例: 110.5" step="0.1" value={form.height}
            onChange={e => set('height', e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
          />
        </div>
        <div className="flex-1">
          <label className="text-xs font-medium text-gray-500 mb-1.5 block">体重 (kg)</label>
          <input
            type="number" placeholder="例: 18.0" step="0.1" value={form.weight}
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
        <button type="button" onClick={onCancel} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm text-gray-500 font-medium">
          キャンセル
        </button>
        <button
          type="button"
          onClick={() => {
            if (!form.name.trim()) return
            // form は useState の最新スナップショットを直接参照する
            onSave({ ...form })
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
  { value: 'light',  label: 'ライト',       desc: '常に明るいテーマ',   Icon: Sun },
  { value: 'dark',   label: 'ダーク',       desc: '常に暗いテーマ',     Icon: Moon },
  { value: 'system', label: 'システム設定', desc: 'OSの設定に合わせる', Icon: Monitor },
]

// ---- お問い合わせモーダル ----
function ContactModal({ onClose }: { onClose: () => void }) {
  const [category, setCategory] = useState('機能の使い方')
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const categories = ['機能の使い方', 'バグ・不具合', '要望・提案', 'アカウント', 'その他']

  const [sendError, setSendError] = useState('')

  const handleSend = async () => {
    if (!message.trim()) return
    setLoading(true)
    setSendError('')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, message }),
      })
      if (!res.ok) throw new Error()
      setSent(true)
    } catch {
      setSendError('送信に失敗しました。しばらくしてから再度お試しください。')
    } finally {
      setLoading(false)
    }
  }

  return (
    <BottomSheet title="お問い合わせ" onClose={onClose}>
      {sent ? (
        <div className="flex flex-col items-center gap-4 py-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <Check className="w-8 h-8 text-green-500" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-gray-800 mb-1">送信しました</p>
            <p className="text-sm text-gray-500">内容を確認の上、3〜5営業日以内にご登録のメールアドレスへご連絡します。</p>
          </div>
          <button onClick={onClose} className="mt-2 px-8 py-3 bg-orange-500 text-white rounded-xl text-sm font-semibold">
            閉じる
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-2 block">カテゴリ</label>
            <div className="flex flex-wrap gap-2">
              {categories.map(c => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    category === c ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-500 border-gray-200'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">お問い合わせ内容</label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="お困りの内容をできるだけ詳しくご記入ください..."
              rows={5}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none"
            />
            <p className="text-right text-xs text-gray-400 mt-1">{message.length} 文字</p>
          </div>

          <p className="text-xs text-gray-400 bg-gray-50 rounded-xl px-4 py-3">
            ご返信はご登録のメールアドレスへお送りします。通常3〜5営業日以内にご連絡します。
          </p>

          {sendError && <p className="text-xs text-red-500 text-center">{sendError}</p>}

          <button
            onClick={handleSend}
            disabled={!message.trim() || loading}
            className="w-full py-3.5 bg-orange-500 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading
              ? <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
              : <Send className="w-4 h-4" />
            }
            {loading ? '送信中...' : '送信する'}
          </button>
        </div>
      )}
    </BottomSheet>
  )
}

// ---- 通知設定モーダル ----
function NotificationModal({ onClose }: { onClose: () => void }) {
  const [settings, setSettings] = useState({
    mealReminder: true,
    morningReminder: false,
    lunchReminder: true,
    dinnerReminder: true,
    weeklyReport: true,
    growthRecord: false,
    tips: true,
  })

  const toggle = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const items = [
    { key: 'mealReminder' as const, label: '食事記録のリマインダー', desc: '毎食のタイミングに通知' },
    { key: 'morningReminder' as const, label: '朝食リマインダー', desc: '毎日 7:00', indent: true },
    { key: 'lunchReminder' as const, label: '昼食リマインダー', desc: '毎日 12:00', indent: true },
    { key: 'dinnerReminder' as const, label: '夕食リマインダー', desc: '毎日 18:00', indent: true },
    { key: 'weeklyReport' as const, label: '週間レポート', desc: '毎週月曜日に先週の栄養サマリーを通知' },
    { key: 'growthRecord' as const, label: '成長記録のリマインダー', desc: '毎月1日に身長・体重の記録を促す' },
    { key: 'tips' as const, label: 'お役立ちTips', desc: '栄養・食育に関する情報をお届け' },
  ]

  return (
    <BottomSheet title="通知設定" onClose={onClose}>
      <div className="flex flex-col gap-1">
        {items.map(item => (
          <div
            key={item.key}
            className={`flex items-center justify-between py-3.5 border-b border-gray-50 last:border-0 ${item.indent ? 'pl-4' : ''}`}
          >
            <div>
              <p className="text-sm font-medium text-gray-800">{item.label}</p>
              <p className="text-xs text-gray-400">{item.desc}</p>
            </div>
            <button
              onClick={() => toggle(item.key)}
              className={`relative w-12 h-6 rounded-full transition-colors shrink-0 ml-4 ${
                settings[item.key] ? 'bg-orange-500' : 'bg-gray-200'
              }`}
            >
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                settings[item.key] ? 'translate-x-6' : 'translate-x-0.5'
              }`} />
            </button>
          </div>
        ))}
      </div>
      <button
        onClick={onClose}
        className="mt-4 w-full py-3.5 bg-orange-500 text-white rounded-xl text-sm font-semibold"
      >
        保存する
      </button>
    </BottomSheet>
  )
}

// ---- アカウント削除モーダル ----
function DeleteAccountModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<'confirm' | 'input'>('confirm')
  const [inputText, setInputText] = useState('')
  const CONFIRM_WORD = '削除する'

  const handleDelete = () => {
    if (inputText !== CONFIRM_WORD) return
    signOut({ callbackUrl: '/login' })
  }

  return (
    <BottomSheet title="アカウントを削除" onClose={onClose}>
      {step === 'confirm' ? (
        <div className="flex flex-col gap-4">
          <div className="bg-red-50 rounded-2xl p-4 flex gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div className="flex flex-col gap-1">
              <p className="text-sm font-semibold text-red-700">削除すると元に戻せません</p>
              <p className="text-xs text-red-500 leading-relaxed">
                アカウントを削除すると、以下のすべてのデータが完全に削除されます。
              </p>
            </div>
          </div>

          <ul className="flex flex-col gap-2 px-1">
            {[
              '登録されたすべての子供のプロフィール',
              'これまでの食事記録・写真',
              '成長記録（身長・体重）',
              'アレルギー・苦手食品の情報',
              'アカウント情報・設定',
            ].map((item, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                {item}
              </li>
            ))}
          </ul>

          <div className="flex gap-2 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-3 border border-gray-200 rounded-xl text-sm text-gray-600 font-medium"
            >
              キャンセル
            </button>
            <button
              onClick={() => setStep('input')}
              className="flex-1 py-3 bg-red-500 text-white rounded-xl text-sm font-semibold"
            >
              削除に進む
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-gray-600 leading-relaxed">
            削除を確認するため、下のテキストボックスに
            <span className="font-bold text-red-500">「{CONFIRM_WORD}」</span>
            と入力してください。
          </p>
          <input
            type="text"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            placeholder={CONFIRM_WORD}
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-300"
          />
          <div className="flex gap-2">
            <button
              onClick={() => { setStep('confirm'); setInputText('') }}
              className="flex-1 py-3 border border-gray-200 rounded-xl text-sm text-gray-600 font-medium"
            >
              戻る
            </button>
            <button
              onClick={handleDelete}
              disabled={inputText !== CONFIRM_WORD}
              className="flex-1 py-3 bg-red-500 text-white rounded-xl text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
            >
              完全に削除する
            </button>
          </div>
        </div>
      )}
    </BottomSheet>
  )
}

// ---- 共通ボトムシート ----
function BottomSheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl max-w-lg mx-auto max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <h3 className="text-base font-bold text-gray-800">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </>
  )
}

// ---- メインページ ----
export default function SettingsPage() {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const { data: session } = useSession()
  const [children, setChildren] = useState<Child[]>([])
  const [showAddChild, setShowAddChild] = useState(false)

  useEffect(() => {
    fetch('/api/children')
      .then(r => r.json())
      .then(d => setChildren(d.children ?? []))
      .catch(console.error)
  }, [])
  const [editChild, setEditChild] = useState<ChildFormState | null>(null)

  const handleEditChild = async (child: Child) => {
    let height = ''
    let weight = ''
    try {
      const res = await fetch(`/api/growth-records?childId=${child.id}`)
      const json = await res.json()
      const latest = json.records?.[0]
      if (latest) {
        height = latest.height !== null ? String(latest.height) : ''
        weight = latest.weight !== null ? String(latest.weight) : ''
      }
    } catch (e) {
      console.error(e)
    }
    setEditChild({
      id: child.id,
      name: child.name,
      emoji: child.avatar,
      birthDate: child.birth_date,
      gender: child.gender ?? '',
      height,
      weight,
      activity: child.activity_level ?? '普通',
    })
  }
  const [showContact, setShowContact] = useState(false)
  const [showNotification, setShowNotification] = useState(false)
  const [showDeleteAccount, setShowDeleteAccount] = useState(false)

  const menuGroups = [
    {
      title: 'サポート',
      items: [
        { icon: MessageCircle, label: 'お問い合わせ', color: 'text-blue-500', bg: 'bg-blue-50', onClick: () => setShowContact(true) },
        { icon: HelpCircle, label: 'よくある質問', color: 'text-purple-500', bg: 'bg-purple-50', href: '/settings/faq' },
        { icon: Bell, label: '通知設定', color: 'text-orange-500', bg: 'bg-orange-50', onClick: () => setShowNotification(true) },
      ]
    },
    {
      title: '法的情報',
      items: [
        { icon: FileText, label: '利用規約', color: 'text-gray-500', bg: 'bg-gray-50', href: '/settings/terms' },
        { icon: Shield, label: 'プライバシーポリシー', color: 'text-gray-500', bg: 'bg-gray-50', href: '/settings/privacy' },
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
              <p className="font-bold text-white">{session?.user?.name ?? 'ユーザー'}</p>
              <p className="text-xs text-orange-100">{session?.user?.email ?? ''}</p>
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
                    {child.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{child.name}</p>
                    <p className="text-xs text-gray-400">{getAge(child.birth_date)}歳{child.gender ? ` · ${child.gender}` : ''}</p>
                    {child.activity_level && <p className="text-xs text-gray-400">運動: {child.activity_level}</p>}
                  </div>
                </div>
                <button
                  onClick={() => handleEditChild(child)}
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
          {THEME_OPTIONS.map((opt) => {
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
              const inner = (
                <div className="flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 w-full">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 ${item.bg} rounded-xl flex items-center justify-center`}>
                      <Icon className={`w-4 h-4 ${item.color}`} />
                    </div>
                    <span className="text-sm text-gray-700">{item.label}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </div>
              )
              if ('href' in item && item.href) {
                return <Link key={i} href={item.href}>{inner}</Link>
              }
              return (
                <button key={i} onClick={item.onClick} className="w-full text-left">
                  {inner}
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
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors border-b border-gray-50"
          >
            <div className="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center">
              <LogOut className="w-4 h-4 text-gray-500" />
            </div>
            <span className="text-sm text-gray-700">サインアウト</span>
          </button>
          <button
            onClick={() => setShowDeleteAccount(true)}
            className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-red-50 transition-colors"
          >
            <div className="w-8 h-8 bg-red-50 rounded-xl flex items-center justify-center">
              <Trash2 className="w-4 h-4 text-red-400" />
            </div>
            <span className="text-sm text-red-500">アカウントを削除</span>
          </button>
        </div>
      </div>

      <p className="text-center text-xs text-gray-300 pb-6">のびメシ v1.0.0</p>

      {/* 子供追加・編集モーダル */}
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
                key={editChild?.id ?? 'add'}
                initial={editChild ?? undefined}
                onSave={async (data) => {
                  if (editChild) {
                    await fetch('/api/children', {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        id: editChild.id,
                        name: data.name,
                        birth_date: data.birthDate,
                        gender: data.gender,
                        avatar: data.emoji,
                        activity_level: data.activity,
                        height: data.height,
                        weight: data.weight,
                      }),
                    })
                    const res = await fetch('/api/children')
                    const json = await res.json()
                    setChildren(json.children ?? [])
                    setEditChild(null)
                    router.refresh()
                  } else {
                    await fetch('/api/children', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        name: data.name,
                        birthDate: data.birthDate,
                        gender: data.gender,
                        height: data.height,
                        weight: data.weight,
                        activity: data.activity,
                        emoji: data.emoji,
                      }),
                    })
                    // 子供一覧を再取得
                    const res = await fetch('/api/children')
                    const json = await res.json()
                    setChildren(json.children ?? [])
                    setShowAddChild(false)
                  }
                }}
                onCancel={() => { setShowAddChild(false); setEditChild(null) }}
              />
            </div>
          </div>
        </>
      )}

      {/* 各種モーダル */}
      {showContact && <ContactModal onClose={() => setShowContact(false)} />}
      {showNotification && <NotificationModal onClose={() => setShowNotification(false)} />}
      {showDeleteAccount && <DeleteAccountModal onClose={() => setShowDeleteAccount(false)} />}
    </div>
  )
}
