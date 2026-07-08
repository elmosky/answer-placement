import Link from 'next/link'
import { ReportView } from '@/components/report-view'
import sample from '@/lib/audit/sample-report.json'
import type { AuditReport } from '@/lib/audit/types'

export const metadata = {
  title: 'Sample Report — AnswerPlacement',
  description: 'See exactly what an AnswerPlacement audit delivers: SEO, AEO, and GEO scores with a prioritized fix list.',
}

export default function SampleReportPage() {
  return (
    <div>
      <ReportView report={sample as AuditReport} />
      <div className="mx-auto px-6 pb-16 text-center" style={{ maxWidth: 'var(--container)' }}>
        <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
          This is a live example. Run one on your own site.
        </p>
        <Link href="/audit" className="btn-primary mt-4">Analyze my site →</Link>
      </div>
    </div>
  )
}
