'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronDown, ChevronUp } from 'lucide-react'
import { useRouter } from 'next/navigation'

const FAQ_ITEMS = [
  {
    category: 'アカウント・登録',
    questions: [
      {
        q: '無料で使えますか？',
        a: 'はい、のびメシは基本機能を無料でご利用いただけます。食事記録・栄養管理・成長記録などの主要機能はすべて無料です。',
      },
      {
        q: '複数の子供を登録できますか？',
        a: 'はい、お子様を何人でも登録できます。設定画面の「子供のプロフィール」から追加してください。ホーム画面でお子様を切り替えながらそれぞれの記録を管理できます。',
      },
      {
        q: 'Googleアカウント以外でも登録できますか？',
        a: 'メールアドレスとパスワードでの登録にも対応しています。ログイン画面の「メールアドレスで登録」からご利用ください。',
      },
      {
        q: 'パスワードを忘れた場合はどうすればいいですか？',
        a: 'ログイン画面の「パスワードを忘れた方はこちら」からパスワードリセットのメールを送信できます。登録したメールアドレスを入力してください。',
      },
    ],
  },
  {
    category: '食事記録',
    questions: [
      {
        q: 'AIで食べ物を認識できますか？',
        a: 'はい、カメラで食べ物を撮影するとAIが自動的に食品を認識し、カロリーや栄養素を自動入力します。認識精度を高めるため、なるべく明るい場所で料理全体が映るよう撮影してください。',
      },
      {
        q: '手動で栄養素を入力することはできますか？',
        a: '「手動で入力」から食品名を入力すると、AIが栄養素を自動補完します。また、すべての栄養素を手動で入力・調整することも可能です。',
      },
      {
        q: '記録を修正・削除できますか？',
        a: 'ホーム画面の食事カードから各記録を選択し、編集・削除が可能です。',
      },
      {
        q: '過去の日付の記録を追加できますか？',
        a: 'はい、ホーム画面のカレンダーから過去の日付を選択して記録を追加できます。',
      },
    ],
  },
  {
    category: '栄養・成長',
    questions: [
      {
        q: '栄養基準はどのデータをもとにしていますか？',
        a: '厚生労働省「日本人の食事摂取基準（2020年版）」およびWHOの基準をもとに、お子様の年齢・性別・体重・運動習慣に合わせて目標値を算出しています。',
      },
      {
        q: '成長曲線はどのデータと比較していますか？',
        a: '厚生労働省・文部科学省が発表している学校保健統計調査の身長・体重の平均値および標準偏差をもとに作成しています。',
      },
      {
        q: 'アレルギーの情報はどのように使われますか？',
        a: '登録したアレルギー情報はAIによるレシピ提案・相談の際に参照され、アレルゲンを含む食材が提案されないよう配慮されます。医療的な診断や治療の代替にはなりませんので、アレルギーの管理は必ず医師の指導のもとで行ってください。',
      },
    ],
  },
  {
    category: 'AIレシピ機能',
    questions: [
      {
        q: 'AIレシピ相談とは何ですか？',
        a: 'AIに食材や条件（今日の不足栄養素・アレルギー・好み）を伝えると、お子様に合わせたレシピを提案します。「今日の夕食に何を作ればいい？」などの質問にも対応しています。',
      },
      {
        q: 'レシピ提案はどのくらいの頻度で利用できますか？',
        a: '1日の利用回数に制限はありません。ただし、サーバーの状況によって応答に時間がかかる場合があります。',
      },
    ],
  },
  {
    category: 'データ・プライバシー',
    questions: [
      {
        q: 'データはどこに保存されますか？',
        a: 'お客様のデータはSupabase（PostgreSQL）の国内・海外サーバーに暗号化して保存されます。詳細はプライバシーポリシーをご確認ください。',
      },
      {
        q: 'アカウントを削除するとデータはどうなりますか？',
        a: 'アカウントを削除すると、登録されたすべてのデータ（食事記録・成長記録・お子様のプロフィールなど）が完全に削除されます。削除後の復元はできませんのでご注意ください。',
      },
    ],
  },
]

export default function FAQPage() {
  const router = useRouter()
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({})

  const toggle = (key: string) => {
    setOpenItems(prev => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <div className="bg-white px-4 pt-12 pb-4 border-b border-gray-100 flex items-center gap-3">
        <button onClick={() => router.back()} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h1 className="text-lg font-bold text-gray-800">よくある質問</h1>
      </div>

      <div className="px-4 py-4 flex flex-col gap-4 pb-24">
        {FAQ_ITEMS.map((section) => (
          <div key={section.category}>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">{section.category}</p>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {section.questions.map((item, i) => {
                const key = `${section.category}-${i}`
                const isOpen = openItems[key]
                return (
                  <div key={i} className="border-b border-gray-50 last:border-0">
                    <button
                      onClick={() => toggle(key)}
                      className="w-full flex items-center justify-between px-4 py-4 text-left"
                    >
                      <span className="text-sm font-medium text-gray-800 pr-3 leading-snug">{item.q}</span>
                      {isOpen
                        ? <ChevronUp className="w-4 h-4 text-orange-400 shrink-0" />
                        : <ChevronDown className="w-4 h-4 text-gray-300 shrink-0" />
                      }
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4">
                        <p className="text-sm text-gray-500 leading-relaxed">{item.a}</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        <p className="text-center text-xs text-gray-400 mt-2">
          解決しない場合はお問い合わせください
        </p>
      </div>
    </div>
  )
}
