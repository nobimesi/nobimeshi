'use client'

import { ChevronLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function PrivacyPage() {
  const router = useRouter()

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <div className="bg-white px-4 pt-12 pb-4 border-b border-gray-100 flex items-center gap-3">
        <button onClick={() => router.back()} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h1 className="text-lg font-bold text-gray-800">プライバシーポリシー</h1>
      </div>

      <div className="px-5 py-5 pb-24 flex flex-col gap-6 text-sm text-gray-700 leading-relaxed">
        <p className="text-xs text-gray-400">最終更新日：2026年4月1日</p>

        <p>
          のびメシ（以下「本サービス」）は、ユーザーの個人情報の取り扱いについて、以下のとおりプライバシーポリシーを定めます。
        </p>

        <section className="flex flex-col gap-2">
          <h2 className="font-bold text-gray-800">第1条（収集する情報）</h2>
          <p>本サービスでは、以下の情報を収集します。</p>
          <ul className="list-disc pl-5 flex flex-col gap-1 text-gray-600">
            <li>氏名（ニックネーム）・メールアドレス（アカウント登録時）</li>
            <li>Googleアカウント情報（Googleログイン利用時）</li>
            <li>お子様のプロフィール情報（名前・生年月日・性別・身長・体重・運動習慣）</li>
            <li>食事記録データ（食品名・カロリー・栄養素・撮影画像）</li>
            <li>成長記録データ（身長・体重の推移）</li>
            <li>アレルギー・苦手食品情報</li>
            <li>アプリの利用状況・操作ログ</li>
          </ul>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-bold text-gray-800">第2条（情報の利用目的）</h2>
          <p>収集した情報は以下の目的のために利用します。</p>
          <ul className="list-disc pl-5 flex flex-col gap-1 text-gray-600">
            <li>本サービスの提供・運営・改善</li>
            <li>ユーザーの認証・アカウント管理</li>
            <li>AIによる栄養分析・レシピ提案（Anthropic Claude APIを使用）</li>
            <li>お問い合わせへの対応</li>
            <li>利用規約への違反行為の調査・対応</li>
            <li>サービスに関する重要なお知らせの送信</li>
          </ul>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-bold text-gray-800">第3条（第三者への提供）</h2>
          <p>
            運営者は、以下の場合を除き、ユーザーの個人情報を第三者に提供しません。
          </p>
          <ul className="list-disc pl-5 flex flex-col gap-1 text-gray-600">
            <li>ユーザーの同意がある場合</li>
            <li>法令に基づく場合</li>
            <li>人の生命・身体・財産の保護のために必要な場合</li>
            <li>公衆衛生の向上または児童の健全な育成の推進のために特に必要な場合</li>
          </ul>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-bold text-gray-800">第4条（外部サービスの利用）</h2>
          <p>本サービスは以下の外部サービスを利用しており、それぞれのプライバシーポリシーが適用されます。</p>
          <ul className="list-disc pl-5 flex flex-col gap-1 text-gray-600">
            <li>Supabase（データベース・認証）</li>
            <li>Google OAuth（ソーシャルログイン）</li>
            <li>Anthropic Claude API（AI機能）</li>
          </ul>
          <p className="text-gray-500">
            AIへの送信データには個人が特定できる情報（氏名・メールアドレス等）は含まれません。
            食品・栄養・レシピに関する質問内容のみが送信されます。
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-bold text-gray-800">第5条（データの保管）</h2>
          <p>
            ユーザーのデータはSupabase（PostgreSQL）のセキュアなサーバーに暗号化して保存されます。
            通信はすべてSSL/TLSで暗号化されます。
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-bold text-gray-800">第6条（データの保持期間）</h2>
          <p>
            ユーザーデータは、アカウント有効期間中保持されます。
            アカウント削除を行うと、すべてのデータが即時削除されます。
            ただし、法令の定めがある場合はその期間保管されることがあります。
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-bold text-gray-800">第7条（お子様の情報）</h2>
          <p>
            本サービスは保護者が子供の食事・栄養管理を行うためのサービスです。
            13歳未満のお子様が直接アカウントを作成することはできません。
            お子様に関するデータは保護者のアカウントに紐づけて管理されます。
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-bold text-gray-800">第8条（ユーザーの権利）</h2>
          <p>ユーザーは以下の権利を有します。</p>
          <ul className="list-disc pl-5 flex flex-col gap-1 text-gray-600">
            <li>保有する個人情報の開示請求</li>
            <li>個人情報の訂正・追加・削除の請求</li>
            <li>個人情報の利用停止・消去の請求</li>
          </ul>
          <p className="text-gray-500">これらの請求はお問い合わせフォームよりご連絡ください。</p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-bold text-gray-800">第9条（Cookieの使用）</h2>
          <p>
            本サービスはセッション管理のためにCookieを使用します。
            ブラウザの設定によりCookieを無効にすることができますが、その場合は一部機能がご利用いただけなくなる場合があります。
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-bold text-gray-800">第10条（プライバシーポリシーの変更）</h2>
          <p>
            運営者は、必要に応じて本ポリシーを変更することがあります。
            重要な変更がある場合は、サービス内でお知らせします。
            変更後も本サービスを継続してご利用いただいた場合、変更後のポリシーに同意いただいたものとみなします。
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-bold text-gray-800">第11条（お問い合わせ）</h2>
          <p>
            本ポリシーに関するお問い合わせは、アプリ内のお問い合わせフォームよりご連絡ください。
          </p>
        </section>
      </div>
    </div>
  )
}
