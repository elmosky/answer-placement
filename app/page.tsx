import Link from 'next/link'
import { AuditForm } from '@/components/audit-form'
import { ScrollReveals } from '@/components/scroll-reveals'

export const metadata = {
  title: 'AnswerPlacement — Be found. Be cited. Be recommended.',
  description:
    'Search has evolved. AnswerPlacement audits your site across SEO, AEO, and GEO so you show up in search results, AI answers, and AI recommendations.',
}

const MAX = 'var(--container)'

export default function HomePage() {
  return (
    <div>
      <ScrollReveals />
      <Hero />
      <ChannelCards />
      <TrustRow />
      <ValueProps />
      <CtaBand />
    </div>
  )
}

/* ─────────────────────────── Hero ─────────────────────────── */
function Hero() {
  return (
    <section id="audit" className="px-6 pt-16 pb-12 text-center">
      <div className="mx-auto" data-reveal style={{ maxWidth: '46rem' }}>
        <span
          className="inline-block text-xs font-semibold uppercase tracking-widest px-4 py-1.5 rounded-full"
          style={{ background: 'var(--color-accent)', color: 'var(--color-geo)' }}
        >
          The 3-Channel Search Audit
        </span>
        <h1 className="mt-6 font-bold leading-[1.05]" style={{ fontSize: 'clamp(2.6rem, 6vw, 4.5rem)' }}>
          Be found. Be cited.
          <br />
          Be <span className="text-gradient">recommended.</span>
        </h1>
        <p className="mt-6 text-lg mx-auto" style={{ maxWidth: '34rem', color: 'var(--color-muted-foreground)' }}>
          Your customers don&apos;t just Google anymore — they ask ChatGPT, Perplexity, and AI
          Overviews what to buy. We show you whether your brand is in those answers, and exactly
          what to fix to get there.
        </p>
        <div className="mt-9">
          <AuditForm />
        </div>
        <div
          className="mt-8 flex flex-wrap justify-center gap-x-7 gap-y-2 text-sm"
          style={{ color: 'var(--color-muted-foreground)' }}
        >
          <span>✓ AI-Powered Analysis</span>
          <span>✓ Actionable Fixes</span>
          <span>✓ Within 48 Hours</span>
        </div>
      </div>
    </section>
  )
}

/* ───────────────────────── Channel cards ───────────────────── */
type Channel = {
  n: number
  key: string
  color: string
  bigTitle: string
  sub: string
  blurb: string
  checks: string[]
  score: number
  visual: React.ReactNode
}

const CHANNELS: Channel[] = [
  {
    n: 1,
    key: 'SEO',
    color: 'var(--color-seo)',
    bigTitle: 'Be found',
    sub: 'Show up in Google results.',
    blurb: 'Rank your key pages for the terms your customers are searching for.',
    checks: ['Keyword & intent alignment', 'Technical SEO & site health', 'On-page & content optimization', 'Internal linking & authority'],
    score: 72,
    visual: <GoogleMock />,
  },
  {
    n: 2,
    key: 'AEO',
    color: 'var(--color-aeo)',
    bigTitle: 'Be cited',
    sub: 'Get into AI Overviews.',
    blurb: "Google's AI Overview pulls answers from trusted, relevant sources.",
    checks: ['Answer-focused content', 'FAQ & People Also Ask coverage', 'Schema & structured data', 'Content clarity & formatting'],
    score: 64,
    visual: <AiOverviewMock />,
  },
  {
    n: 3,
    key: 'GEO',
    color: 'var(--color-geo)',
    bigTitle: 'Be recommended',
    sub: 'Earn AI recommendations.',
    blurb: 'AI assistants recommend brands they understand and trust.',
    checks: ['Brand clarity & entity signals', 'Third-party trust & mentions', 'Comparison & positioning pages', 'Customer reviews & social proof'],
    score: 58,
    visual: <ChatGptMock />,
  },
]

