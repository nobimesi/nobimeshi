import { NextRequest, NextResponse } from 'next/server'
import { decode } from 'next-auth/jwt'
import { getSupabaseClient, createServiceClient } from '@/lib/supabase'

// ----------------------------------------------------------------
// JWT デコード
// ----------------------------------------------------------------
async function resolveEmailAndName(
  req: NextRequest,
): Promise<{ email: string; name: string | null } | null> {
  const secret = process.env.NEXTAUTH_SECRET
  if (!secret) {
    console.error('[auth] NEXTAUTH_SECRET is not set')
    return null
  }

  const cookieHeader = req.headers.get('cookie') ?? ''
  const cookieKeys = cookieHeader
    .split(';')
    .map(c => c.trim().split('=')[0])
    .filter(Boolean)

  // 本番: __Secure-next-auth.session-token / 開発: next-auth.session-token
  const cookieNames = [
    '__Secure-next-auth.session-token',
    'next-auth.session-token',
  ]

  let rawToken: string | undefined
  let foundCookieName: string | undefined
  for (const name of cookieNames) {
    const entry = cookieHeader
      .split(';')
      .map(c => c.trim())
      .find(c => c.startsWith(`${name}=`))
    if (entry) {
      rawToken = entry.slice(name.length + 1)
      foundCookieName = name
      break
    }
  }

  console.log('[auth] cookie check', {
    foundCookieName: foundCookieName ?? 'none',
    cookieKeys,
    hasSecret: !!secret,
  })

  if (!rawToken) {
    console.error('[auth] session cookie not found. All cookie keys:', cookieKeys)
    return null
  }

  try {
    const decoded = await decode({ token: rawToken, secret })
    console.log('[auth] decoded JWT', {
      email: decoded?.email ?? 'missing',
      name: decoded?.name ?? 'missing',
      sub: decoded?.sub ?? 'missing',
      exp: decoded?.exp,
      iat: decoded?.iat,
    })
    if (!decoded?.email) {
      console.error('[auth] decoded token has no email field', Object.keys(decoded ?? {}))
      return null
    }
    return { email: decoded.email as string, name: (decoded.name as string) ?? null }
  } catch (err) {
    console.error('[auth] JWT decode failed:', err)
    return null
  }
}

// ----------------------------------------------------------------
// users テーブル: 取得または作成
// ----------------------------------------------------------------
async function getOrCreateUser(email: string, name: string | null): Promise<string | null> {
  // service role を使ってRLSをバイパス（anon keyではRLSで弾かれる可能性あり）
  let supabase
  try {
    supabase = createServiceClient()
    console.log('[users] using service role client')
  } catch (e) {
    console.warn('[users] service role client failed, falling back to anon client:', e)
    supabase = getSupabaseClient()
  }

  // 1. SELECT
  console.log('[users] SELECT where email =', email)
  const { data: rows, error: selectError, status: selectStatus } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .limit(1)

  console.log('[users] SELECT result', {
    rows,
    selectStatus,
    error: selectError
      ? { message: selectError.message, code: selectError.code, details: selectError.details, hint: selectError.hint }
      : null,
  })

  if (selectError) {
    console.error('[users] SELECT error:', selectError)
    return null
  }

  if (rows && rows.length > 0) {
    console.log('[users] found existing user id:', rows[0].id)
    return rows[0].id as string
  }

  // 2. INSERT
  console.log('[users] user not found, INSERTing', { email, name })
  const { data: insertData, error: insertError, status: insertStatus } = await supabase
    .from('users')
    .insert({ email, name })
    .select('id')
    .limit(1)

  console.log('[users] INSERT result', {
    insertData,
    insertStatus,
    error: insertError
      ? { message: insertError.message, code: insertError.code, details: insertError.details, hint: insertError.hint }
      : null,
  })

  if (insertData && insertData.length > 0) {
    console.log('[users] INSERT returned id:', insertData[0].id)
    return insertData[0].id as string
  }

  if (insertError && insertError.code !== '23505') {
    console.error('[users] INSERT error (non-duplicate):', insertError)
    return null
  }

  // 3. 重複の場合は再 SELECT
  console.log('[users] duplicate or no data returned, re-SELECTing')
  const { data: newRows, error: newSelectError, status: newSelectStatus } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .limit(1)

  console.log('[users] re-SELECT result', {
    newRows,
    newSelectStatus,
    error: newSelectError
      ? { message: newSelectError.message, code: newSelectError.code, details: newSelectError.details }
      : null,
  })

  if (newSelectError) {
    console.error('[users] re-SELECT error:', newSelectError)
    return null
  }

  const id = newRows?.[0]?.id ?? null
  console.log('[users] final id:', id)
  return id
}

