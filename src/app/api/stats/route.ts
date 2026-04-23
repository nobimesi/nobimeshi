import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase'

// ユーザーの食事記録統計を取得
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ recordDays: 0, totalRecords: 0 }, { status: 401 })
  }

  const supabase = createServiceClient()

  // ユーザーの子供ID一覧を取得
  const { data: children, error: childrenError } = await supabase
    .from('children')
    .select('id')
    .eq('user_id', session.user.email)

  if (childrenError || !children || children.length === 0) {
    return NextResponse.json({ recordDays: 0, totalRecords: 0 })
  }

  const childIds = children.map(c => c.id)

  // 該当する子供の食事記録を取得
  const { data: records, error: recordsError } = await supabase
    .from('meal_records')
    .select('recorded_at')
    .in('child_id', childIds)

  if (recordsError || !records) {
    console.error('[GET /api/stats] meal_records error:', recordsError)
    return NextResponse.json({ recordDays: 0, totalRecords: 0 })
  }

  const totalRecords = records.length

  // 記録がある日数（日付部分だけで重複排除）
  const uniqueDays = new Set(records.map(r => r.recorded_at.slice(0, 10)))
  const recordDays = uniqueDays.size

  return NextResponse.json({ recordDays, totalRecords })
}
