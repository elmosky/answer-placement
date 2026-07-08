// v1 orchestrator: crawl homepage + a few internal pages, extract signals,
// grade with Claude, assemble the report.

import { fetchPage } from './fetch-page'
import { extractSignals } from './signals'
import { grade } from './grade'
import type { AuditReport } from './types'

const MAX_INTERNAL_PAGES = 2
const CONTENT_CHARS = 4000

function normalizeUrl(input: string): string {
  const u = input.trim()
  return /^https?:\/\//i.test(u) ? u : `https://${u}`
}

// Pick a few contentful same-origin pages from the homepage's links.
function pickInternalPages(origin: string, links: string[], homepage: string): string[] {
  const seen = new Set<string>([homepage.replace(/\/$/, '')])
  const picked: string[] = []
  const skip = /\.(png|jpe?g|gif|svg|webp|css|js|pdf|ico|xml|zip)(\?|$)/i
  for (const raw of links) {
    if (picked.length >= MAX_INTERNAL_PAGES) break
    let abs: string
    try {
      abs = new URL(raw, origin).toString()
    } catch {
      continue
    }
    if (!abs.startsWith(origin)) continue
    if (skip.test(abs)) continue
    const key = abs.replace(/#.*$/, '').replace(/\/$/, '')
    if (seen.has(key)) continue
    seen.add(key)
    picked.push(abs)
  }
  return picked
}

export async function runAudit(inputUrl: string): Promise<AuditReport> {
  const url = normalizeUrl(inputUrl)
  const origin = new URL(url).origin

  const home = await fetchPage(url)
  const internalUrls = pickInternalPages(origin, home.links, url)

  const internal = await Promise.all(
    internalUrls.map((u) => fetchPage(u).catch(() => null)),
  )
  const scrapedPages = [home, ...internal.filter((p): p is NonNullable<typeof p> => p !== null)]

  const signals = await extractSignals(origin, home.html)

  const pages = scrapedPages.map((p) => ({
    url: p.url,
    title: (p.metadata.title as string) ?? null,
    metaDescription: (p.metadata.description as string) ?? null,
    content: p.markdown.slice(0, CONTENT_CHARS),
  }))

  const graded = await grade({ url, signals, pages })

  return {
    url,
    scannedAt: new Date().toISOString(),
    pagesCrawled: scrapedPages.map((p) => p.url),
    ...graded,
  }
}
