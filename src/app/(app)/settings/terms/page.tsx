'use client'

import { ChevronLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function TermsPage() {
  const router = useRouter()

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <div className="bg-white px-4 pt-12 pb-4 border-b border-gray-100 flex items-center gap-3">
        <button onClick={() => router.back()} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h1 className="text-lg font-bold text-gray-800">利用規約</h1>
      </div>

      <div className="px-5 py-5 pb-24 flex flex-col gap-6 text-sm text-gray-700 leading-relaxed">
        <p className="text-xs text-gray-400">最終更新日：2026年4月19日</p>

        <p>
          本利用規約（以下「本規約」）は、Belle Vie（以下「運営者」）が提供するのびメシ（以下「本サービス」）の利用条件を定めるものです。
          ユーザーの皆様には、本規約に同意のうえ本サービスをご利用いただきます。
        </p>

        <section className="flex flex-col gap-2">
          <h2 className="font-bold text-gray-800">第1条（適用）</h2>
          <p>本規約は、ユーザーと運営者（Belle Vie）との間の本サービスの利用に関わる一切の関係に適用されます。</p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-bold text-gray-800">第2条（利用登録）</h2>
          <p>
            登録希望者が本規約に同意の上、所定の方法により利用登録を申請し、運営者がこれを承認することによって利用登録が完了します。
            未成年者が利用する場合は、保護者の同意を得た上でご利用ください。
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-bold text-gray-800">第3条（禁止事項）</h2>
          <p>ユーザーは以下の行為をしてはなりません。</p>
          <ul className="list-disc pl-5 flex flex-col gap-1 text-gray-600">
            <li>法令または公序良俗に違反する行為</li>
            <li>犯罪行為に関連する行為</li>
            <li>本サービスのサーバーまたはネットワークの機能を破壊・妨害する行為</li>
            <li>本サービスの運営を妨害するおそれのある行為</li>
            <li>他のユーザーに関する個人情報等を収集または蓄積する行為</li>
            <li>不正アクセスをし、またはこれを試みる行為</li>
            <li>他のユーザーに成りすます行為</li>
            <li>本サービスに関連して、反社会的勢力に対して直接または間接に利益を供与する行為</li>
            <li>その他、運営者が不適切と判断する行為</li>
          </ul>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-bold text-gray-800">第4条（本サービスの提供の停止等）</h2>
          <p>
            運営者は、以下のいずれかの事由があると判断した場合、ユーザーへの事前の通知なく本サービスの全部または一部の提供を停止または中断することができます。
          </p>
          <ul className="list-disc pl-5 flex flex-col gap-1 text-gray-600">
            <li>本サービスにかかるコンピュータシステムの保守点検または更新を行う場合</li>
            <li>地震・落雷・火災・停電等の不可抗力により、本サービスの提供が困難となった場合</li>
            <li>コンピュータまたは通信回線等が事故により停止した場合</li>
            <li>その他、運営者が本サービスの提供が困難と判断した場合</li>
          </ul>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-bold text-gray-800">第5条（免責事項）</h2>
          <p>
            本サービスは子供の食事・栄養管理を支援するためのものであり、医療行為・医療診断の代替となるものではありません。
            健康上の問題や食物アレルギーの管理については、必ず医師・管理栄養士等の専門家にご相談ください。
          </p>
          <p>
            運営者は、本サービスに関して、ユーザーと他のユーザーまたは第三者との間において生じたトラブルに関していかなる責任も負いません。
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-bold text-gray-800">第6条（サービス内容の変更等）</h2>
          <p>
            運営者は、ユーザーへの事前の告知なしに、本サービスの内容を変更または廃止することができるものとし、
            これによってユーザーに生じた損害について一切の責任を負いません。
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-bold text-gray-800">第7条（利用規約の変更）</h2>
          <p>
            運営者は必要と判断した場合には、ユーザーへの事前通知なく本規約を変更することができます。
            変更後の利用規約は、本サービス上に表示した時点より効力を生じるものとします。
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-bold text-gray-800">第8条（お問い合わせ）</h2>
          <p>
            本規約に関するお問い合わせは、下記またはアプリ内のお問い合わせフォームよりご連絡ください。
          </p>
          <p className="text-gray-500">
            運営者：Belle Vie<br />
            メール：nobimeshi.app@gmail.com
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-bold text-gray-800">第9条（準拠法・裁判管轄）</h2>
          <p>
            本規約の解釈にあたっては、日本法を準拠法とします。
            本サービスに関して紛争が生じた場合には、名古屋地方裁判所を第一審の専属的合意管轄裁判所とします。
          </p>
        </section>
      </div>
    </div>
  )
}
