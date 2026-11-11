import 'server-only'
import { createFactoryClient, type FactoryClient } from '@elmosky/factory-db'

export const SITE_SLUG = 'answerplacement'

/**
 * The shared Site Factory database (ref plvuwopoqzgyddadtsvn, pinned inside
 * @elmosky/factory-db). Site-scoped tables (posts) go through `from()`, which
 * filters to this site and throws on errors instead of returning an empty list.
 *
 * AnswerPlacement's own table (answerplacement_audits) has no site_id, so it is
 * read through `.raw`. Every `.raw` call names its table.
 */
let cached: Promise<FactoryClient> | null = null

export function db(): Promise<FactoryClient> {
  return (cached ??= createFactoryClient({ siteSlug: SITE_SLUG }))
}

/** Service-role client for answerplacement_audits. Server-only. */
export async function auditsTable() {
  return (await db()).raw.from('answerplacement_audits')
}
