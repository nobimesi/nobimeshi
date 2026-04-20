import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { createServiceClient } from '@/lib/supabase'
import type { SupabaseClient } from '@supabase/supabase-js'

// JWT トークンからユーザー情報を取得するヘルパー
async function getUserFromToken(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!token?.email) return null
  return {
    email: token.email as string,
    name: (token.name as string) ?? null,
  }
}

// ユーザーを取得（なければ作成）
// INSERT と SELECT を分離してチェーンエラーを排除
async function getOrCreateUser(
  supabase: SupabaseClient,
  email: string,
  name: string | null
): Promise<{ id: string } | null> {
  // 1. SELECT
  const { data: selectRows, error: selectError } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .limit(1)

  if (selectError) {
    console.error('[getOrCreateUser] SELECT error:', selectError.message, selectError.code)
    return null
  }
  if (selectRows && selectRows.length > 0) {
    return selectRows[0] as { id: string }
  }

  // 2. INSERT
  const { error: insertError } = await supabase
    .from('users')
    .insert({ email, name })

  if (insertError) {
    // 23505 = unique 制約違反（並行リクエストで先に挿入済み）→ 再 SELECT
    if (insertError.code === '23505') {
      const { data: retryRows } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .limit(1)
      return retryRows?.[0] ?? null
    }
    console.error('[getOrCreateUser] INSERT error:', insertError.message, insertError.code, insertError.details)
    return null
  }

  // 3. INSERT 後に改めて SELECT
  const { data: afterRows, error: afterError } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .limit(1)

  if (afterError) {
    console.error('[getOrCreateUser] SELECT after INSERT error:', afterError.message)
    return null
  }

  return afterRows?.[0] ?? null
}

// 子供一覧を取得
export async function GET(req: NextRequest) {
  const tokenUser = await getUserFromToken(req)
  if (!tokenUser) {
    return NextResponse.json({ children: [] }, { status: 401 })
  }

  const supabase = createServiceClient()
  const user = await getOrCreateUser(supabase, tokenUser.email, tokenUser.name)
  if (!user) return NextResponse.json({ children: [] })

  const { data: children } = await supabase
    .from('children')
    .select('id, name, birth_date, gender, avatar')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  return NextResponse.json({ children: children ?? [] })
}

// 子供を登録
export async function POST(req: NextRequest) {
  const tokenUser = await getUserFromToken(req)
  if (!tokenUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { name, birthDate, gender, height, weight, emoji } = body

  if (!name?.trim() || !birthDate) {
    return NextResponse.json({ error: '名前と生年月日は必須です' }, { status: 400 })
  }

  const supabase = createServiceClient()
  const user = await getOrCreateUser(supabase, tokenUser.email, tokenUser.name)

  if (!user) {
    return NextResponse.json(
      { error: 'ユーザーの取得に失敗しました。サーバーログを確認してください。' },
      { status: 500 }
    )
  }

  // children INSERT
  const { error: childInsertError } = await supabase
    .from('children')
    .insert({
      user_id: user.id,
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
      .eq('user_id', user.id)
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
