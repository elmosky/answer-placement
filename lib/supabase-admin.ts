// Server-only Supabase client (service role). Never import into client code.
// The `audits` table has RLS enabled with no policies, so only this
// service-role client can read/write it.

import { createClient } from '@supabase/supabase-js'

export function supabaseAdmin() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase env not configured')
  return createClient(url, key, { auth: { persistSession: false } })
}
