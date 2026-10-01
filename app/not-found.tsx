import Link from 'next/link'
import { siteConfig } from '@/site.config'

// Renders inside the root layout, so the header and footer stay put. The job is
// to send the reader somewhere real instead of ending the visit.
export const metadata = { title: 'Page not found' }

export default function NotFound() {
  return (
    <div className="mx-auto px-6 py-24 text-center" style={{ maxWidth: '36rem' }}>
      <p
        className="text-sm font-semibold uppercase tracking-widest"
        style={{ color: 'var(--color-muted-foreground)' }}
      >
        404
      </p>
      <h1 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight">This page isn&apos;t here</h1>
      <p className="mt-4" style={{ color: 'var(--color-muted-foreground)' }}>
        The link may be old, or the address may have a typo in it. These still work.
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/" className="btn-primary">
          Go to the homepage
        </Link>
        {siteConfig.nav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="inline-flex items-center px-5 py-3 text-sm font-medium border"
            style={{ borderColor: 'var(--color-border)', borderRadius: 'var(--radius-full)', background: '#fff' }}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  )
}
