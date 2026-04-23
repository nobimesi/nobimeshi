import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase'

// 食事記録を取得
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ records: [] }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const childId = searchParams.get('childId')
  const date = searchParams.get('date') // yyyy-mm-dd

  if (!childId) {
    return NextResponse.json({ error: 'childId is required' }, { status: 400 })
  }

  const supabase = createServiceClient()

  let query = supabase
    .from('meal_records')
    .select('id, meal_type, food_name, calories, protein, fat, carbs, calcium, iron, vitamin_c, notes, recorded_at')
    .eq('child_id', childId)
    .order('recorded_at', { ascending: true })

  // 日付指定がある場合はその日のみ取得
  if (date) {
    const start = `${date}T00:00:00.000Z`
    const end = `${date}T23:59:59.999Z`
    query = query.gte('recorded_at', start).lte('recorded_at', end)
  }

  const { data, error } = await query

  if (error) {
    console.error('[GET /api/meal-records]', error)
    return NextResponse.json({ records: [] })
  }

  return NextResponse.json({ records: data ?? [] })
}
