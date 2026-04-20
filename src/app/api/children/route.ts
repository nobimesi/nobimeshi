import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { getToken } from 'next-auth/jwt'
import { authOptions } from '@/lib/auth'
import { getSupabaseClient } from '@/lib/supabase'

// ユーザーをメールアドレスで取得、なければ作成して id を返す
async function getOrCreateUser(email: string, name: string | null): Promise<string | null> {
  const supabase = getSupabaseClient()

  // SELECT
  const { data: rows, error: selectError } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .limit(1)

  if (selectError) {
    console.error('[getOrCreateUser] select error:', selectError.message)
    return null
  }

  if (rows && rows.length > 0) {
    return rows[0].id as string
  }

  // INSERT
  const { error: insertError } = await supabase
    .from('users')
    .insert({ email, name })

  if (insertError && insertError.code !== '23505') {
    console.error('[getOrCreateUser] insert error:', insertError.message, insertError.code)
    return null
  }

  // INSERT 後に再 SELECT
  const { data: newRows, error: newSelectError } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .limit(1)

  if (newSelectError) {
    console.error('[getOrCreateUser] select after insert error:', newSelectError.message)
    return null
  }

  return newRows?.[0]?.id ?? null
}

// セッション取得（getServerSession + getToken フォールバック）
async function resolveEmailAndName(req: NextRequest): Promise<{ email: string; name: string | null } | null> {
  // まず getServerSession を試みる
  const session = await getServerSession(authOptions)
  if (session?.user?.email) {
    return { email: session.user.email, name: session.user.name ?? null }
  }

  // フォールバック: JWT トークンを直接読む（モバイル Safari 対応）
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (token?.email) {
    return { email: token.email as string, name: (token.name as string) ?? null }
  }

  return null
}

// 子供一覧を取得
export async function GET(req: NextRequest) {
  const identity = await resolveEmailAndName(req)

  if (!identity) {
    // デバッグ: セッション・トークン両方 null の詳細情報
    const session = await getServerSession(authOptions)
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    const cookieHeader = req.headers.get('cookie') ?? ''
    const hasCookie = cookieHeader.includes('next-auth.session-token') || cookieHeader.includes('__Secure-next-auth.session-token')
    console.error('[GET /api/children] auth failed', {
      session: session ?? 'null',
      tokenEmail: token?.email ?? 'null',
      hasCookie,
      cookieKeys: cookieHeader.split(';').map(c => c.trim().split('=')[0]).filter(Boolean),
      nextauthUrl: process.env.NEXTAUTH_URL ?? 'not set',
    })
    return NextResponse.json({
      children: [],
      _debug: {
        sessionNull: !session,
        tokenNull: !token,
        tokenEmail: token?.email ?? null,
        hasCookie,
        nextauthUrl: process.env.NEXTAUTH_URL ?? 'not set',
      },
    }, { status: 401 })
  }

  const userId = await getOrCreateUser(identity.email, identity.name)
  if (!userId) return NextResponse.json({ children: [] })

  const supabase = getSupabaseClient()
  const { data: children } = await supabase
    .from('children')
    .select('id, name, birth_date, gender, avatar')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })

  return NextResponse.json({ children: children ?? [] })
}

// 子供を登録
export async function POST(req: NextRequest) {
  const identity = await resolveEmailAndName(req)
  if (!identity) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    console.error('[POST /api/children] auth failed', { tokenEmail: token?.email ?? 'null', nextauthUrl: process.env.NEXTAUTH_URL ?? 'not set' })
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { name, birthDate, gender, height, weight, emoji } = body

  if (!name?.trim() || !birthDate) {
    return NextResponse.json({ error: '名前と生年月日は必須です' }, { status: 400 })
  }

  const userId = await getOrCreateUser(identity.email, identity.name)
  if (!userId) {
    return NextResponse.json({ error: 'ユーザーの取得に失敗しました' }, { status: 500 })
  }

  const supabase = getSupabaseClient()

  const { error: childInsertError } = await supabase
    .from('children')
    .insert({
      user_id: userId,
      name: name.trim(),
      birth_date: birthDate,
      gender: gender || null,
      avatar: emoji || '👦',
    })

  if (childInsertError) {
    console.error('[POST /api/children] insert error:', childInsertError.message, childInsertError.code)
    return NextResponse.json(
      { error: `保存に失敗しました: ${childInsertError.message}` },
      { status: 500 }
    )
  }

  // 身長・体重がある場合は成長記録にも保存
  if (height || weight) {
    const { data: childRow } = await supabase
      .from('children')
      .select('id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)

    if (childRow?.[0]) {
      await supabase.from('growth_records').insert({
        child_id: childRow[0].id,
        recorded_at: new Date().toISOString().split('T')[0],
        height: height ? parseFloat(height) : null,
        weight: weight ? parseFloat(weight) : null,
      })
    }
  }

  return NextResponse.json({ ok: true })
}
