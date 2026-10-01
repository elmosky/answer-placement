import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { siteConfig } from '@/site.config'
import { getPostBySlug } from '@/lib/data'

export const runtime = 'nodejs'
export const alt = 'Article from answerplacement.com'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

// Per-post share card with the post's own title. Only used when the post has
// no og_image or featured_image: page.tsx only sets openGraph.images when it
// has one, and Next lets config images win over this file at the same segment.
const INK = '#16162a'
const MUTED = '#5b5b6b'
const GRADIENT = 'linear-gradient(100deg, #f97316 0%, #ec4899 45%, #a855f7 100%)'

export default async function PostOgImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const [post, inter] = await Promise.all([
    getPostBySlug(slug),
    readFile(path.join(process.cwd(), 'assets/og-fonts/inter-600.ttf')),
  ])

  const rawTitle = post?.title ?? siteConfig.tagline
  const title = rawTitle.length > 110 ? `${rawTitle.slice(0, 107)}...` : rawTitle

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px 96px',
          backgroundColor: '#ffffff',
          backgroundImage: 'linear-gradient(120deg, #ffeede 0%, #ffffff 50%, #efe9ff 100%)',
          fontFamily: 'Inter',
        }}
      >
        <div style={{ display: 'flex', fontSize: 26, color: MUTED, textTransform: 'uppercase', letterSpacing: 4 }}>
          {post?.category || 'Blog'}
        </div>
        <div style={{ display: 'flex', fontSize: title.length > 60 ? 58 : 72, color: INK, lineHeight: 1.12, letterSpacing: -2 }}>
          {title}
        </div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ display: 'flex', width: 120, height: 8, borderRadius: 9999, backgroundImage: GRADIENT }} />
          <div style={{ display: 'flex', marginLeft: 24, fontSize: 30, color: MUTED }}>{siteConfig.domain}</div>
        </div>
      </div>
    ),
    { ...size, fonts: [{ name: 'Inter', data: inter, weight: 600, style: 'normal' }] },
  )
}
