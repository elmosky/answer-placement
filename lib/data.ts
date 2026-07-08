import { createClient } from '@/lib/supabase/server'
import type { PostSummary, Post, BankRate } from '@/lib/types'

export async function getRecentPosts(limit = 6): Promise<PostSummary[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('posts')
    .select('id, title, slug, excerpt, category, featured_image, created_at, read_time, status')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(limit)
  return data ?? []
}

export async function getAllPosts(): Promise<PostSummary[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('posts')
    .select('id, title, slug, excerpt, category, featured_image, created_at, read_time, status')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
  return data ?? []
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('posts')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle()
  return data
}

export async function getTopRates(limit = 5): Promise<BankRate[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('bank_rates')
    .select('*')
    .order('apy', { ascending: false })
    .limit(limit)
  return data ?? []
}

export async function getAllRates(): Promise<BankRate[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('bank_rates')
    .select('*')
    .order('apy', { ascending: false })
  return data ?? []
}
