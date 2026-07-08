// Deterministic, LLM-free signal extraction from raw HTML + well-known files.
// These feed the grader as ground truth so scores aren't purely vibes.

export type SiteSignals = {
  title: string | null
  metaDescription: string | null
  h1Count: number
  schemaTypes: string[] // JSON-LD @type values found on the homepage
  robotsTxt: string | null
  aiBotsBlocked: string[] // AI crawlers explicitly disallowed in robots.txt
  llmsTxtPresent: boolean
  sitemapPresent: boolean
}

export async function fetchText(url: string): Promise<string | null> {
  try {
    const r = await fetch(url, { redirect: 'follow' })
    return r.ok ? await r.text() : null
  } catch {
    return null
  }
}

export async function headOk(url: string): Promise<boolean> {
  try {
    const r = await fetch(url, { method: 'HEAD', redirect: 'follow' })
    return r.ok
  } catch {
    return false
  }
}

function extractSchemaTypes(html: string): string[] {
  const types = new Set<string>()
  const blocks = [...html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)]
  for (const [, raw] of blocks) {
    try {
      const parsed = JSON.parse(raw.trim())
      const nodes = Array.isArray(parsed) ? parsed : [parsed]
      for (const node of nodes) {
        const graph = node?.['@graph'] ? node['@graph'] : [node]
        for (const g of graph) {
          const t = g?.['@type']
          if (typeof t === 'string') types.add(t)
          else if (Array.isArray(t)) t.forEach((x) => typeof x === 'string' && types.add(x))
        }
      }
    } catch {
      // ignore malformed JSON-LD
    }
  }
  return [...types]
}

const AI_BOTS = ['GPTBot', 'ClaudeBot', 'Claude-Web', 'PerplexityBot', 'Google-Extended', 'CCBot', 'anthropic-ai']

function blockedAiBots(robots: string | null): string[] {
  if (!robots) return []
  const blocked: string[] = []
  // crude but effective: split into per-user-agent stanzas
  const stanzas = robots.split(/\n(?=user-agent:)/i)
  for (const bot of AI_BOTS) {
    const stanza = stanzas.find((s) => new RegExp(`user-agent:\\s*${bot}`, 'i').test(s))
    if (stanza && /disallow:\s*\//i.test(stanza)) blocked.push(bot)
  }
  return blocked
}

export async function extractSignals(origin: string, homepageHtml: string): Promise<SiteSignals> {
  const title = (homepageHtml.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] ?? '').trim() || null
  const metaDescription =
    homepageHtml.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i)?.[1]?.trim() ||
    homepageHtml.match(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i)?.[1]?.trim() ||
    null
  const h1Count = (homepageHtml.match(/<h1[\s>]/gi) ?? []).length

  const [robotsTxt, llmsTxt, sitemap] = await Promise.all([
    fetchText(`${origin}/robots.txt`),
    fetchText(`${origin}/llms.txt`),
    headOk(`${origin}/sitemap.xml`),
  ])

  return {
    title,
    metaDescription,
    h1Count,
    schemaTypes: extractSchemaTypes(homepageHtml),
    robotsTxt: robotsTxt ? robotsTxt.slice(0, 2000) : null,
    aiBotsBlocked: blockedAiBots(robotsTxt),
    llmsTxtPresent: llmsTxt !== null,
    sitemapPresent: sitemap,
  }
}
