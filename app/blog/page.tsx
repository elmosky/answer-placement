import type { Metadata } from 'next'
import { siteConfig } from '@/site.config'
import { resolveTheme } from '@/themes'
import { getAllPosts } from '@/lib/data'
import { PostCard } from '@/components/post-card'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Blog',
  description: `Latest articles from ${siteConfig.name}.`,
}

export default async function BlogIndexPage() {
  const theme = resolveTheme(siteConfig.theme, siteConfig.themeOverrides)
  const variant = theme.layout.blogIndex
  const posts = await getAllPosts()

  return (
    <div className="mx-auto px-6 py-12" style={{ maxWidth: 'var(--container)' }}>
      <header className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">Blog</h1>
        <p style={{ color: 'var(--color-muted-foreground)' }}>
          Articles, guides, and updates from {siteConfig.name}.
        </p>
      </header>

      {posts.length === 0 ? (
        <p style={{ color: 'var(--color-muted-foreground)' }}>No posts yet. Check back soon.</p>
      ) : variant === 'list' ? (
        <div className="max-w-2xl">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} variant="list" />
          ))}
        </div>
      ) : variant === 'magazine' ? (
        <div className="grid md:grid-cols-3 gap-8">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} variant="magazine" />
          ))}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-8">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} variant="grid" />
          ))}
        </div>
      )}
    </div>
  )
}
