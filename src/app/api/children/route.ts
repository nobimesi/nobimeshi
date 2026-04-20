import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
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

// 子供一覧を取得
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ children: [] }, { status: 401 })
  }

  const userId = await getOrCreateUser(session.user.email, session.user.name ?? null)
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
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { name, birthDate, gender, height, weight, emoji } = body

  if (!name?.trim() || !birthDate) {
    return NextResponse.json({ error: '名前と生年月日は必須です' }, { status: 400 })
  }

  const userId = await getOrCreateUser(session.user.email, session.user.name ?? null)
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
