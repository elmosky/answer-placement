import { cache } from 'react'
import { unstable_rethrow } from 'next/navigation'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'
import type { PostSummary, Post, BankRate } from '@/lib/types'

type Db = Awaited<ReturnType<typeof createClient>>

// Content reads must never take a page down. If Supabase isn't configured, or
// the query fails, return the empty value and let the page render its empty
// state instead of throwing a 500.
async function read<T>(label: string, run: (db: Db) => Promise<T>, fallback: T): Promise<T> {
  if (!isSupabaseConfigured()) {
    console.warn(`[data] ${label}: Supabase env not configured — returning empty result`)
    return fallback
  }
  try {
    return await run(await createClient())
  } catch (err) {
    // cookies() throws a control-flow error to switch the route to dynamic
    // rendering. That one has to reach Next, not get swallowed as a data error.
    unstable_rethrow(err)
    console.error(`[data] ${label} failed:`, err)
    return fallback
  }
}

const POST_FIELDS =
  'id, title, slug, excerpt, category, featured_image, created_at, read_time, status'

export async function getRecentPosts(limit = 6): Promise<PostSummary[]> {
  return read(
    'getRecentPosts',
    async (supabase) => {
      const { data } = await supabase
        .from('posts')
        .select(POST_FIELDS)
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(limit)
      return data ?? []
    },
    []
  )
}

export async function getAllPosts(): Promise<PostSummary[]> {
  return read(
    'getAllPosts',
    async (supabase) => {
      const { data } = await supabase
        .from('posts')
        .select(POST_FIELDS)
        .eq('status', 'published')
        .order('created_at', { ascending: false })
      return data ?? []
    },
    []
  )
}

// One read per render, shared by generateMetadata and the page. Two separate reads race,
// whichever answers first is written first, and the reshuffled page is billed as an ISR
// write on every rebuild (15 of 20 rebuilds before, 1 of 20 after on polyphenolguide).
export const getPostBySlug = cache(getPostBySlugUncached);
async function getPostBySlugUncached(slug: string): Promise<Post | null> {
  return read(
    'getPostBySlug',
    async (supabase) => {
      const { data } = await supabase
        .from('posts')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'published')
        .maybeSingle()
      return data
    },
    null
  )
}

export async function getTopRates(limit = 5): Promise<BankRate[]> {
  return read(
    'getTopRates',
    async (supabase) => {
      const { data } = await supabase
        .from('bank_rates')
        .select('*')
        .order('apy', { ascending: false })
        .limit(limit)
      return data ?? []
    },
    []
  )
}

export async function getAllRates(): Promise<BankRate[]> {
  return read(
    'getAllRates',
    async (supabase) => {
      const { data } = await supabase
        .from('bank_rates')
        .select('*')
        .order('apy', { ascending: false })
      return data ?? []
    },
    []
  )
}