// ----------------------------------------------------------------
// GET /api/children
// ----------------------------------------------------------------
export async function GET(req: NextRequest) {
  console.log('[GET /api/children] start')

  const identity = await resolveEmailAndName(req)
  if (!identity) {
    const cookieHeader = req.headers.get('cookie') ?? ''
    return NextResponse.json(
      {
        children: [],
        _debug: {
          error: 'auth_failed',
          hasCookie:
            cookieHeader.includes('next-auth.session-token') ||
            cookieHeader.includes('__Secure-next-auth.session-token'),
          cookieKeys: cookieHeader.split(';').map(c => c.trim().split('=')[0]).filter(Boolean),
          nextauthUrl: process.env.NEXTAUTH_URL ?? 'not set',
          hasSecret: !!process.env.NEXTAUTH_SECRET,
          hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        },
      },
      { status: 401 },
    )
  }

  console.log('[GET /api/children] identity resolved:', identity.email)

  const userId = await getOrCreateUser(identity.email, identity.name)
  if (!userId) {
    return NextResponse.json(
      { children: [], _debug: { error: 'user_not_found', email: identity.email } },
      { status: 500 },
    )
  }

  let supabase
  try {
    supabase = createServiceClient()
  } catch {
    supabase = getSupabaseClient()
  }

  const { data: children, error: childrenError, status: childrenStatus } = await supabase
    .from('children')
    .select('id, name, birth_date, gender, avatar')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })

  console.log('[GET /api/children] children query', {
    userId,
    childrenStatus,
    count: children?.length ?? 0,
    error: childrenError
      ? { message: childrenError.message, code: childrenError.code, details: childrenError.details }
      : null,
  })

  return NextResponse.json({ children: children ?? [] })
}

// ----------------------------------------------------------------
// POST /api/children
// ----------------------------------------------------------------
export async function POST(req: NextRequest) {
  console.log('[POST /api/children] start')

  const identity = await resolveEmailAndName(req)
  if (!identity) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { name, birthDate, gender, height, weight, emoji } = body
  console.log('[POST /api/children] body', { name, birthDate, gender, height, weight, emoji })

  if (!name?.trim() || !birthDate) {
    return NextResponse.json({ error: '名前と生年月日は必須です' }, { status: 400 })
  }

  const userId = await getOrCreateUser(identity.email, identity.name)
  if (!userId) {
    console.error('[POST /api/children] getOrCreateUser returned null for', identity.email)
    return NextResponse.json({ error: 'ユーザーの取得に失敗しました' }, { status: 500 })
  }

  let supabase
  try {
    supabase = createServiceClient()
  } catch {
    supabase = getSupabaseClient()
  }

  const insertPayload = {
    user_id: userId,
    name: name.trim(),
    birth_date: birthDate,
    gender: gender || null,
    avatar: emoji || '👦',
  }
  console.log('[POST /api/children] children INSERT payload:', insertPayload)

  const { error: childInsertError, status: childInsertStatus } = await supabase
    .from('children')
    .insert(insertPayload)

  console.log('[POST /api/children] children INSERT result', {
    childInsertStatus,
    error: childInsertError
      ? { message: childInsertError.message, code: childInsertError.code, details: childInsertError.details, hint: childInsertError.hint }
      : null,
  })

  if (childInsertError) {
    return NextResponse.json(
      { error: `保存に失敗しました: ${childInsertError.message} (code: ${childInsertError.code})` },
      { status: 500 },
    )
  }

  // 身長・体重がある場合は成長記録にも保存
  if (height || weight) {
    const { data: childRow } = await supabase
      .from('children')
      .select('id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)

    if (childRow?.[0]) {
      const { error: growthError } = await supabase.from('growth_records').insert({
        child_id: childRow[0].id,
        recorded_at: new Date().toISOString().split('T')[0],
        height: height ? parseFloat(height) : null,
        weight: weight ? parseFloat(weight) : null,
      })
      if (growthError) {
        console.error('[POST /api/children] growth_records INSERT error:', growthError)
      }
    }
  }

  console.log('[POST /api/children] success')
  return NextResponse.json({ ok: true })
}
