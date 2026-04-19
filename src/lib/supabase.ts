import { createClient } from '@supabase/supabase-js'

export const getSupabaseUrl = () => process.env.NEXT_PUBLIC_SUPABASE_URL || ''
export const getSupabaseAnonKey = () => process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const getSupabaseClient = () => {
  const url = getSupabaseUrl()
  const key = getSupabaseAnonKey()
  if (!url || !key) throw new Error('Supabase env vars not set')
  return createClient(url, key)
}

export const createServiceClient = () => {
  const url = getSupabaseUrl()
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  if (!url || !serviceRoleKey) throw new Error('Supabase service env vars not set')
  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
