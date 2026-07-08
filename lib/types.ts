export type ThemeName = 'minimal' | 'magazine' | 'modern' | 'editorial' | 'answerplacement'

export type ThemeTokens = {
  colors: {
    brand: string
    brandHover: string
    background: string
    foreground: string
    muted: string
    mutedForeground: string
    border: string
    accent: string
  }
  fonts: {
    sans: string
    serif: string
    mono: string
    heading: string
    body: string
  }
  radius: {
    sm: string
    md: string
    lg: string
    full: string
  }
  spacing: {
    container: string
    section: string
  }
  layout: {
    homepage: 'hero-rates' | 'magazine-grid' | 'minimal-list' | 'editorial-feature'
    blogIndex: 'grid' | 'list' | 'magazine'
    postLayout: 'centered' | 'wide' | 'sidebar'
  }
}

export type SiteFeatures = {
  blog: boolean
  ratesTable: boolean
  calculator: boolean
  products: boolean
  newsletter: boolean
}

export type SiteConfig = {
  name: string
  tagline: string
  description: string
  domain: string
  url: string
  theme: ThemeName
  themeOverrides?: Partial<{
    colors: Partial<ThemeTokens['colors']>
    fonts: Partial<ThemeTokens['fonts']>
    radius: Partial<ThemeTokens['radius']>
    spacing: Partial<ThemeTokens['spacing']>
    layout: Partial<ThemeTokens['layout']>
  }>
  features: SiteFeatures
  nav: { label: string; href: string }[]
  seo: {
    defaultOgImage: string
    twitterHandle: string
    googleSiteVerification: string
  }
  footer: {
    copyright: string
    disclaimer: string
  }
}

export type Post = {
  id: string
  title: string
  slug: string
  status: 'draft' | 'published' | 'archived'
  category: string
  excerpt: string
  body_html: string
  focus_keyword: string
  seo_title: string
  meta_description: string
  canonical_url: string | null
  og_image: string | null
  featured_image: string | null
  author: string
  tags: string[]
  read_time: number | null
  schema_type: string
  is_featured: boolean
  published_at: string | null
  created_at: string
  updated_at: string
  seo_score: number | null
}

export type PostSummary = Pick<
  Post,
  'id' | 'title' | 'slug' | 'excerpt' | 'category' | 'featured_image' | 'created_at' | 'read_time' | 'status'
>

export type BankRate = {
  id: string
  name: string
  short_name: string
  type: string
  min_deposit: number
  lockup: string
  protection: string
  fees: string
  best_for: string
  url: string
  apy: number
  updated_at: string
}
