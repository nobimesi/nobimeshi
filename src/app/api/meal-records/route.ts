import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase'

const MICRO_COLUMNS = [
  'vitamin_a', 'vitamin_d', 'vitamin_e', 'vitamin_k',
  'vitamin_b1', 'vitamin_b2', 'vitamin_b6', 'vitamin_b12', 'vitamin_c',
  'niacin', 'pantothenic_acid', 'folate', 'biotin',
  'calcium', 'phosphorus', 'potassium', 'sulfur', 'chlorine', 'sodium',
  'magnesium', 'iron', 'zinc', 'copper', 'manganese',
  'iodine', 'selenium', 'molybdenum', 'chromium', 'cobalt',
] as const

const SELECT_COLS = [
  'id', 'meal_type', 'food_name', 'calories', 'protein', 'fat', 'carbs',
  'notes', 'recorded_at',
  ...MICRO_COLUMNS,
].join(', ')

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
    .select(SELECT_COLS)
    .eq('child_id', childId)
    .order('recorded_at', { ascending: false })

  if (date) {
    const start = `${date}T00:00:00.000Z`
    const end   = `${date}T23:59:59.999Z`
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
  const {
    childId, mealType, foodName, calories, protein, carbs, fat,
    recordedAt, notes,
    // vitamins
    vitamin_a, vitamin_d, vitamin_e, vitamin_k,
    vitamin_b1, vitamin_b2, vitamin_b6, vitamin_b12, vitamin_c,
    niacin, pantothenic_acid, folate, biotin,
    // minerals
    calcium, phosphorus, potassium, sulfur, chlorine, sodium,
    magnesium, iron, zinc, copper, manganese,
    iodine, selenium, molybdenum, chromium, cobalt,
  } = body

  if (!childId || !mealType || !foodName?.trim()) {
    return NextResponse.json({ error: 'childId, mealType, foodName は必須です' }, { status: 400 })
  }

  const parseNum = (v: unknown) => (v != null && v !== '' ? parseFloat(String(v)) : null)

  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('meal_records')
    .insert({
      child_id:   childId,
      meal_type:  mealType,
      food_name:  foodName.trim(),
      calories:   parseNum(calories),
      protein:    parseNum(protein),
      carbs:      parseNum(carbs),
      fat:        parseNum(fat),
      notes:      notes?.trim() || null,
      recorded_at: recordedAt ?? new Date().toISOString(),
      // vitamins
      vitamin_a:        parseNum(vitamin_a),
      vitamin_d:        parseNum(vitamin_d),
      vitamin_e:        parseNum(vitamin_e),
      vitamin_k:        parseNum(vitamin_k),
      vitamin_b1:       parseNum(vitamin_b1),
      vitamin_b2:       parseNum(vitamin_b2),
      vitamin_b6:       parseNum(vitamin_b6),
      vitamin_b12:      parseNum(vitamin_b12),
      vitamin_c:        parseNum(vitamin_c),
      niacin:           parseNum(niacin),
      pantothenic_acid: parseNum(pantothenic_acid),
      folate:           parseNum(folate),
      biotin:           parseNum(biotin),
      // minerals
      calcium:    parseNum(calcium),
      phosphorus: parseNum(phosphorus),
      potassium:  parseNum(potassium),
      sulfur:     parseNum(sulfur),
      chlorine:   parseNum(chlorine),
      sodium:     parseNum(sodium),
      magnesium:  parseNum(magnesium),
      iron:       parseNum(iron),
      zinc:       parseNum(zinc),
      copper:     parseNum(copper),
      manganese:  parseNum(manganese),
      iodine:     parseNum(iodine),
      selenium:   parseNum(selenium),
      molybdenum: parseNum(molybdenum),
      chromium:   parseNum(chromium),
      cobalt:     parseNum(cobalt),
    })
    .select(SELECT_COLS)
    .single()

  if (error) {
    console.error('[POST /api/meal-records]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ record: data })
}

// 食事記録を更新
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 })
  }

  const body = await req.json()
  const { foodName, calories, protein, carbs, fat, notes } = body

  if (!foodName?.trim()) {
    return NextResponse.json({ error: 'foodName は必須です' }, { status: 400 })
  }

  const parseNum = (v: unknown) => (v != null && v !== '' ? parseFloat(String(v)) : null)

  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('meal_records')
    .update({
      food_name: foodName.trim(),
      calories:  parseNum(calories),
      protein:   parseNum(protein),
      carbs:     parseNum(carbs),
      fat:       parseNum(fat),
      notes:     notes?.trim() || null,
    })
    .eq('id', id)
    .select(SELECT_COLS)
    .single()

  if (error) {
    console.error('[PATCH /api/meal-records]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ record: data })
}

// 食事記録を削除
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

  const { error } = await supabase
    .from('meal_records')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('[DELETE /api/meal-records]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
