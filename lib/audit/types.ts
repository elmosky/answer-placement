// v1 audit engine — shared types.

export type Severity = 'high' | 'medium' | 'low'

export type Finding = {
  severity: Severity
  issue: string // what's wrong
  why: string // why it hurts visibility in this channel
  fix: string // the concrete fix
}

export type ChannelResult = {
  score: number // 0–100
  findings: Finding[]
}

export type AuditReport = {
  url: string
  scannedAt: string
  pagesCrawled: string[]
  seo: ChannelResult // Be found
  aeo: ChannelResult // Be cited
  geo: ChannelResult // Be recommended
  topIssues: Finding[] // prioritized across all three channels
  summary: string
}
