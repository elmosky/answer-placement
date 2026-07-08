/**
 * Per-site configuration. This file is what makes each site unique.
 * Change values here, redeploy, and the site transforms.
 *
 * To swap themes entirely, change `theme` to one of the preset names.
 * To customize, override individual tokens in `themeOverrides`.
 */

import type { SiteConfig } from '@/lib/types'

export const siteConfig: SiteConfig = {
  // Identity
  name: 'answerplacement',
  tagline: 'Become the answer',
  description:
    'Search has evolved. AnswerPlacement audits your site across SEO, AEO, and GEO so your brand can be found in search, cited in AI answers, and recommended by AI tools.',
  domain: 'answerplacement.com',
  url: 'https://answerplacement.com',

  theme: 'answerplacement',

  // Feature flags — turn pieces on/off per site
  features: {
    blog: true,
    ratesTable: false,
    calculator: false,
    products: false,
    newsletter: false,
  },

  // Navigation
  nav: [
    { label: 'How It Works', href: '/how-it-works' },
    { label: 'Sample Report', href: '/sample-report' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'Resources', href: '/resources' },
  ],

  // SEO defaults
  seo: {
    defaultOgImage: '/og-default.png',
    twitterHandle: '',
    googleSiteVerification: '',
  },

  // Footer
  footer: {
    copyright: 'AnswerPlacement',
    disclaimer: 'Become the answer. Not just another result.',
  },
}
