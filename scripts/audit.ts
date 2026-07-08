// CLI: run the v1 audit engine against a URL and print + save the report.
// Usage: doppler run -p qwen-writer -c dev -- npx tsx scripts/audit.ts <url>

import { writeFileSync } from 'node:fs'
import { runAudit } from '../lib/audit/engine'
import type { ChannelResult, Finding } from '../lib/audit/types'

function bar(score: number): string {
  const filled = Math.round(score / 10)
  return `${'█'.repeat(filled)}${'░'.repeat(10 - filled)} ${score}/100`
}

function printChannel(name: string, c: ChannelResult) {
  console.log(`\n${name}  ${bar(c.score)}`)
  for (const f of c.findings) {
    console.log(`  [${f.severity.toUpperCase()}] ${f.issue}`)
    console.log(`        fix: ${f.fix}`)
  }
}

async function main() {
  const url = process.argv[2]
  if (!url) {
    console.error('Usage: tsx scripts/audit.ts <url>')
    process.exit(1)
  }

  console.log(`\nAuditing ${url} …`)
  const t0 = Date.now()
  const report = await runAudit(url)
  const secs = ((Date.now() - t0) / 1000).toFixed(1)

  console.log(`\n${'='.repeat(60)}`)
  console.log(`ANSWER PLACEMENT REPORT — ${report.url}`)
  console.log(`Pages crawled: ${report.pagesCrawled.length} · ${secs}s`)
  console.log('='.repeat(60))
  console.log(`\n${report.summary}`)

  printChannel('SEO  · Be found      ', report.seo)
  printChannel('AEO  · Be cited      ', report.aeo)
  printChannel('GEO  · Be recommended', report.geo)

  console.log('\nTOP PRIORITY FIXES:')
  report.topIssues.forEach((f: Finding, i: number) =>
    console.log(`  ${i + 1}. [${f.severity}] ${f.issue}`),
  )

  const out = `/private/tmp/claude-501/-Users-alexmoskov/a5ddc100-cc24-4405-8b68-909e408260be/scratchpad/audit-${Date.now()}.json`
  writeFileSync(out, JSON.stringify(report, null, 2))
  console.log(`\nFull JSON: ${out}\n`)
}

main().catch((e) => {
  console.error('\nAudit failed:', e)
  process.exit(1)
})
