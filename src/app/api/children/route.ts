import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase'

// 子供一覧を取得
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ children: [] }, { status: 401 })
  }

  const supabase = createServiceClient()

  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('email', session.user.email)
    .single()

  if (!user) return NextResponse.json({ children: [] })

  const { data: children } = await supabase
    .from('children')
    .select('id, name, birth_date, gender, avatar')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  return NextResponse.json({ children: children || [] })
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

  // ユーザー取得（なければ作成）
  let { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('email', session.user.email)
    .single()

  if (!user) {
    const { data: newUser } = await supabase
      .from('users')
      .insert({ email: session.user.email, name: session.user.name })
      .select('id')
      .single()
    user = newUser
  }

  if (!user) return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 500 })

  const { data: child, error } = await supabase
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

  if (error) {
    console.error('children insert error:', error)
    return NextResponse.json({ error: '保存に失敗しました' }, { status: 500 })
  }

  // 身長・体重・運動習慣がある場合は成長記録に保存
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
