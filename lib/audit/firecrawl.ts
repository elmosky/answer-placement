// Firecrawl scrape with automatic primary→backup key failover.
// Policy: if the primary key is out of credits (402), fall back to the backup
// automatically — no prompting. Keys live in Doppler qwen-writer/dev.

const KEYS = [
  process.env.FIRECRAWL_API_KEY,
  process.env.FIRECRAWL_API_KEY_BACKUP,
].filter(Boolean) as string[]

// Override to point at a self-hosted Firecrawl (option 3), e.g.
// FIRECRAWL_BASE_URL=http://your-host:3002/v1 — no code change, no credits.
const BASE = process.env.FIRECRAWL_BASE_URL || 'https://api.firecrawl.dev/v2'

export type ScrapedPage = {
  url: string
  markdown: string
  html: string
  links: string[]
  metadata: Record<string, unknown>
}

export async function scrape(url: string): Promise<ScrapedPage> {
  if (KEYS.length === 0) throw new Error('No FIRECRAWL_API_KEY(_BACKUP) in env')
  let lastErr: unknown
  for (const key of KEYS) {
    try {
      const res = await fetch(`${BASE}/scrape`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, formats: ['markdown', 'html', 'links'], onlyMainContent: false }),
      })
      if (res.status === 402) {
        lastErr = new Error('Firecrawl 402 (out of credits) — trying next key')
        continue
      }
      if (!res.ok) {
        lastErr = new Error(`Firecrawl ${res.status}: ${(await res.text()).slice(0, 200)}`)
        continue
      }
      const json = (await res.json()) as { data?: Record<string, unknown> } & Record<string, unknown>
      const d = (json.data ?? json) as Record<string, unknown>
      return {
        url,
        markdown: (d.markdown as string) ?? '',
        html: (d.html as string) ?? '',
        links: (d.links as string[]) ?? [],
        metadata: (d.metadata as Record<string, unknown>) ?? {},
      }
    } catch (e) {
      lastErr = e
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr))
}
