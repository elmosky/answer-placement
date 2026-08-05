import Link from 'next/link'

export const metadata = {
  title: 'How It Works — AnswerPlacement',
  description: 'How AnswerPlacement audits your site across SEO, AEO, and GEO — what we check, and why it matters.',
  alternates: { canonical: '/how-it-works' },
}

const MAX = 'var(--container)'

const STEPS = [
  { n: 1, title: 'Enter your site', body: 'Drop in your URL. We read your homepage and key pages the way a search engine and an AI assistant would.' },
  { n: 2, title: 'We analyze three channels', body: 'Your content is graded across SEO, AEO, and GEO — the three ways customers now find and choose brands.' },
  { n: 3, title: 'Get scores + a fix list', body: 'Three 0–100 scores and a prioritized list of exactly what to fix first, why it matters, and how to fix it. In ~90 seconds.' },
]

const CHANNELS = [
  {
    key: 'SEO', title: 'Be found', color: 'var(--color-seo)',
    blurb: 'Whether Google can rank you for the terms your customers search.',
    checks: ['Keyword & intent alignment', 'Titles, metadata & headings', 'Content depth', 'Internal linking', 'Technical health (sitemap, indexability)'],
  },
  {
    key: 'AEO', title: 'Be cited', color: 'var(--color-aeo)',
    blurb: 'Whether AI Overviews and answer engines can extract and cite you.',
    checks: ['Answer-focused content', 'FAQ & question coverage', 'Structured data / schema', 'Snippet-friendly formatting', 'AI-crawler access (robots.txt, llms.txt)'],
  },
  {
    key: 'GEO', title: 'Be recommended', color: 'var(--color-geo)',
    blurb: 'Whether AI assistants understand and trust your brand enough to recommend it.',
    checks: ['Brand & entity clarity', 'Product & "best for" positioning', 'Comparison pages', 'Review & proof signals', 'Third-party credibility'],
  },
]

export default function HowItWorksPage() {
  return (
    <div className="px-6 py-16">
      <div className="mx-auto text-center" style={{ maxWidth: '46rem' }}>
        <span
          className="inline-block text-xs font-semibold uppercase tracking-widest px-4 py-1.5 rounded-full"
          style={{ background: 'var(--color-accent)', color: 'var(--color-geo)' }}
        >
          How it works
        </span>
        <h1 className="mt-6 font-bold" style={{ fontSize: 'clamp(2.2rem, 5vw, 3.4rem)' }}>
          What we check, and why it matters.
        </h1>
        <p className="mt-5 text-lg" style={{ color: 'var(--color-muted-foreground)' }}>
          Search used to be one channel. Now your customers find brands through Google, AI Overviews,
          ChatGPT, and Perplexity — and each one judges you differently. We score all three.
        </p>
      </div>

      {/* Steps */}
      <div className="mx-auto mt-14 grid gap-6 md:grid-cols-3" style={{ maxWidth: MAX }}>
        {STEPS.map((s) => (
          <div key={s.n} className="card p-7">
            <span
              className="flex items-center justify-center w-9 h-9 rounded-full text-white font-bold"
              style={{ background: 'var(--color-foreground)' }}
            >
              {s.n}
            </span>
            <h3 className="mt-4 text-lg font-bold">{s.title}</h3>
            <p className="mt-2 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>{s.body}</p>
          </div>
        ))}
      </div>

      {/* Channels */}
      <div className="mx-auto mt-16" style={{ maxWidth: MAX }}>
        <h2 className="text-2xl font-bold text-center">The three channels we grade</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {CHANNELS.map((c) => (
            <div key={c.key} className="card p-7">
              <div className="text-sm font-bold tracking-wide" style={{ color: c.color }}>{c.key}</div>
              <h3 className="mt-1 text-xl font-bold">{c.title}</h3>
              <p className="mt-2 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>{c.blurb}</p>
              <ul className="mt-4 space-y-2 text-sm">
                {c.checks.map((check) => (
                  <li key={check} className="flex items-start gap-2.5">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: c.color }} />
                    <span>{check}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto mt-16 text-center" style={{ maxWidth: '40rem' }}>
        <h2 className="text-2xl font-bold">Don&apos;t just rank. Get chosen.</h2>
        <p className="mt-3 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
          A complete three-channel audit of your site, with a prioritized fix list — $29, delivered in ~90 seconds.
        </p>
        <Link href="/audit" className="btn-primary mt-6">Get my audit — $29 →</Link>
      </div>
    </div>
  )
}
