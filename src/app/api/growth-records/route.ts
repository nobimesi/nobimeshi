import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase'

// 成長記録を取得
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ records: [] }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const childId = searchParams.get('childId')
  if (!childId) {
    return NextResponse.json({ error: 'childId is required' }, { status: 400 })
  }

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('growth_records')
    .select('id, recorded_at, height, weight')
    .eq('child_id', childId)
    .order('recorded_at', { ascending: false })

  if (error) {
    console.error('[GET /api/growth-records]', error)
    return NextResponse.json({ records: [] })
  }

  return NextResponse.json({ records: data ?? [] })
}

// 成長記録を追加
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { childId, recordedAt, height, weight } = await req.json()
  if (!childId || !recordedAt) {
    return NextResponse.json({ error: 'childId, recordedAt は必須です' }, { status: 400 })
  }

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('growth_records')
    .insert({
      child_id: childId,
      recorded_at: recordedAt,
      height: height ? parseFloat(height) : null,
      weight: weight ? parseFloat(weight) : null,
    })
    .select('id, recorded_at, height, weight')
    .single()

  if (error) {
    console.error('[POST /api/growth-records]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ record: data })
}
