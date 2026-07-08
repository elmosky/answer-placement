// LLM grading: one Claude pass scores all three channels from the crawled
// content + deterministic signals, returning structured findings.

import Anthropic from '@anthropic-ai/sdk'
import type { AuditReport } from './types'
import type { SiteSignals } from './signals'

const client = new Anthropic() // reads ANTHROPIC_API_KEY

export type GradeInput = {
  url: string
  signals: SiteSignals
  pages: { url: string; title: string | null; metaDescription: string | null; content: string }[]
}

const FINDING = {
  type: 'object',
  additionalProperties: false,
  required: ['severity', 'issue', 'why', 'fix'],
  properties: {
    severity: { type: 'string', enum: ['high', 'medium', 'low'] },
    issue: { type: 'string' },
    why: { type: 'string' },
    fix: { type: 'string' },
  },
}

const CHANNEL = {
  type: 'object',
  additionalProperties: false,
  required: ['score', 'findings'],
  properties: {
    score: { type: 'integer' },
    findings: { type: 'array', items: FINDING },
  },
}

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['seo', 'aeo', 'geo', 'topIssues', 'summary'],
  properties: {
    seo: CHANNEL,
    aeo: CHANNEL,
    geo: CHANNEL,
    topIssues: { type: 'array', items: FINDING },
    summary: { type: 'string' },
  },
}

const SYSTEM = `You are the grading engine for AnswerPlacement, an AI-search visibility audit.
Score a website across three channels, each 0–100, based ONLY on the crawled content and signals provided. Do not invent facts about the site.

SEO — Be found (rank in Google): keyword/intent alignment, title & meta quality, heading structure, content depth, internal linking, technical health (sitemap, indexability).
AEO — Be cited (get into AI Overviews / answer engines): answer-focused content, FAQ coverage, structured data/schema, clear definitions, snippet-friendly formatting, AI-crawler access (robots.txt, llms.txt).
GEO — Be recommended (AI assistants recommend the brand): brand & entity clarity, product/use-case positioning, "best for" framing, comparison pages, review/proof/trust signals, third-party credibility.

Scoring: 0–40 poor, 41–70 average, 71–100 strong. Be fair but honest — most small sites score 40–70. Ground every score in observable evidence.

For each channel return 2–5 specific findings (severity · issue · why it hurts THIS channel · concrete fix). Then a prioritized topIssues list (the 3–5 highest-leverage fixes across all channels), and a 2–3 sentence plain-English summary a founder would understand. Never promise guaranteed rankings.`

export async function grade(input: GradeInput): Promise<Omit<AuditReport, 'url' | 'scannedAt' | 'pagesCrawled'>> {
  const msg = await client.messages.create({
    model: 'claude-opus-4-8',
    max_tokens: 8000,
    thinking: { type: 'adaptive' },
    system: SYSTEM,
    // Structured output — API-level canonical param (SDK may not type it yet; tsx doesn't typecheck).
    output_config: { format: { type: 'json_schema', schema: SCHEMA } },
    messages: [{ role: 'user', content: JSON.stringify(input) }],
  } as Anthropic.MessageCreateParamsNonStreaming)

  const text = msg.content.find((b): b is Anthropic.TextBlock => b.type === 'text')?.text ?? ''
  return JSON.parse(text)
}
