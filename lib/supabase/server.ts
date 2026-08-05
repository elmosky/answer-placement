import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// This deployment sets the un-prefixed names (SUPABASE_URL / SUPABASE_ANON_KEY);
// the NEXT_PUBLIC_ names are the site-template default. Accept either, so the
// blog doesn't 500 just because of which name the host happens to use.
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

export function isSupabaseConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)
}

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    SUPABASE_URL!,
    SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // called from a Server Component; safe to ignore
          }
        },
      },
    }
  )
}

export function createServiceClient() {
  // Use only in route handlers / server actions, never in client code
  const { createClient: createSupabase } = require('@supabase/supabase-js')
  return createSupabase(
    SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
