import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

// Attach a captured email to a saved audit (the lead-capture step).
export async function POST(request: Request) {
  let body: { auditId?: string; email?: string }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  const { auditId, email } = body
  if (!auditId || !email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return Response.json({ error: 'A valid email and auditId are required' }, { status: 400 })
  }

  const { error } = await supabaseAdmin().from('audits').update({ email }).eq('id', auditId)
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true })
}
