// Provider-agnostic page fetch with a FREE-FIRST fallback chain:
//   1. plain fetch()   — free, no service; raw HTML for signals + links
//   2. Crawl4AI        — self-hosted (localhost), free, renders JS  [preferred]
//   3. Jina Reader     — free daily quota, clean markdown, some JS
//   4. local htmlToText — free fallback
//   5. Firecrawl       — metered last resort (gated off by default)
//
// Config (all optional): CRAWL4AI_URL (+ CRAWL4AI_TOKEN), JINA_API_KEY,
// FIRECRAWL_BASE_URL / ENABLE_FIRECRAWL_CLOUD.

import { scrape as firecrawlScrape } from './firecrawl'

export type ScrapedPage = {
  url: string
  markdown: string
  html: string
  links: string[]
  metadata: Record<string, unknown>
  source: 'crawl4ai' | 'fetch+jina' | 'fetch' | 'firecrawl'
}

const UA = 'Mozilla/5.0 (compatible; AnswerPlacementBot/1.0; +https://answerplacement.com)'

async function plainFetch(url: string): Promise<{ html: string; ok: boolean }> {
  try {
    const r = await fetch(url, { redirect: 'follow', headers: { 'user-agent': UA } })
    return { html: r.ok ? await r.text() : '', ok: r.ok }
  } catch {
    return { html: '', ok: false }
  }
}

// Self-hosted Crawl4AI HTTP server (see crawl4ai/ setup). Free, renders JS.
async function crawl4ai(url: string): Promise<{ markdown: string; html: string; links: string[] } | null> {
  const base = process.env.CRAWL4AI_URL
  if (!base) return null
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (process.env.CRAWL4AI_TOKEN) headers.Authorization = `Bearer ${process.env.CRAWL4AI_TOKEN}`
    const r = await fetch(`${base.replace(/\/$/, '')}/crawl`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ url }),
    })
    if (!r.ok) return null
    const j = (await r.json()) as { markdown?: string; html?: string; links?: string[] }
    return { markdown: j.markdown ?? '', html: j.html ?? '', links: j.links ?? [] }
  } catch {
    return null
  }
}

async function jinaMarkdown(url: string): Promise<string | null> {
  try {
    const headers: Record<string, string> = { 'X-Return-Format': 'markdown' }
    if (process.env.JINA_API_KEY) headers.Authorization = `Bearer ${process.env.JINA_API_KEY}`
    const r = await fetch(`https://r.jina.ai/${url}`, { headers })
    if (!r.ok) return null
    const t = await r.text()
    return t && t.trim().length > 100 ? t : null
  } catch {
    return null
  }
}

function extractLinks(html: string, base: string): string[] {
  const out = new Set<string>()
  for (const [, href] of html.matchAll(/<a\s[^>]*href=["']([^"'#]+)["']/gi)) {
    try {
      out.add(new URL(href, base).toString())
    } catch {
      // ignore unparseable hrefs
    }
  }
  return [...out]
}

function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function metaFrom(html: string): Record<string, unknown> {
  const title = html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim() || null
  const description =
    html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i)?.[1]?.trim() || null
  return { title, description }
}

export async function fetchPage(url: string): Promise<ScrapedPage> {
  // 1. Plain fetch — free. Raw HTML powers schema/meta/link signals.
  const pf = await plainFetch(url)
  let html = pf.html
  let links = html ? extractLinks(html, url) : []

  let markdown: string | null = null
  let source: ScrapedPage['source'] = 'fetch'

  // 2. Crawl4AI — self-hosted, free, renders JS. Preferred when configured.
  const c4 = await crawl4ai(url)
  if (c4 && c4.markdown.length > 100) {
    markdown = c4.markdown
    source = 'crawl4ai'
    if (!html && c4.html) html = c4.html
    if (!links.length && c4.links.length) links = c4.links
  }

  // 3. Jina Reader — free daily quota, clean markdown.
  if (!markdown) {
    const j = await jinaMarkdown(url)
    if (j) {
      markdown = j
      source = 'fetch+jina'
    }
  }

  // 4. Local fallback — derive text from the HTML we already have.
  if (!markdown && html) markdown = htmlToText(html)

  // 5. Firecrawl — metered last resort. Gated: only when a self-hosted endpoint
  //    is set (free) or cloud is explicitly opted in.
  const firecrawlAllowed = Boolean(process.env.FIRECRAWL_BASE_URL) || process.env.ENABLE_FIRECRAWL_CLOUD === '1'
  if (firecrawlAllowed && (!markdown || markdown.length < 200)) {
    if (process.env.AUDIT_DEBUG) console.error(`[fetchPage] FIRECRAWL fallback for ${url} (md=${markdown?.length ?? 0})`)
    try {
      const fc = await firecrawlScrape(url)
      return {
        url,
        markdown: fc.markdown || markdown || '',
        html: fc.html || html,
        links: fc.links?.length ? fc.links : links,
        metadata: Object.keys(fc.metadata).length ? fc.metadata : metaFrom(html),
        source: 'firecrawl',
      }
    } catch {
      // fall through with whatever we have — don't fail the whole audit
    }
  }

  if (process.env.AUDIT_DEBUG) console.error(`[fetchPage] ${url} source=${source} md=${markdown?.length ?? 0} html=${html.length}`)
  return { url, markdown: markdown || '', html, links, metadata: metaFrom(html), source }
}
