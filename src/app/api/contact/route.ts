import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  try {
    const { category, message, userEmail } = await req.json()

    if (!message?.trim()) {
      return NextResponse.json({ error: 'メッセージが空です' }, { status: 400 })
    }

    await resend.emails.send({
      from: 'のびメシ お問い合わせ <onboarding@resend.dev>',
      to: 'nobimeshi.app@gmail.com',
      replyTo: userEmail || undefined,
      subject: `【のびメシ お問い合わせ】${category}`,
      text: [
        `カテゴリ: ${category}`,
        `送信者メール: ${userEmail || '未ログイン'}`,
        '',
        '--- お問い合わせ内容 ---',
        message,
      ].join('\n'),
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Contact email error:', err)
    return NextResponse.json({ error: 'メール送信に失敗しました' }, { status: 500 })
  }
}
