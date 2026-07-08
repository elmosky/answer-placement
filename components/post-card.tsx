import Link from 'next/link'
import type { PostSummary } from '@/lib/types'

export function PostCard({ post, variant = 'grid' }: { post: PostSummary; variant?: 'grid' | 'list' | 'magazine' }) {
  if (variant === 'list') {
    return (
      <Link
        href={`/blog/${post.slug}`}
        className="group block py-6 border-b transition-colors"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <div className="flex items-center gap-3 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-brand)' }}>
            {post.category}
          </span>
          {post.read_time && (
            <span className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
              {post.read_time} min read
            </span>
          )}
        </div>
        <h3
          className="text-2xl font-bold mb-2 transition-colors"
          style={{ color: 'var(--color-foreground)' }}
        >
          {post.title}
        </h3>
        <p className="line-clamp-2" style={{ color: 'var(--color-muted-foreground)' }}>{post.excerpt}</p>
      </Link>
    )
  }

  if (variant === 'magazine') {
    return (
      <Link href={`/blog/${post.slug}`} className="group block">
        {post.featured_image && (
          <div
            className="aspect-[4/3] overflow-hidden mb-4"
            style={{ background: 'var(--color-muted)', borderRadius: 'var(--radius-md)' }}
          >
            <img
              src={post.featured_image}
              alt={post.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>
        )}
        <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--color-brand)' }}>
          {post.category}
        </p>
        <h3
          className="text-xl font-bold leading-snug mb-2"
          style={{ color: 'var(--color-foreground)', fontFamily: 'var(--font-heading)' }}
        >
          {post.title}
        </h3>
        <p className="text-sm line-clamp-2" style={{ color: 'var(--color-muted-foreground)' }}>{post.excerpt}</p>
      </Link>
    )
  }

  // grid (default)
  return (
    <Link href={`/blog/${post.slug}`} className="group block">
      {post.featured_image && (
        <div
          className="aspect-video overflow-hidden mb-3"
          style={{ background: 'var(--color-muted)', borderRadius: 'var(--radius-lg)' }}
        >
          <img
            src={post.featured_image}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}
      <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--color-brand)' }}>
        {post.category}
      </p>
      <h3 className="font-semibold leading-snug mb-1" style={{ color: 'var(--color-foreground)' }}>
        {post.title}
      </h3>
      <p className="text-sm line-clamp-2" style={{ color: 'var(--color-muted-foreground)' }}>{post.excerpt}</p>
    </Link>
  )
}
