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

// 食事記録を保存
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { childId, mealType, foodName, calories, protein, carbs, fat, recordedAt, notes } = body

  if (!childId || !mealType || !foodName?.trim()) {
    return NextResponse.json({ error: 'childId, mealType, foodName は必須です' }, { status: 400 })
  }

  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('meal_records')
    .insert({
      child_id: childId,
      meal_type: mealType,
      food_name: foodName.trim(),
      calories: calories ? parseFloat(calories) : null,
      protein: protein ? parseFloat(protein) : null,
      carbs: carbs ? parseFloat(carbs) : null,
      fat: fat ? parseFloat(fat) : null,
      notes: notes?.trim() || null,
      recorded_at: recordedAt ?? new Date().toISOString(),
    })
    .select('id, meal_type, food_name, calories, protein, fat, carbs, notes, recorded_at')
    .single()

  if (error) {
    console.error('[POST /api/meal-records]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ record: data })
}
