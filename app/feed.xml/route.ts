import { siteConfig } from '@/site.config'
import { getAllPosts } from '@/lib/data'

// RSS at /feed.xml. Feed readers and automation subscribe this way without an email address.
export const revalidate = 3600

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export async function GET() {
  // getAllPosts throws on a database error. An empty feed looks like "no posts"
  // to every reader subscribed to it, so a failure returns 503 instead.
  let posts
  try {
    posts = (await getAllPosts()).slice(0, 50)
  } catch (error) {
    console.error('[feed.xml] posts query failed:', error)
    return new Response('Feed unavailable', { status: 503 })
  }

  const items = posts
    .map((p) => {
      const url = `${siteConfig.url}/blog/${p.slug}`
      const date = new Date(p.published_at ?? p.created_at).toUTCString()
      return `    <item>
      <title>${esc(p.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${date}</pubDate>${p.category ? `\n      <category>${esc(p.category)}</category>` : ''}${
        p.excerpt ? `\n      <description>${esc(p.excerpt)}</description>` : ''
      }
    </item>`
    })
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(siteConfig.name)}</title>
    <link>${siteConfig.url}</link>
    <description>${esc(siteConfig.description)}</description>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${siteConfig.url}/feed.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`

  return new Response(xml, {
    headers: { 'content-type': 'application/rss+xml; charset=utf-8' },
  })
}
