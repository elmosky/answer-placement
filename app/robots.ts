import type { MetadataRoute } from 'next'
import { siteConfig } from '@/site.config'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Post-checkout report pages hold a customer's own audit. Nothing to index.
      disallow: ['/api/', '/audit/result', '/admin'],
    },
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  }
}
