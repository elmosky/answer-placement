import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ReportView } from '@/components/report-view'
import { supabaseAdmin } from '@/lib/supabase-admin'
import type { AuditReport } from '@/lib/audit/types'

export const dynamic = 'force-dynamic'

// Shareable, saved report. Next 16: params is async.
export default async function SavedReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { data, error } = await supabaseAdmin()
    .from('audits')
    .select('report')
    .eq('id', id)
    .maybeSingle()

  if (error || !data?.report) notFound()

  return (
    <div>
      <ReportView report={data.report as AuditReport} />
      <div className="mx-auto px-6 pb-16 text-center" style={{ maxWidth: 'var(--container)' }}>
        <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
          Want the deep, human-reviewed version with a prioritized roadmap?
        </p>
        <Link href="/pricing" className="btn-primary mt-4">See audit plans →</Link>
      </div>
    </div>
  )
}
