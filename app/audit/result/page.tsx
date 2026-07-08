'use client'

import { useEffect, useRef, useState } from 'react'
import { ReportView } from '@/components/report-view'
import type { AuditReport } from '@/lib/audit/types'

type Status = 'running' | 'done' | 'error'

const STEPS = [
  'Crawling your pages…',
  'Checking SEO signals — Be found',
  'Checking AEO signals — Be cited',
  'Checking GEO signals — Be recommended',
  'Writing your prioritized fix list…',
]

// Post-checkout: run the audit and show the full report.
// TODO(stripe): read ?session_id, verify it's paid before running.
export default function AuditResultPage() {
  const [status, setStatus] = useState<Status>('running')
  const [report, setReport] = useState<AuditReport | null>(null)
  const [auditId, setAuditId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [step, setStep] = useState(0)
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return // guard against double-run in strict mode
    started.current = true
    const sessionId = new URLSearchParams(window.location.search).get('session_id')
    if (!sessionId) {
      setError('No payment session found. Please start from the audit page.')
      setStatus('error')
      return
    }
    ;(async () => {
      try {
        const res = await fetch('/api/audit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Audit failed')
        setReport(data)
        setAuditId(data.id)
        setStatus('done')
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Audit failed')
        setStatus('error')
      }
    })()
  }, [])

  useEffect(() => {
    if (status !== 'running') return
    const id = setInterval(() => setStep((s) => (s + 1) % STEPS.length), 14000)
    return () => clearInterval(id)
  }, [status])

  if (status === 'done' && report) {
    return (
      <div>
        <ReportView report={report} />
        {auditId && (
          <div className="mx-auto px-6 pb-16 text-center" style={{ maxWidth: 'var(--container)' }}>
            <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
              Saved report:{' '}
              <a href={`/audit/${auditId}`} className="font-semibold underline">
                answerplacement.com/audit/{auditId.slice(0, 8)}
              </a>
            </p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="mx-auto px-6 py-24 text-center" style={{ maxWidth: '40rem' }}>
      {status === 'running' ? (
        <>
          <div className="mx-auto w-10 h-10 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--color-border)', borderTopColor: 'var(--color-geo)' }} />
          <p className="mt-5 text-lg font-semibold">{STEPS[step]}</p>
          <p className="mt-2 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
            Building your report — this takes up to ~90 seconds. Don&apos;t close this tab.
          </p>
        </>
      ) : (
        <p className="text-sm" style={{ color: '#dc2626' }}>{error}</p>
      )}
    </div>
  )
}
