import type { Metadata } from 'next'
import Script from 'next/script'
import './globals.css'
import { siteConfig } from '@/site.config'
import { resolveTheme, themeToCssVars } from '@/themes'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'

const theme = resolveTheme(siteConfig.theme, siteConfig.themeOverrides)
const cssVars = themeToCssVars(theme)

export const metadata: Metadata = {
  title: {
    default: `${siteConfig.name} — ${siteConfig.tagline}`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  metadataBase: new URL(siteConfig.url),
  openGraph: {
    type: 'website',
    siteName: siteConfig.name,
    title: `${siteConfig.name} — ${siteConfig.tagline}`,
    description: siteConfig.description,
  },
  twitter: {
    card: 'summary_large_image',
    title: `${siteConfig.name} — ${siteConfig.tagline}`,
    description: siteConfig.description,
  },
  verification: siteConfig.seo.googleSiteVerification
    ? { google: siteConfig.seo.googleSiteVerification }
    : undefined,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const inlineStyle = Object.entries(cssVars)
    .map(([k, v]) => `${k}: ${v}`)
    .join('; ')

  return (
    <html lang="en" style={{ cssText: inlineStyle } as React.CSSProperties}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link
          href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700,900&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <style dangerouslySetInnerHTML={{ __html: `:root { ${inlineStyle} }` }} />
      </head>
      <body className="min-h-screen flex flex-col">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-P45KNLD5Q0"
        strategy="afterInteractive"
      />
      <Script id="ga4" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-P45KNLD5Q0');`}
      </Script>
    </html>
  )
}
