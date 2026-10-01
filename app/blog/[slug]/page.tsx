import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { siteConfig } from '@/site.config'
import { getPostBySlug } from '@/lib/data'

export const revalidate = 3600

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  if (!post) return {}
  const image = post.og_image || post.featured_image
  // Leave `images` unset when there's no image, so the generated
  // opengraph-image.tsx card is used. Setting it, even to [], overrides the file.
  const images = image ? { images: [image] } : {}
  return {
    title: post.seo_title || post.title,
    description: post.meta_description || post.excerpt,
    alternates: { canonical: post.canonical_url ?? `${siteConfig.url}/blog/${post.slug}` },
    openGraph: {
      type: 'article',
      title: post.seo_title || post.title,
      description: post.meta_description || post.excerpt,
      ...images,
      publishedTime: post.published_at ?? post.created_at,
      authors: [post.author],
      tags: post.tags,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.seo_title || post.title,
      description: post.meta_description || post.excerpt,
      ...images,
    },
  }
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  if (!post) notFound()

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': post.schema_type || 'Article',
    headline: post.title,
    description: post.meta_description || post.excerpt,
    image: post.featured_image ? [post.featured_image] : undefined,
    datePublished: post.published_at ?? post.created_at,
    dateModified: post.updated_at,
    author: { '@type': 'Person', name: post.author },
    publisher: {
      '@type': 'Organization',
      name: siteConfig.name,
      url: siteConfig.url,
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${siteConfig.url}/blog/${post.slug}`,
    },
    keywords: post.tags?.join(', '),
  }

  return (
    <article className="mx-auto px-6 py-12" style={{ maxWidth: '42rem' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <Link href="/blog" className="text-sm hover:underline" style={{ color: 'var(--color-brand)' }}>
        ← Blog
      </Link>

      <div className="flex items-center gap-3 mt-6 mb-4">
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-brand)' }}>
          {post.category}
        </span>
        {post.read_time && (
          <span className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
            {post.read_time} min read
          </span>
        )}
      </div>

      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight mb-4">
        {post.title}
      </h1>

      <p className="text-base mb-6 leading-relaxed" style={{ color: 'var(--color-muted-foreground)' }}>
        {post.excerpt}
      </p>

      <div
        className="flex items-center gap-2 text-xs mb-8 pb-8 border-b"
        style={{ borderColor: 'var(--color-border)', color: 'var(--color-muted-foreground)' }}
      >
        <span>{post.author}</span>
        <span>·</span>
        <span>
          {new Date(post.published_at ?? post.created_at).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })}
        </span>
      </div>

      {post.featured_image && (
        <div
          className="aspect-video overflow-hidden mb-8"
          style={{ background: 'var(--color-muted)', borderRadius: 'var(--radius-lg)' }}
        >
          <img src={post.featured_image} alt={post.title} className="w-full h-full object-cover" />
        </div>
      )}

      <div
        className="prose prose-gray max-w-none prose-headings:font-bold"
        style={{ ['--tw-prose-links' as never]: 'var(--color-brand)' }}
        dangerouslySetInnerHTML={{ __html: post.body_html }}
      />

      {post.tags?.length > 0 && (
        <div className="flex gap-2 mt-10 pt-8 border-t flex-wrap" style={{ borderColor: 'var(--color-border)' }}>
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs px-3 py-1"
              style={{
                background: 'var(--color-muted)',
                color: 'var(--color-muted-foreground)',
                borderRadius: 'var(--radius-full)',
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </article>
  )
}
