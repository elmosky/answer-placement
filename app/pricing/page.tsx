import Link from 'next/link'

export const metadata = {
  title: 'Pricing — AnswerPlacement',
  description: 'One-time SEO, AEO, and GEO visibility audit — scores plus a prioritized fix list, for $29.',
}

const INCLUDED = [
  'SEO, AEO & GEO scorecard (0–100 each)',
  'Every issue across all three channels',
  'What’s wrong, why it matters, and the exact fix',
  'Prioritized top fixes to tackle first',
  'Shareable report link',
  'Delivered in ~90 seconds',
]

function Check() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" className="shrink-0 mt-0.5" aria-hidden="true">
      <circle cx="9" cy="9" r="9" fill="var(--color-geo)" opacity="0.15" />
      <path d="M5.5 9.2l2.2 2.2 4.6-4.8" fill="none" stroke="var(--color-geo)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function PricingPage() {
  return (
    <div className="px-6 py-16">
      <div className="mx-auto text-center" style={{ maxWidth: '46rem' }}>
        <span
          className="inline-block text-xs font-semibold uppercase tracking-widest px-4 py-1.5 rounded-full"
          style={{ background: 'var(--color-accent)', color: 'var(--color-geo)' }}
        >
          Pricing
        </span>
        <h1 className="mt-6 font-bold" style={{ fontSize: 'clamp(2.2rem, 5vw, 3.4rem)' }}>
          One audit. One price.
        </h1>
        <p className="mt-5 text-lg" style={{ color: 'var(--color-muted-foreground)' }}>
          See exactly where you stand across Google, AI answers, and AI recommendations — and what to fix first.
        </p>
      </div>

      <div className="mx-auto mt-12" style={{ maxWidth: '30rem' }}>
        <div className="card p-8" style={{ borderColor: 'var(--color-geo)', boxShadow: '0 16px 44px -12px rgba(168,85,247,0.35)' }}>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-bold">$29</span>
            <span className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>one-time</span>
          </div>
          <p className="mt-2 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
            A complete three-channel visibility audit of your site.
          </p>
          <ul className="mt-6 space-y-3 text-sm">
            {INCLUDED.map((f) => (
              <li key={f} className="flex items-start gap-2.5">
                <Check />
                <span>{f}</span>
              </li>
            ))}
          </ul>
          <Link href="/audit" className="btn-primary justify-center mt-7 w-full">
            Get my audit — $29 →
          </Link>
        </div>
      </div>
    </div>
  )
}
