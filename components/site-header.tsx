import Link from 'next/link'
import { siteConfig } from '@/site.config'

function LogoMark() {
  // Tri-dot cluster in the channel gradient (SEO orange / AEO blue / GEO purple).
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true" className="shrink-0">
      <circle cx="7" cy="7" r="4.2" fill="#f97316" />
      <circle cx="15" cy="9" r="4.2" fill="#a855f7" />
      <circle cx="9" cy="15" r="4.2" fill="#ec4899" />
    </svg>
  )
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-md" style={{ background: 'rgba(255,255,255,0.7)' }}>
      <div
        className="mx-auto px-6 py-4 flex items-center justify-between"
        style={{ maxWidth: 'var(--container)' }}
      >
        <Link href="/" className="flex items-center gap-2.5 min-w-0">
          <LogoMark />
          <span
            className="text-base sm:text-lg font-bold tracking-tight whitespace-nowrap"
            style={{ color: 'var(--color-foreground)', fontFamily: 'var(--font-heading)' }}
          >
            answerplacement<span style={{ color: 'var(--color-muted-foreground)', fontWeight: 500 }}>.com</span>
          </span>
        </Link>

        <nav className="hidden md:flex gap-8 text-sm font-medium">
          {siteConfig.nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="transition-opacity hover:opacity-60"
              style={{ color: 'var(--color-foreground)' }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="hidden sm:inline text-sm font-medium transition-opacity hover:opacity-60"
            style={{ color: 'var(--color-foreground)' }}
          >
            Log in
          </Link>
          <Link href="/#audit" className="btn-primary text-sm whitespace-nowrap" style={{ padding: '0.6rem 1.1rem' }}>
            Get My Audit
          </Link>
        </div>
      </div>
    </header>
  )
}
