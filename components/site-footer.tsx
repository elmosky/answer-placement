import Link from 'next/link'
import { siteConfig } from '@/site.config'

export function SiteFooter() {
  return (
    <footer className="border-t mt-24" style={{ borderColor: 'var(--color-border)' }}>
      <div
        className="mx-auto px-6 py-12 flex flex-col md:flex-row justify-between gap-8"
        style={{ maxWidth: 'var(--container)' }}
      >
        <div className="max-w-xs">
          <div className="text-lg font-bold tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>
            answerplacement<span style={{ color: 'var(--color-muted-foreground)', fontWeight: 500 }}>.com</span>
          </div>
          <p className="mt-3 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
            {siteConfig.footer.disclaimer}
          </p>
        </div>

        <div className="flex gap-14 text-sm">
          <div className="flex flex-col gap-3">
            <span className="font-semibold">Product</span>
            <Link href="/how-it-works" style={{ color: 'var(--color-muted-foreground)' }}>How It Works</Link>
            <Link href="/sample-report" style={{ color: 'var(--color-muted-foreground)' }}>Sample Report</Link>
            <Link href="/pricing" style={{ color: 'var(--color-muted-foreground)' }}>Pricing</Link>
          </div>
          <div className="flex flex-col gap-3">
            <span className="font-semibold">Learn</span>
            <Link href="/blog" style={{ color: 'var(--color-muted-foreground)' }}>Blog</Link>
          </div>
          <div className="flex flex-col gap-3">
            <span className="font-semibold">Legal</span>
            <Link href="/privacy" style={{ color: 'var(--color-muted-foreground)' }}>Privacy</Link>
            <Link href="/terms" style={{ color: 'var(--color-muted-foreground)' }}>Terms</Link>
          </div>
        </div>
      </div>
      <div
        className="mx-auto px-6 pb-8 text-xs"
        style={{ maxWidth: 'var(--container)', color: 'var(--color-muted-foreground)' }}
      >
        © {new Date().getFullYear()} {siteConfig.footer.copyright}
      </div>
    </footer>
  )
}
