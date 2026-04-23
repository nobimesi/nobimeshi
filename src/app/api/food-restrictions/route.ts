import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase'

// 指定した child_id の食事制限を取得
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ restrictions: [] }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const childId = searchParams.get('childId')
  if (!childId) {
    return NextResponse.json({ error: 'childId is required' }, { status: 400 })
  }

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('food_restrictions')
    .select('id, food_name, restriction_type, severity, overcome_count')
    .eq('child_id', childId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('[GET /api/food-restrictions]', error)
    return NextResponse.json({ restrictions: [] })
  }

  return NextResponse.json({ restrictions: data ?? [] })
}

// 食事制限を追加
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { childId, foodName, type, severity } = await req.json()
  if (!childId || !foodName || !type) {
    return NextResponse.json({ error: 'childId, foodName, type は必須です' }, { status: 400 })
  }

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('food_restrictions')
    .insert({
      child_id: childId,
      food_name: foodName,
      restriction_type: type,
      severity: type === 'allergy' ? (severity ?? 'mild') : null,
    })
    .select('id, food_name, restriction_type, severity, overcome_count')
    .single()

  if (error) {
    console.error('[POST /api/food-restrictions]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ restriction: data })
}

// 食事制限を削除
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 })
  }

  const supabase = createServiceClient()
  const { error } = await supabase.from('food_restrictions').delete().eq('id', id)

  if (error) {
    console.error('[DELETE /api/food-restrictions]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

// overcome_count をインクリメント
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await req.json()
  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 })
  }

  const supabase = createServiceClient()
  const { data: current } = await supabase
    .from('food_restrictions')
    .select('overcome_count')
    .eq('id', id)
    .single()

  const newCount = (current?.overcome_count ?? 0) + 1
  const { error } = await supabase
    .from('food_restrictions')
    .update({ overcome_count: newCount })
    .eq('id', id)

  if (error) {
    console.error('[PATCH /api/food-restrictions]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ overcome_count: newCount })
}
