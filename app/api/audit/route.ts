import { runAudit } from '@/lib/audit/engine'
import { auditsTable } from '@/lib/db'
import { stripe } from '@/lib/stripe'

// The engine crawls + grades (~60–90s), so this must not be a short-timeout
// request. Vercel reads maxDuration from the build output.
export const maxDuration = 300
export const dynamic = 'force-dynamic'

// Runs ONLY for a paid Stripe Checkout session — this is the paywall. No free
// {url} path, so the audit (and its token cost) can't be triggered without $29.
export async function POST(request: Request) {
  let sessionId: string | undefined
  try {
    sessionId = (await request.json())?.sessionId
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  if (!sessionId || typeof sessionId !== 'string') {
    return Response.json({ error: 'Missing payment session' }, { status: 400 })
  }

  // Verify payment.
  let session
  try {
    session = await stripe().checkout.sessions.retrieve(sessionId)
  } catch {
    return Response.json({ error: 'Invalid payment session' }, { status: 400 })
  }
  if (session.payment_status !== 'paid') {
    return Response.json({ error: 'Payment not completed' }, { status: 402 })
  }

  // Idempotent: if this paid session already produced a report, return it
  // (so a refresh doesn't re-run the engine or look like a second charge).
  const existing = await (await auditsTable())
    .select('id, report')
    .eq('stripe_session_id', sessionId)
    .maybeSingle()
  if (existing.data?.report) {
    return Response.json({ id: existing.data.id, ...existing.data.report })
  }

  const url = session.metadata?.url
  if (!url) return Response.json({ error: 'No site on this session' }, { status: 400 })
  const email = session.customer_details?.email ?? null

  try {
    const report = await runAudit(url)
    const { data, error } = await (await auditsTable())
      .insert({
        url: report.url,
        email,
        seo_score: report.seo.score,
        aeo_score: report.aeo.score,
        geo_score: report.geo.score,
        report,
        stripe_session_id: sessionId,
      })
      .select('id')
      .single()
    if (error) throw error
    return Response.json({ id: data.id, ...report })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Audit failed'
    return Response.json({ error: message }, { status: 500 })
  }
}
