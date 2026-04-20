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
  const { data: children, error } = await supabase
    .from('children')
    .select('id, name, birth_date, gender, avatar, activity_level')
    .eq('user_id', session.user.email)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('[GET /api/children]', error)
  }

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

  const { data: child, error: childError } = await supabase
    .from('children')
    .insert({
      user_id: session.user.email,
      name: name.trim(),
      birth_date: birthDate,
      gender: gender || null,
      avatar: emoji || '👦',
      activity_level: activity || '普通',
    })
    .select('id')
    .single()

  if (childError) {
    console.error('[POST /api/children] insert error:', childError)
    return NextResponse.json(
      { error: `保存に失敗しました: ${childError.message}` },
      { status: 500 },
    )
  }

  // 身長・体重がある場合は成長記録にも保存
  if ((height || weight) && child?.id) {
    const { error: growthError } = await supabase.from('growth_records').insert({
      child_id: child.id,
      recorded_at: new Date().toISOString().split('T')[0],
      height: height ? parseFloat(height) : null,
      weight: weight ? parseFloat(weight) : null,
    })
    if (growthError) {
      console.error('[POST /api/children] growth_records insert error:', growthError)
    }
  }

  return NextResponse.json({ ok: true })
}