function ChannelCards() {
  return (
    <section className="px-6 py-10">
      <div className="mx-auto grid gap-6 md:grid-cols-3" style={{ maxWidth: MAX }}>
        {CHANNELS.map((c, i) => (
          <div key={c.key} data-reveal style={{ ['--d' as string]: `${i * 0.1}s` }} className="card p-7 flex flex-col">
            <div className="flex items-center gap-2.5">
              <span
                className="flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold text-white"
                style={{ background: c.color }}
              >
                {c.n}
              </span>
              <span className="text-sm font-bold tracking-wide" style={{ color: c.color }}>
                {c.key}
              </span>
            </div>
            <h3 className="mt-4 text-2xl font-bold">{c.bigTitle}</h3>
            <p className="mt-1 font-medium">{c.sub}</p>
            <p className="mt-2 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
              {c.blurb}
            </p>

            <div className="mt-5">{c.visual}</div>

            <ul className="mt-5 space-y-2.5 text-sm">
              {c.checks.map((check) => (
                <li key={check} className="flex items-center gap-2.5">
                  <Check color={c.color} />
                  <span>{check}</span>
                </li>
              ))}
            </ul>

            <div className="mt-auto pt-6 flex items-end justify-between" style={{ borderTop: '1px solid var(--color-border)' }}>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: c.color }}>
                  {c.key} Score
                </div>
                <div className="text-3xl font-bold" style={{ color: c.color }}>
                  {c.score}
                  <span className="text-base font-medium" style={{ color: 'var(--color-muted-foreground)' }}>
                    /100
                  </span>
                </div>
              </div>
              <Sparkline color={c.color} />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function Check({ color }: { color: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" className="shrink-0" aria-hidden="true">
      <circle cx="9" cy="9" r="9" fill={color} opacity="0.15" />
      <path d="M5.5 9.2l2.2 2.2 4.6-4.8" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function Sparkline({ color }: { color: string }) {
  return (
    <svg width="96" height="40" viewBox="0 0 96 40" aria-hidden="true">
      <polyline
        points="0,32 16,26 32,29 48,18 64,22 80,10 96,6"
        fill="none"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/* ── Channel visuals — reproduce the search/answer mockups from the brief ── */
function Bar({ w }: { w: string }) {
  return <div className="h-2 rounded-full" style={{ width: w, background: 'var(--color-border)' }} />
}
function Thumb({ color }: { color: string }) {
  return <div className="w-9 h-9 rounded-md shrink-0" style={{ background: color, opacity: 0.18 }} />
}
function GoogleWord() {
  const letters: [string, string][] = [
    ['G', '#4285F4'], ['o', '#EA4335'], ['o', '#FBBC05'], ['g', '#4285F4'], ['l', '#34A853'], ['e', '#EA4335'],
  ]
  return (
    <span className="font-bold text-sm tracking-tight">
      {letters.map(([ch, c], i) => (
        <span key={i} style={{ color: c }}>{ch}</span>
      ))}
    </span>
  )
}

function GoogleMock() {
  return (
    <div className="rounded-xl p-3.5 bg-white" style={{ border: '1px solid var(--color-border)' }}>
      <div className="flex items-center gap-2 rounded-full px-3 py-1.5" style={{ border: '1px solid var(--color-border)' }}>
        <GoogleWord />
        <span className="flex-1 truncate text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
          best noise canceling headphones
        </span>
        <span className="text-xs" style={{ color: 'var(--color-seo)' }}>⌕</span>
      </div>
      <div className="flex gap-3 mt-2 text-[10px]" style={{ color: 'var(--color-muted-foreground)' }}>
        <span>All</span><span>Shopping</span><span>Images</span><span>News</span><span>More</span>
      </div>
      <div className="mt-3">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-4 h-4 rounded-full text-white text-[10px] font-bold" style={{ background: 'var(--color-seo)' }}>1</span>
          <span className="text-sm font-semibold" style={{ color: 'var(--color-seo)' }}>Sony WH-1000XM5</span>
        </div>
        <div className="text-[11px] mt-0.5" style={{ color: 'var(--color-muted-foreground)' }}>
          sony.com › headphones › wh-1000xm5
        </div>
        <p className="text-xs mt-1 leading-snug">
          Industry-leading noise canceling headphones with premium sound quality and all-day comfort.
        </p>
      </div>
      <div className="mt-3 space-y-2 opacity-50">
        <Bar w="85%" /><Bar w="65%" />
      </div>
    </div>
  )
}

function AiOverviewMock() {
  return (
    <div className="rounded-xl p-3.5 bg-white" style={{ border: '1px solid var(--color-border)' }}>
      <div className="flex items-center gap-1.5">
        <GoogleWord />
        <span className="text-xs font-semibold">AI Overview</span>
        <span className="ml-auto text-sm" style={{ color: 'var(--color-aeo)' }}>✦</span>
      </div>
      <p className="text-sm mt-2 leading-snug">
        The best noise canceling headphones overall are the Sony WH-1000XM5.
      </p>
      <div className="mt-2.5 rounded-lg p-2 flex items-center gap-2.5" style={{ border: '1px solid var(--color-border)' }}>
        <Thumb color="var(--color-aeo)" />
        <div className="text-xs flex-1">
          <div className="font-semibold">Sony WH-1000XM5</div>
          <div style={{ color: 'var(--color-muted-foreground)' }}>sony.com</div>
        </div>
        <span className="text-xs" style={{ color: 'var(--color-aeo)' }}>↗</span>
      </div>
      <div className="mt-2.5 space-y-2 opacity-50">
        <Bar w="80%" />
      </div>
    </div>
  )
}

function ChatGptMock() {
  return (
    <div className="rounded-xl p-3.5 bg-white" style={{ border: '1px solid var(--color-border)' }}>
      <div className="flex items-center gap-1.5">
        <span className="flex items-center justify-center w-4 h-4 rounded-full text-white text-[9px]" style={{ background: 'var(--color-geo)' }}>✱</span>
        <span className="text-xs font-semibold">ChatGPT</span>
      </div>
      <div className="mt-2 flex justify-end">
        <div className="text-xs rounded-2xl px-3 py-1.5" style={{ background: 'var(--color-muted)' }}>
          What are the best noise canceling headphones?
        </div>
      </div>
      <p className="text-sm mt-2 leading-snug">
        Based on sound quality, comfort, and reviews, I recommend the <strong>Sony WH-1000XM5</strong>.
      </p>
      <div className="mt-2.5 rounded-lg p-2 flex items-center gap-2.5" style={{ border: '1px solid var(--color-border)' }}>
        <Thumb color="var(--color-geo)" />
        <div className="text-xs flex-1">
          <div className="font-semibold">Sony WH-1000XM5</div>
          <div style={{ color: 'var(--color-muted-foreground)' }}>$348 · Sony</div>
          <div className="font-medium" style={{ color: 'var(--color-geo)' }}>View on Sony.com ↗</div>
        </div>
      </div>
    </div>
  )
}

/* ───────────────────────── Trust row ───────────────────────── */
function TrustRow() {
  const BRANDS = [
    {
      name: 'Zulvata',
      style: { fontFamily: 'Georgia, "Times New Roman", serif', fontWeight: 700, letterSpacing: '-0.03em', fontSize: '1.35rem' },
      mark: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
          <rect x="3" y="4" width="18" height="16" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
          <path d="M7 9h10M7 13h10M7 17h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      name: 'willmybagfuckingfit',
      style: { fontFamily: 'system-ui, -apple-system, sans-serif', fontWeight: 800, letterSpacing: '-0.02em', fontSize: '1.1rem' },
      mark: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
          <rect x="4" y="7" width="16" height="13" rx="2" stroke="currentColor" strokeWidth="1.8" />
          <path d="M9 7V5.5A2.5 2.5 0 0 1 11.5 3h1A2.5 2.5 0 0 1 15 5.5V7M9 11.5v5M15 11.5v5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      name: 'SoyFreeSnacks',
      style: { fontFamily: '"Trebuchet MS", system-ui, sans-serif', fontWeight: 800, letterSpacing: '-0.01em', fontSize: '1.2rem' },
      mark: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M20 4C10.5 4 5 9 5 15.5c0 1.5.3 2.9.9 4.1C7.5 13 12.5 8.8 19 7.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M4.5 20 20 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      ),
    },
  ]
  return (
    <section className="px-6 py-10">
      <div className="mx-auto text-center" data-reveal style={{ maxWidth: MAX }}>
        <p className="text-xs font-semibold uppercase tracking-widest mb-6" style={{ color: 'var(--color-muted-foreground)' }}>
          Trusted by growing brands
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-5">
          {BRANDS.map((b) => (
            <div
              key={b.name}
              className="flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity"
              style={{ color: 'var(--color-foreground)' }}
            >
              {b.mark}
              <span style={b.style}>{b.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────── Value props ───────────────────────── */
function ValueProps() {
  const items = [
    { icon: '📊', title: 'Clear Scores', body: 'See exactly where you stand across Google, AI answers, and AI recommendations.' },
    { icon: '🗺️', title: 'Actionable Roadmap', body: 'The highest-leverage fixes first — not a 200-item checklist.' },
    { icon: '⚡', title: 'Win More Visibility', body: 'Show up where buyers decide — and turn that visibility into customers.' },
    { icon: '⏱️', title: 'Fast Turnaround', body: 'A human-reviewed report, back in your inbox within 48 hours.' },
  ]
  return (
    <section className="px-6 py-14">
      <div className="mx-auto grid gap-10 md:grid-cols-[1.1fr_2fr] items-start" style={{ maxWidth: MAX }}>
        <div data-reveal>
          <h2 className="text-3xl font-bold leading-tight">
            One audit.
            <br />
            Three visibility layers.
            <br />
            Infinite <span className="text-gradient">opportunities.</span>
          </h2>
          <p className="mt-4 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
            You don&apos;t just get three scores. You get the exact pages, answers, and signals to
            fix first — and why each one moves the needle.
          </p>
        </div>
        <div className="grid gap-8 sm:grid-cols-2">
          {items.map((it, i) => (
            <div key={it.title} data-reveal style={{ ['--d' as string]: `${i * 0.08}s` }}>
              <div className="text-2xl">{it.icon}</div>
              <h3 className="mt-3 font-bold">{it.title}</h3>
              <p className="mt-1.5 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>{it.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ───────────────────────── CTA band ────────────────────────── */
function CtaBand() {
  return (
    <section className="px-6 py-10">
      <div
        data-reveal
        className="mx-auto card px-8 py-8 flex flex-col md:flex-row items-center justify-between gap-6"
        style={{ maxWidth: MAX }}
      >
        <div>
          <p className="text-xl font-bold">Don&apos;t just rank. Get chosen.</p>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
            See what Google and AI actually see when they look at your brand.
          </p>
        </div>
        <div className="text-center">
          <Link href="/#audit" className="btn-primary">Get My Search Visibility Report →</Link>
          <p className="mt-2 text-xs" style={{ color: 'var(--color-muted-foreground)' }}>One-time audit · $29</p>
        </div>
      </div>
    </section>
  )
}
