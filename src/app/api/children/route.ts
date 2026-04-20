import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase'
import type { SupabaseClient } from '@supabase/supabase-js'

// ユーザーを取得（なければ作成）。maybeSingle() を使い 0 行でもエラーにしない
async function getOrCreateUser(supabase: SupabaseClient, email: string, name: string | null) {
  // 1. まず SELECT
  const { data: existing, error: selectError } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .maybeSingle()

  if (selectError) {
    console.error('users select error:', selectError)
    return null
  }
  if (existing) return existing

  // 2. 見つからなければ INSERT
  const { data: created, error: insertError } = await supabase
    .from('users')
    .insert({ email, name })
    .select('id')
    .maybeSingle()

  if (insertError) {
    // unique 制約違反 (23505) = 並行リクエストで先に INSERT されたので再 SELECT
    if (insertError.code === '23505') {
      const { data: retry } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .maybeSingle()
      return retry ?? null
    }
    console.error('users insert error:', insertError)
    return null
  }

  return created ?? null
}

// 子供一覧を取得
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ children: [] }, { status: 401 })
  }

  const supabase = createServiceClient()
  const user = await getOrCreateUser(supabase, session.user.email, session.user.name ?? null)
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
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { name, birthDate, gender, height, weight, activity, emoji } = body

  if (!name?.trim() || !birthDate) {
    return NextResponse.json({ error: '名前と生年月日は必須です' }, { status: 400 })
  }

  const supabase = createServiceClient()
  const user = await getOrCreateUser(supabase, session.user.email, session.user.name ?? null)

  if (!user) {
    return NextResponse.json({ error: 'ユーザーの取得に失敗しました' }, { status: 500 })
  }

  const { data: child, error: childError } = await supabase
    .from('children')
    .insert({
      user_id: user.id,
      name: name.trim(),
      birth_date: birthDate,
      gender: gender || null,
      avatar: emoji || '👦',
    })
    .select()
    .single()

  if (childError) {
    console.error('children insert error:', childError)
    return NextResponse.json({ error: '保存に失敗しました' }, { status: 500 })
  }

  // 身長・体重がある場合は成長記録にも保存
  if (height || weight) {
    await supabase.from('growth_records').insert({
      child_id: child.id,
      recorded_at: new Date().toISOString().split('T')[0],
      height: height ? parseFloat(height) : null,
      weight: weight ? parseFloat(weight) : null,
    })
  }

  return NextResponse.json({ child })
}
