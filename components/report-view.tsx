// Renders an AuditReport. Pure props component (no 'use client', no server-only
// APIs) so it works inside both server pages and the client /audit page.

import type { AuditReport, ChannelResult, Finding, Severity } from '@/lib/audit/types'

const CHANNELS = [
  { key: 'seo' as const, n: 1, label: 'SEO', title: 'Be found', color: 'var(--color-seo)' },
  { key: 'aeo' as const, n: 2, label: 'AEO', title: 'Be cited', color: 'var(--color-aeo)' },
  { key: 'geo' as const, n: 3, label: 'GEO', title: 'Be recommended', color: 'var(--color-geo)' },
]

const SEV: Record<Severity, { bg: string; fg: string; label: string }> = {
  high: { bg: '#fef2f2', fg: '#dc2626', label: 'High' },
  medium: { bg: '#fffbeb', fg: '#d97706', label: 'Medium' },
  low: { bg: '#f8fafc', fg: '#64748b', label: 'Low' },
}

function SevChip({ s }: { s: Severity }) {
  const c = SEV[s]
  return (
    <span
      className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0"
      style={{ background: c.bg, color: c.fg }}
    >
      {c.label}
    </span>
  )
}

function FindingRow({ f }: { f: Finding }) {
  return (
    <li className="flex gap-3">
      <SevChip s={f.severity} />
      <div className="min-w-0">
        <p className="text-sm font-medium">{f.issue}</p>
        <p className="mt-0.5 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>{f.why}</p>
        <p className="mt-1 text-sm">
          <span className="font-semibold">Fix: </span>
          {f.fix}
        </p>
      </div>
    </li>
  )
}

function ScoreCard({ c, data }: { c: (typeof CHANNELS)[number]; data: ChannelResult }) {
  return (
    <div className="card p-6 flex flex-col">
      <div className="flex items-center gap-2.5">
        <span
          className="flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold text-white"
          style={{ background: c.color }}
        >
          {c.n}
        </span>
        <span className="text-sm font-bold tracking-wide" style={{ color: c.color }}>{c.label}</span>
        <span className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>· {c.title}</span>
      </div>

      <div className="mt-4 flex items-end gap-1">
        <span className="text-4xl font-bold" style={{ color: c.color }}>{data.score}</span>
        <span className="text-base font-medium mb-1" style={{ color: 'var(--color-muted-foreground)' }}>/100</span>
      </div>
      <div className="mt-2 h-2 rounded-full overflow-hidden" style={{ background: 'var(--color-muted)' }}>
        <div className="h-full rounded-full" style={{ width: `${data.score}%`, background: c.color }} />
      </div>

      <ul className="mt-5 space-y-4">
        {data.findings.map((f, i) => (
          <FindingRow key={i} f={f} />
        ))}
      </ul>
    </div>
  )
}

export function ReportView({ report }: { report: AuditReport }) {
  let host = report.url
  try {
    host = new URL(report.url).host
  } catch {}

  return (
    <div className="mx-auto px-6 py-12" style={{ maxWidth: 'var(--container)' }}>
      <span
        className="inline-block text-xs font-semibold uppercase tracking-widest px-4 py-1.5 rounded-full"
        style={{ background: 'var(--color-accent)', color: 'var(--color-geo)' }}
      >
        Search Visibility Report
      </span>
      <h1 className="mt-4 text-3xl font-bold break-words">{host}</h1>
      <p className="mt-1 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
        {report.pagesCrawled.length} pages analyzed · {new Date(report.scannedAt).toLocaleDateString()}
      </p>

      <p className="mt-6 text-lg leading-relaxed" style={{ maxWidth: '46rem' }}>{report.summary}</p>

      <div className="mt-10 grid gap-6 md:grid-cols-3 items-start">
        {CHANNELS.map((c) => (
          <ScoreCard key={c.key} c={c} data={report[c.key]} />
        ))}
      </div>

      <div className="mt-10 card p-7">
        <h2 className="text-xl font-bold">Top priority fixes</h2>
        <ol className="mt-4 space-y-4">
          {report.topIssues.map((f, i) => (
            <li key={i} className="flex gap-3">
              <span
                className="flex items-center justify-center w-6 h-6 rounded-full text-white text-xs font-bold shrink-0"
                style={{ background: 'var(--color-foreground)' }}
              >
                {i + 1}
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <SevChip s={f.severity} />
                  <p className="text-sm font-semibold">{f.issue}</p>
                </div>
                <p className="mt-1 text-sm">
                  <span className="font-semibold">Fix: </span>
                  {f.fix}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}
