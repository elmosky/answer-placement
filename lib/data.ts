import 'server-only'
import { cache } from 'react'
import { db } from '@/lib/db'
import type { PostSummary, Post } from '@/lib/types'

const POST_FIELDS =
  'id, title, slug, excerpt, category, featured_image, created_at, published_at, read_time, status'

/**
 * A post is live when it is published AND its date has arrived. Same rule as
 * the other factory sites. No try/catch: the factory client throws on a
 * database error, so an outage fails the render and Next keeps serving the last
 * good page, instead of caching "No posts yet" (which hid the paused-database
 * outage here for six weeks, 2026-09-25 to 2026-11-11).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- supabase builder generics overflow tsc here
function live(q: any) {
  return q
    .eq('status', 'published')
    .not('published_at', 'is', null)
    .lte('published_at', new Date().toISOString())
}

export async function getAllPosts(): Promise<PostSummary[]> {
  const client = await db()
  const { data } = await live(client.from('posts').selectOwn(POST_FIELDS)).order('published_at', {
    ascending: false,
  })
  return (data ?? []) as PostSummary[]
}

// One read per render, shared by generateMetadata and the page. Two separate reads race,
// whichever answers first is written first, and the reshuffled page is billed as an ISR
// write on every rebuild (15 of 20 rebuilds before, 1 of 20 after on polyphenolguide).
export const getPostBySlug = cache(getPostBySlugUncached)
async function getPostBySlugUncached(slug: string): Promise<Post | null> {
  const client = await db()
  const { data } = await live(client.from('posts').selectOwn('*').eq('slug', slug)).maybeSingle()
  // The factory posts table has author_id, not an author name; every post here
  // is written as the brand.
  return data ? ({ ...data, author: 'AnswerPlacement' } as Post) : null
}
